const Ponto = require('../models/Ponto');
const Holerite = require('../models/Holerite');

//FUNÇAO p calcular horas de um dia
function calcularHorasDoDiaComFlag(pontosDoDia) {
  let isWorking = false;
  let entrada = null;
  let totalHoras = 0;

  let almocoInicio = null;
  let almocoFim = null;

  pontosDoDia.forEach(p => {
    const horario = new Date(p.horario);

    switch (p.status) {
      case 'entrada':
        isWorking = true;
        entrada = horario;
        break;
      case 'almoco':
        if (isWorking && entrada) {
          almocoInicio = horario;
          totalHoras += (almocoInicio - entrada) / (1000 * 60 * 60);
          isWorking = false;
        }
        break;
      case 'retorno':
        almocoFim = horario;
        entrada = almocoFim;
        isWorking = true;
        break;
      case 'saida':
        if (isWorking && entrada) {
          totalHoras += (horario - entrada) / (1000 * 60 * 60);
          isWorking = false;
        }
        break;
    }
  });

  if (almocoInicio && almocoFim) {
    const pausa = (almocoFim - almocoInicio) / (1000 * 60 * 60);
    totalHoras -= Math.max(pausa - 1, 0);
  }

  return totalHoras;
}

function calcularDistancia(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

//registra ponto e atualiza o holerite
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

    //DEFINIR COORDENADAS AQUI
    const LOCAL_TRABALHO = {
      latitude: -24.024736511022894,
      longitude: -46.488954928836364
    };
    const RAIO_PERMITIDO = 50; //DEFINIR METROS

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

    const ponto = await Ponto.create({
      funcionario: funcionarioId,
      status,
      localizacao
    });

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

    const dias = {};
    pontos.forEach(p => {
      const diaStr = new Date(p.horario).toISOString().slice(0, 10);
      if (!dias[diaStr]) dias[diaStr] = [];
      dias[diaStr].push(p);
    });

    let totalHoras = 0;
    const detalhesDias = [];

    for (const diaStr in dias) {
      const pontosDoDia = dias[diaStr];
      const horas = calcularHorasDoDiaComFlag(pontosDoDia);
      totalHoras += horas;

      detalhesDias.push({
        data: new Date(diaStr),
        entrada: pontosDoDia.find(p => p.status === 'entrada')?.horario || null,
        almoco: pontosDoDia.find(p => p.status === 'almoco')?.horario || null,
        retorno: pontosDoDia.find(p => p.status === 'retorno')?.horario || null,
        saida: pontosDoDia.find(p => p.status === 'saida')?.horario || null,
        horasTrabalhadas: horas
      });
    }

    const valorHora = holerite ? holerite.valorHora : 20;
    const descontos = holerite ? holerite.descontos : 0;
    const salarioLiquido = totalHoras * valorHora - descontos;

    if (holerite) {
      holerite.totalHoras = totalHoras;
      holerite.salarioLiquido = salarioLiquido;
      holerite.detalhesDias = detalhesDias;
      await holerite.save();
    } else {
      holerite = await Holerite.create({
        funcionario: funcionarioId,
        periodoInicio: primeiroDia,
        periodoFim: ultimoDia,
        valorHora,
        descontos,
        totalHoras,
        salarioLiquido,
        detalhesDias
      });
    }

    res.status(201).json({ msg: 'Ponto registrado e holerite atualizado', ponto });
  } catch (err) {
    next(err);
  }
};

// Hist de pontos do funcionário logado
exports.meusPontos = async (req, res, next) => {
  try {
    const funcionarioId = req.user.id;
    const pontos = await Ponto.find({ funcionario: funcionarioId }).sort({
      horario: -1
    });
    res.json(pontos);
  } catch (err) {
    next(err);
  }
};

// Listando pontos de todos os func (apenas admin)
exports.todosPontos = async (req, res, next) => {
  try {
    const pontos = await Ponto.find().populate('funcionario', 'nome email').sort({ horario: -1 });
    res.json(pontos);
  } catch (err) {
    next(err);
  }
};
