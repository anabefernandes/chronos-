const Ponto = require('../models/Ponto');
const Holerite = require('../models/Holerite');
const Escala = require('../models/Escala');
const User = require('../models/User');
const Notificacao = require('../models/Notificacao');

function gerarHorarioEsperado(dataBase, horarioStr) {
  if (!horarioStr) return null;
  const [h, m] = horarioStr.split(':').map(Number);
  const d = new Date(dataBase);
  d.setHours(h, m, 0, 0);
  return d;
}
exports.tempoRestante = async (req, res, next) => {
  try {
    const funcionarioId = req.user.id;

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const agora = new Date();

    // pega os pontos do dia
    const pontosDoDia = await Ponto.find({
      funcionario: funcionarioId,
      horario: { $gte: hoje, $lt: new Date(hoje.getTime() + 86400000) }
    }).sort({ horario: 1 });

    // escala do dia
    const escala = await Escala.findOne({
      funcionario: funcionarioId,
      semanaInicio: { $lte: hoje },
      semanaFim: { $gte: hoje }
    });

    const diaEscala = escala?.dias.find(d => new Date(d.data).getTime() === hoje.getTime());

    // flags
    const temEntrada = pontosDoDia.some(p => p.status === 'entrada');
    const temAlmoco = pontosDoDia.some(p => p.status === 'almoco');
    const temRetorno = pontosDoDia.some(p => p.status === 'retorno');
    const temSaida = pontosDoDia.some(p => p.status === 'saida');

    const horaEntrada = gerarHorarioEsperado(hoje, diaEscala?.horaEntrada);
    const horaSaida = gerarHorarioEsperado(hoje, diaEscala?.horaSaida);

    const horaAlmoco = pontosDoDia.find(p => p.status === 'almoco')?.horario || null;

    res.json({
      pontoBatido: {
        entrada: temEntrada,
        almoco: temAlmoco,
        retorno: temRetorno,
        saida: temSaida
      },
      horaEntrada,
      horaAlmoco,
      horaSaida,
      duracaoAlmocoMinutos: 60
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
};

// 🕐 Função atualizada para calcular horas do dia com regras completas do almoço
function calcularHorasDoDiaComFlag(pontosDoDia) {
  let entrada = null;
  let almocoInicio = null;
  let almocoFim = null;
  let saida = null;

  // Capturar registros
  pontosDoDia.forEach(p => {
    const horario = new Date(p.horario);

    switch (p.status) {
      case 'entrada':
        entrada = horario;
        break;
      case 'almoco':
        almocoInicio = horario;
        break;
      case 'retorno':
        almocoFim = horario;
        break;
      case 'saida':
        saida = horario;
        break;
    }
  });

  // Se não tiver entrada ou saída, não calcula nada
  if (!entrada || !saida) return 0;

  // 🟦 1. Calcular tempo trabalhado MANHÃ
  let manha = 0;
  if (entrada && almocoInicio) {
    manha = (almocoInicio - entrada) / 3600000;
  }

  // 🟩 2. Calcular tempo trabalhado TARDE
  let tarde = 0;
  if (almocoFim && saida) {
    tarde = (saida - almocoFim) / 3600000;
  }

  // Se não tem almoço ou retorno, tratar como turno único
  let tempoTrabalhadoBruto = manha + tarde;

  // -----------------------------
  // 🔥 REGRAS DO ALMOÇO
  // -----------------------------
  let tempoAlmocoConsiderado = 1; // padrão 1h
  let atrasoAlmoco = 0;

  if (almocoInicio && almocoFim) {
    const duracaoAlmocoHoras = (almocoFim - almocoInicio) / 3600000;

    if (duracaoAlmocoHoras < 0.75) {
      // ❗ A) Menos de 45 min → usar o valor real
      tempoAlmocoConsiderado = duracaoAlmocoHoras;
    } else if (duracaoAlmocoHoras > 1.25) {
      // ❗ C) Mais de 1h15 → atraso no almoço
      tempoAlmocoConsiderado = 1;
      atrasoAlmoco = duracaoAlmocoHoras - 1;
    } else {
      // ✅ B) Dentro da faixa 45min–1h15 → conta 1h cravado
      tempoAlmocoConsiderado = 1;
    }
  }

  // 🟧 Tempo total final (descontando almoço considerado e atrasos)
  let horasTotais = manha + tarde;

  // Se houver atraso, ele vira descontado no holerite
  if (atrasoAlmoco > 0) {
    horasTotais -= atrasoAlmoco;
  }

  return horasTotais;
}

// 📍 Função para calcular distância
function calcularDistancia(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// -----------------------------
// Aux: converte "07:00" em Date (mesma data)
function gerarHorarioEsperado(dataBase, horarioStr) {
  if (!horarioStr) return null;
  const [h, m] = horarioStr.split(':').map(Number);
  const d = new Date(dataBase);
  d.setHours(h, m, 0, 0);
  return d;
}

exports.registrarPonto = async (req, res, next) => {
  try {
    const { status, localizacao } = req.body;
    const funcionarioId = req.user.id;

    // Validações iniciais
    if (!status) return res.status(400).json({ msg: 'Status é obrigatório' });
    if (!localizacao || !localizacao.latitude || !localizacao.longitude) {
      return res.status(400).json({ msg: 'Localização é obrigatória' });
    }

    // 📍 Local fixo de trabalho
    const LOCAL_TRABALHO = {
      latitude: -24.024648294927673,
      longitude: -46.488965661504366
    };
    //fatec -24.005000134697887, -46.41235625962236
    //casa ju -24.00013549493022, -46.43179800176456
    // ana: -24.024648294927673, -46.488965661504366
    const RAIO_PERMITIDO = 500; // metros

    const distancia = calcularDistancia(
      localizacao.latitude,
      localizacao.longitude,
      LOCAL_TRABALHO.latitude,
      LOCAL_TRABALHO.longitude
    );

    if (distancia > RAIO_PERMITIDO) {
      return res.status(403).json({
        msg: `Você está fora do local permitido para registrar o ponto. Distância: ${Math.round(distancia)}m`
      });
    }

    // 1️⃣ Criar o ponto
    const ponto = await Ponto.create({
      funcionario: funcionarioId,
      status,
      horario: new Date(),
      localizacao
    });

    const hoje = new Date(ponto.horario);
    hoje.setHours(0, 0, 0, 0);

    // 2️⃣ Verifica folga automática
    const escalaDoDia = await Escala.findOne({
      funcionario: funcionarioId,
      semanaInicio: { $lte: hoje },
      semanaFim: { $gte: hoje }
    });

    let diaEscalaHoje = null;
    if (escalaDoDia) {
      diaEscalaHoje = escalaDoDia.dias.find(d => {
        const dataDia = new Date(d.data);
        dataDia.setHours(0, 0, 0, 0);
        return dataDia.getTime() === hoje.getTime();
      });
    }

    if (diaEscalaHoje?.folga) {
      const novoStatus = 'Folga';
      await User.findByIdAndUpdate(funcionarioId, { status: novoStatus });
      req.app.get('io').emit('statusAtualizado', { userId: funcionarioId, novoStatus });

      return res.status(200).json({
        msg: 'Hoje é dia de folga ✅',
        novoStatus,
        flagHorario: 'Dia de Folga',
        ponto
      });
    }

    // 3️⃣ Busca funcionário
    const funcionario = await User.findById(funcionarioId);

    // 4️⃣ Calcula flagHorario
    let flagHorario = null;
    if (escalaDoDia) {
      const diaEscala = escalaDoDia.dias.find(d => {
        const dataDia = new Date(d.data);
        dataDia.setHours(0, 0, 0, 0);
        return dataDia.getTime() === hoje.getTime();
      });

      if (diaEscala) {
        if (diaEscala.folga) flagHorario = 'Dia de Folga';
        else if (status === 'entrada' && diaEscala.horaEntrada) {
          const horarioEntradaEsperado = gerarHorarioEsperado(hoje, diaEscala.horaEntrada);
          const diffEntrada = (ponto.horario - horarioEntradaEsperado) / 60000;
          flagHorario = diffEntrada > 5 ? 'Entrada Atrasada' : 'Entrada no Horário';
        } else if (status === 'saida' && diaEscala.horaSaida) {
          const horarioSaidaEsperado = gerarHorarioEsperado(hoje, diaEscala.horaSaida);
          const diffSaida = (ponto.horario - horarioSaidaEsperado) / 60000;
          if (diffSaida < -10) flagHorario = 'Saída Cedo';
          else if (diffSaida > 10) flagHorario = 'Hora Extra';
          else flagHorario = 'Saída no Horário';
        }
      }
    } else if (funcionario) {
      const diaSemana = hoje.getDay();
      if (Array.isArray(funcionario.folgaSemana) && funcionario.folgaSemana.includes(diaSemana)) {
        flagHorario = 'Dia de Folga';
      } else if (funcionario.horarioEntrada && funcionario.horarioSaida) {
        const horarioEntradaEsperado = gerarHorarioEsperado(hoje, funcionario.horarioEntrada);
        const horarioSaidaEsperada = gerarHorarioEsperado(hoje, funcionario.horarioSaida);

        if (status === 'entrada') {
          const diffEntrada = (ponto.horario - horarioEntradaEsperado) / 60000;
          flagHorario = diffEntrada > 5 ? 'Entrada Atrasada' : 'Entrada no Horário';
        }
        if (status === 'saida') {
          const diffSaida = (ponto.horario - horarioSaidaEsperada) / 60000;
          if (diffSaida < -10) flagHorario = 'Saída Cedo';
          else if (diffSaida > 10) flagHorario = 'Hora Extra';
          else flagHorario = 'Saída no Horário';
        }
      }
    }

    // 4.1️⃣ Checagem almoço excedido
    const almocoInicio = (
      await Ponto.findOne({
        funcionario: funcionarioId,
        status: 'almoco',
        horario: { $gte: hoje, $lt: new Date(hoje.getTime() + 24 * 60 * 60 * 1000) }
      })
    )?.horario;
    const almocoFim = (
      await Ponto.findOne({
        funcionario: funcionarioId,
        status: 'retorno',
        horario: { $gte: hoje, $lt: new Date(hoje.getTime() + 24 * 60 * 60 * 1000) }
      })
    )?.horario;

    if (almocoInicio && almocoFim) {
      const diffAlmoco = (new Date(almocoFim) - new Date(almocoInicio)) / 60000;
      if (diffAlmoco > 75) flagHorario = 'Excedeu Almoço';
    }

    // 5️⃣ Atualiza status do usuário
    let novoStatus = 'Inativo';
    switch (status) {
      case 'entrada':
      case 'retorno':
        novoStatus = 'Ativo';
        break;
      case 'almoco':
        novoStatus = 'Almoço';
        break;
      case 'saida':
        novoStatus = 'Inativo';
        break;
      case 'folga':
        novoStatus = 'Folga';
        break;
      case 'atraso':
        novoStatus = 'Atraso';
        break;
    }

    if (flagHorario === 'Dia de Folga') novoStatus = 'Folga';
    else if (flagHorario === 'Entrada Atrasada') novoStatus = 'Atraso';

    await User.findByIdAndUpdate(funcionarioId, { status: novoStatus });
    req.app.get('io').emit('statusAtualizado', { userId: funcionarioId, novoStatus });

    // 6️⃣ Recalcular holerite
    const data = new Date(ponto.horario);
    const primeiroDia = new Date(data.getFullYear(), data.getMonth(), 1);
    const ultimoDia = new Date(data.getFullYear(), data.getMonth() + 1, 0);

    let holerite = await Holerite.findOne({
      funcionario: funcionarioId,
      periodoInicio: primeiroDia,
      periodoFim: ultimoDia
    });

    const pontos = await Ponto.find({
      funcionario: funcionarioId,
      horario: { $gte: primeiroDia, $lte: ultimoDia }
    }).sort({ horario: 1 });

    // Agrupa pontos por dia
    const dias = {};
    pontos.forEach(p => {
      const diaStr = new Date(p.horario).toISOString().slice(0, 10);
      if (!dias[diaStr]) dias[diaStr] = [];
      dias[diaStr].push(p);
    });

    // Calcula horas e holerite
    const cargaHoraria = funcionario?.cargaHorariaDiaria || 8;
    let totalHoras = 0,
      totalHorasExtras = 0,
      totalHorasDescontadas = 0;
    const detalhesDias = [];

    for (const diaStr in dias) {
      const pontosDoDia = dias[diaStr];
      const horas = calcularHorasDoDiaComFlag(pontosDoDia);
      totalHoras += horas;

      let horasExtras = 0,
        horasFaltantes = 0;
      if (horas > cargaHoraria) {
        horasExtras = horas - cargaHoraria;
        totalHorasExtras += horasExtras;
      } else if (horas < cargaHoraria) {
        horasFaltantes = cargaHoraria - horas;
        totalHorasDescontadas += horasFaltantes;
      }

      detalhesDias.push({
        data: new Date(diaStr),
        entrada: pontosDoDia.find(p => p.status === 'entrada')?.horario || null,
        almoco: pontosDoDia.find(p => p.status === 'almoco')?.horario || null,
        retorno: pontosDoDia.find(p => p.status === 'retorno')?.horario || null,
        saida: pontosDoDia.find(p => p.status === 'saida')?.horario || null,
        horasTrabalhadas: horas,
        horasExtras,
        horasFaltantes
      });
    }

    // Calcula salário
    const salarioMensal = funcionario?.salario || 0;
    const cargaDiariaLiquida = cargaHoraria - 1;
    const diasUteis = (() => {
      let count = 0;
      let ultimoDiaMes = new Date(data.getFullYear(), data.getMonth() + 1, 0).getDate();
      for (let d = 1; d <= ultimoDiaMes; d++) {
        const dia = new Date(data.getFullYear(), data.getMonth(), d).getDay();
        if (dia !== 0 && dia !== 6) count++;
      }
      return count;
    })();

    const cargaMensalLiquida = cargaDiariaLiquida * diasUteis;
    const valorHora = cargaMensalLiquida > 0 ? salarioMensal / cargaMensalLiquida : 0;
    const valorHoraExtra = valorHora * 1.5;
    const descontosFixos = holerite ? holerite.descontos : 0;

    const salarioBase = totalHoras * valorHora;
    const valorExtras = totalHorasExtras * valorHoraExtra;
    const valorDescontos = totalHorasDescontadas * valorHora;
    const salarioLiquido = salarioBase + valorExtras - valorDescontos - descontosFixos;

    if (holerite) {
      holerite.totalHoras = totalHoras;
      holerite.totalHorasExtras = totalHorasExtras;
      holerite.totalHorasDescontadas = totalHorasDescontadas;
      holerite.salarioLiquido = salarioLiquido;
      holerite.detalhesDias = detalhesDias;
      await holerite.save();
    } else {
      holerite = await Holerite.create({
        funcionario: funcionarioId,
        periodoInicio: primeiroDia,
        periodoFim: ultimoDia,
        valorHora,
        descontos: descontosFixos,
        totalHoras,
        totalHorasExtras,
        totalHorasDescontadas,
        salarioLiquido,
        detalhesDias
      });
    }

    // 7️⃣ Enviar notificações
    const enviarNotificacao = async (usuario, titulo, descricao, subtipo) => {
      const notificacao = await Notificacao.create({
        usuario,
        titulo,
        descricao,
        tipo: 'alerta',
        subtipo
      });
      req.app.get('io').to(usuario.toString()).emit('nova_notificacao', notificacao);
    };
    if (flagHorario && funcionarioId) {
      switch (flagHorario) {
        case 'Entrada Atrasada':
          await enviarNotificacao(funcionarioId, 'Você registrou o ponto de entrada atrasado hoje.');
          break;
        case 'Saída Cedo':
          await enviarNotificacao(funcionarioId, 'Você registrou o ponto de saída antes do horário previsto.');
          break;
        case 'Hora Extra':
          await enviarNotificacao(funcionarioId, 'Você registrou horas extras hoje.');
          break;
        case 'Excedeu Almoço':
          await enviarNotificacao(funcionarioId, 'Seu intervalo de almoço ultrapassou o limite permitido.');
          break;
      }
    }

    // ✅ Retorna resultado completo
    return res.status(201).json({
      msg: 'Ponto registrado, status atualizado e holerite recalculado',
      ponto,
      novoStatus,
      flagHorario,
      holerite
    });
  } catch (err) {
    console.error('Erro ao registrar ponto:', err);
    next(err);
  }
};

// 📜 Histórico do funcionário logado
exports.meusPontos = async (req, res, next) => {
  try {
    const funcionarioId = req.user.id;
    const pontos = await Ponto.find({ funcionario: funcionarioId }).sort({ horario: -1 });
    res.json(pontos);
  } catch (err) {
    next(err);
  }
};

// 🧭 Listar todos os pontos (apenas admin)
exports.todosPontos = async (req, res, next) => {
  try {
    const pontos = await Ponto.find()
      .populate('funcionario', 'nome email role setor foto cargaHorariaDiaria salario')
      .sort({ horario: -1 });
    res.json(pontos);
  } catch (err) {
    next(err);
  }
};
exports.getStatusAtual = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('status nome');
    if (!user) {
      return res.status(404).json({ msg: 'Usuário não encontrado' });
    }

    res.json({
      userId,
      status: user.status
    });
  } catch (err) {
    console.error('Erro ao obter status atual:', err);
    next(err);
  }
};

exports.checkFolga = async (req, res, next) => {
  try {
    const funcionarioId = req.user.id;
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const escalaHoje = await Escala.findOne({
      funcionario: funcionarioId,
      semanaInicio: { $lte: hoje },
      semanaFim: { $gte: hoje }
    });

    let folga = false;

    if (escalaHoje) {
      const diaEscala = escalaHoje.dias.find(d => {
        const dataDia = new Date(d.data);
        dataDia.setHours(0, 0, 0, 0);
        return dataDia.getTime() === hoje.getTime();
      });
      if (diaEscala?.folga) folga = true;
    }

    res.json({ folga });
  } catch (err) {
    console.error('Erro ao checar folga:', err);
    next(err);
  }
};
