const Ponto = require('../models/Ponto');
const Holerite = require('../models/Holerite');
const User = require('../models/User');

// -----------------------------
// Calcula horas do dia considerando entrada, almoço, retorno e saída
// -----------------------------
function calcularHorasDoDiaComFlag(pontosDoDia) {
  let entrada = null;
  let almocoInicio = null;
  let almocoFim = null;
  let saida = null;

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

  if (!entrada || !saida) return 0;

  let manha = 0;
  if (entrada && almocoInicio) 
    manha = (almocoInicio - entrada) / 3600000;

  let tarde = 0;
  if (almocoFim && saida) 
    tarde = (saida - almocoFim) / 3600000;

  let tempoTrabalhado = manha + tarde;

  // Ajuste de almoço
  let atrasoAlmoco = 0;
  if (almocoInicio && almocoFim) {
    const duracaoAlmoco = (almocoFim - almocoInicio) / 3600000;
    if (duracaoAlmoco < 0.75) {
      // Menos de 45 min → considerar real
    } else if (duracaoAlmoco > 1.25) {
      // Mais de 1h15 → descontar excesso
      atrasoAlmoco = duracaoAlmoco - 1;
    }
    // Faixa 45min–1h15 → considera 1h
  }

  return tempoTrabalhado - atrasoAlmoco;
}

// -----------------------------
// Calcula distância entre pontos GPS
// -----------------------------
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
// Gera Date a partir de "HH:MM" na mesma data
// -----------------------------
function gerarHorarioEsperado(dataBase, horarioStr) {
  if (!horarioStr) return null;
  const [h, m] = horarioStr.split(':').map(Number);
  const d = new Date(dataBase);
  d.setHours(h, m, 0, 0);
  return d;
}

// -----------------------------
// Registrar ponto
// -----------------------------
exports.registrarPonto = async (req, res, next) => {
  try {
    const { status, localizacao } = req.body;
    const funcionarioId = req.user.id;

    if (!status)
      return res.status(400).json({ msg: 'Status é obrigatório' });

      if (!localizacao?.latitude || !localizacao?.longitude)
      return res.status(400).json({ msg: 'Localização é obrigatória' });

    // 📍 Local de trabalho fixo
    const LOCAL_TRABALHO = {
      latitude: -24.00499845450938,
      longitude: -46.412365233301664,
    };
    const RAIO_PERMITIDO = 100; // metros
    const distancia = calcularDistancia(
      localizacao.latitude,
      localizacao.longitude,
      LOCAL_TRABALHO.latitude,
      LOCAL_TRABALHO.longitude
    );
    if (distancia > RAIO_PERMITIDO)
      return res.status(403).json({
        msg: `Você está fora do local permitido para registrar o ponto. Distância: ${Math.round(distancia)}m`,
      });

    // Criar ponto
    const ponto = await Ponto.create({
      funcionario: funcionarioId,
      status,
      localizacao,
    });

    const funcionario = await User.findById(funcionarioId);

    // -----------------------------
    // Verificar escala do dia
    // -----------------------------
    const hoje = new Date(ponto.horario);
    hoje.setHours(0, 0, 0, 0);

    let flagHorario = null;

    if (Array.isArray(funcionario.folgaSemana) && funcionario.folgaSemana.includes(hoje.getDay())) {
      flagHorario = 'Dia de Folga';
    
    } else {
      
      const horarioEntradaEsperado = funcionario.horarioEntrada ? gerarHorarioEsperado(hoje, funcionario.horarioEntrada) : null;
      const horarioSaidaEsperada = funcionario.horarioSaida ? gerarHorarioEsperado(hoje, funcionario.horarioSaida) : null;
      const LIMITE_ATRASO = 5; // min
      const LIMITE_EXTRA = 10; // min

      if (status === 'entrada' && horarioEntradaEsperado) {
        const diffEntrada = (new Date(ponto.horario) - horarioEntradaEsperado) / 60000;
        if (diffEntrada > LIMITE_ATRASO) 
          flagHorario = 'Entrada Atrasada';
      }
      if (status === 'saida' && horarioSaidaEsperada) {
        const diffSaida = (new Date(ponto.horario) - horarioSaidaEsperada) / 60000;
        if (diffSaida > LIMITE_EXTRA) 
          flagHorario = 'Hora Extra';
      }
    }

    // Atualizar status
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
        novoStatus = flagHorario === 'Hora Extra' ? 'Hora Extra' : 'Inativo';
        break;
      case 'folga':
        novoStatus = 'Folga';
        break;
      case 'atraso':
        novoStatus = 'Atraso';
        break;
    }
    if (flagHorario === 'Dia de Folga') 
      novoStatus = 'Folga';
    if (flagHorario === 'Entrada Atrasada') 
      novoStatus = 'Atraso';

    await User.findByIdAndUpdate(funcionarioId, { status: novoStatus });
    req.app.get('io').emit('statusAtualizado', { userId: funcionarioId, novoStatus });

    // -----------------------------
    // Holerite
    // -----------------------------
    const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

    let holerite = await Holerite.findOne({
      funcionario: funcionarioId,
      periodoInicio: primeiroDia,
      periodoFim: ultimoDia,
    });

    const pontos = await Ponto.find({
      funcionario: funcionarioId,
      horario: { $gte: primeiroDia, $lte: ultimoDia },
    }).sort({ horario: 1 });

    // Agrupar pontos por dia
    const dias = {};
    pontos.forEach(p => {
      const diaStr = new Date(p.horario).toISOString().slice(0, 10);
      if (!dias[diaStr]) dias[diaStr] = [];
      dias[diaStr].push(p);
    });

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

      // Plantões: só calcula extra/falta se o dia tiver horário definido
      const escalaEntrada = funcionario.horarioEntrada;
      const escalaSaida = funcionario.horarioSaida;
      
      if (escalaEntrada && escalaSaida) {
        const horarioEntradaEsperado = gerarHorarioEsperado(new Date(diaStr), escalaEntrada);
        const horarioSaidaEsperada = gerarHorarioEsperado(new Date(diaStr), escalaSaida);
        const cargaDiaria = (horarioSaidaEsperada - horarioEntradaEsperado) / 3600000;
        
        if (horas > cargaDiaria) {
          horasExtras = horas - cargaDiaria;
          totalHorasExtras += horasExtras;
        
        } else if (horas < cargaDiaria) {
          horasFaltantes = cargaDiaria - horas;
          totalHorasDescontadas += horasFaltantes;
        }
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

    // Cálculo financeiro
    const salarioMensal = funcionario?.salario || 0;
    let valorHora = 0;
    if (holerite?.periodoInicio && holerite?.periodoFim) {
      const diasUteis = detalhesDias.length;
      valorHora = diasUteis > 0 ? salarioMensal / totalHoras : 0;
    }
    const valorHoraExtra = valorHora * 1.5;
    const descontosFixos = holerite?.descontos || 0;
    const salarioBase = totalHoras * valorHora;
    const valorExtras = totalHorasExtras * valorHoraExtra;
    const valorDescontos = totalHorasDescontadas * valorHora;
    const salarioLiquido = salarioBase + valorExtras - valorDescontos - descontosFixos;

    // Atualizar ou criar holerite
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

    res.status(201).json({
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
      const pontos = await Ponto.find().populate('funcionario', 'nome email').sort({ horario: -1 });
      res.json(pontos);
    } catch (err) {
      next(err);
    }
  };
  