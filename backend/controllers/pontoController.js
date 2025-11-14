const Ponto = require('../models/Ponto');
const Holerite = require('../models/Holerite');
const User = require('../models/User');

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

exports.registrarPonto = async (req, res, next) => {
  try {
    const { status, localizacao } = req.body;
    const funcionarioId = req.user.id;

    if (!status) {
      return res.status(400).json({ msg: 'Status é obrigatório' });
    }

    if (!localizacao || !localizacao.latitude || !localizacao.longitude) {
      return res.status(400).json({ msg: 'Localização é obrigatória' });
    }

    // 📍 Local fixo de trabalho

    const LOCAL_TRABALHO = {
      latitude: -24.024364136251414,
      longitude: -46.48873560889776
    };
    const RAIO_PERMITIDO = 100; // metros

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

    // ✅ 1. Cria o ponto
    const ponto = await Ponto.create({
      funcionario: funcionarioId,
      status,
      localizacao
    });

    // ✅ 2. Define novo status
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

    await User.findByIdAndUpdate(funcionarioId, { status: novoStatus });

    const io = req.app.get('io');
    io.emit('statusAtualizado', {
      userId: funcionarioId,
      novoStatus
    });

    // ⚙️ Cálculo do holerite
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

    // Agrupar pontos por dia
    const dias = {};
    pontos.forEach(p => {
      const diaStr = new Date(p.horario).toISOString().slice(0, 10);
      if (!dias[diaStr]) dias[diaStr] = [];
      dias[diaStr].push(p);
    });

    // 🧮 Calcular horas, extras e descontos
    const funcionario = await User.findById(funcionarioId);
    const cargaHoraria = funcionario?.cargaHorariaDiaria || 8;

    let totalHoras = 0;
    let totalHorasExtras = 0;
    let totalHorasDescontadas = 0;
    const detalhesDias = [];

    for (const diaStr in dias) {
      const pontosDoDia = dias[diaStr];
      const horas = calcularHorasDoDiaComFlag(pontosDoDia);
      totalHoras += horas;

      let horasExtras = 0;
      let horasFaltantes = 0;

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

    // 💰 Cálculo financeiro
    // 💰 Pegar salário mensal e carga horária diária do funcionário
    const salarioMensal = funcionario?.salario || 0;
    const cargaHorariaDiaria = funcionario?.cargaHorariaDiaria || 8; // exemplo: 8h/dia

    // 🗓️ Calcular dias úteis do mês (segunda a sexta)
    function diasUteisDoMes(ano, mes) {
      let count = 0;
      let ultimoDia = new Date(ano, mes + 1, 0).getDate();

      for (let dia = 1; dia <= ultimoDia; dia++) {
        const d = new Date(ano, mes, dia).getDay();
        if (d !== 0 && d !== 6) count++; // Ignora sábado (6) e domingo (0)
      }
      return count;
    }

    const ano = data.getFullYear();
    const mes = data.getMonth();

    const diasUteis = diasUteisDoMes(ano, mes);

    // 🕐 Carga mensal total considerando 1h de almoço (não paga)
    const cargaDiariaLiquida = cargaHorariaDiaria - 1;
    const cargaMensalLiquida = cargaDiariaLiquida * diasUteis;

    // 🎯 Valor real da hora
    const valorHora = cargaMensalLiquida > 0 ? salarioMensal / cargaMensalLiquida : 0;

    const valorHoraExtra = valorHora * 1.5; // 50% adicional
    const descontosFixos = holerite ? holerite.descontos : 0;

    // ---- Cálculo Final ----
    const salarioBase = totalHoras * valorHora;
    const valorExtras = totalHorasExtras * valorHoraExtra;
    const valorDescontos = totalHorasDescontadas * valorHora;

    const salarioLiquido = salarioBase + valorExtras - valorDescontos - descontosFixos;

    // 🧾 Atualizar ou criar holerite
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

    // ✅ 4. Retorna resultado completo
    res.status(201).json({
      msg: 'Ponto registrado, status atualizado e holerite recalculado',
      ponto,
      novoStatus,
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
    const pontos = await Ponto.find().populate('funcionario', 'nome email').sort({ horario: -1 });
    res.json(pontos);
  } catch (err) {
    next(err);
  }
};
