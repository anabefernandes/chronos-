const Ponto = require("../models/Ponto");
const Holerite = require("../models/Holerite");

//função p calcular horas de um dia
function calcularHorasDoDiaComFlag(pontosDoDia) {
  let isWorking = false;
  let entrada = null;
  let totalHoras = 0;

  let almocoInicio = null;
  let almocoFim = null;

  pontosDoDia.forEach((p) => {
    const horario = new Date(p.horario);

    switch (p.status) {
      case "entrada":
        isWorking = true;
        entrada = horario;
        break;
      case "almoco":
        if (isWorking && entrada) {
          almocoInicio = horario;
          totalHoras += (almocoInicio - entrada) / (1000 * 60 * 60);
          isWorking = false;
        }
        break;
      case "retorno":
        almocoFim = horario;
        entrada = almocoFim;
        isWorking = true;
        break;
      case "saida":
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

//registra ponto e atualiza o holerite
exports.registrarPonto = async (req, res, next) => {
  try {
    const { status, localizacao } = req.body;
    const funcionarioId = req.user.id;

    if (!status) {
      return res.status(400).json({ msg: "Status é obrigatório" });
    }

    const ponto = await Ponto.create({
      funcionario: funcionarioId,
      status,
      localizacao,
    });

    const data = new Date(ponto.horario);
    const primeiroDia = new Date(data.getFullYear(), data.getMonth(), 1);
    const ultimoDia = new Date(data.getFullYear(), data.getMonth() + 1, 0);

    let holerite = await Holerite.findOne({
      funcionario: funcionarioId,
      periodoInicio: primeiroDia,
      periodoFim: ultimoDia,
    });

    const pontos = await Ponto.find({
      funcionario: funcionarioId,
      horario: { $gte: primeiroDia, $lte: ultimoDia },
    }).sort({ horario: 1 });

    const dias = {};
    pontos.forEach((p) => {
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
        entrada:
          pontosDoDia.find((p) => p.status === "entrada")?.horario || null,
        almoco: pontosDoDia.find((p) => p.status === "almoco")?.horario || null,
        retorno:
          pontosDoDia.find((p) => p.status === "retorno")?.horario || null,
        saida: pontosDoDia.find((p) => p.status === "saida")?.horario || null,
        horasTrabalhadas: horas,
      });
    }

    const valorHora = holerite ? holerite.valorHora : 20; // default se ainda não setado
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
        detalhesDias,
      });
    }

    res
      .status(201)
      .json({ msg: "Ponto registrado e holerite atualizado", ponto });
  } catch (err) {
    next(err);
  }
};

// hist de pontos do funcionário logado
exports.meusPontos = async (req, res, next) => {
  try {
    const funcionarioId = req.user.id;
    const pontos = await Ponto.find({ funcionario: funcionarioId }).sort({
      horario: -1,
    });
    res.json(pontos);
  } catch (err) {
    next(err);
  }
};

// listando pontos de todos os func (apenas admin)
exports.todosPontos = async (req, res, next) => {
  try {
    const pontos = await Ponto.find()
      .populate("funcionario", "nome email")
      .sort({ horario: -1 });
    res.json(pontos);
  } catch (err) {
    next(err);
  }
};
