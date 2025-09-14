const Holerite = require("../models/Holerite");
const Ponto = require("../models/Ponto");

//calcular as horas trabalhadas de um dia
//espera uma desc: entrada, saida, almoco ou retorno
//subtrair almoço do total (maximo 1h)

function calcularHorasDoDia(dia) {
  if (!dia.entrada || !dia.saida) return 0;

  // Ajuste para horário local (UTC-3)
  const entrada = new Date(dia.entrada);
  const saida = new Date(dia.saida);
  const almoco = dia.almoco ? new Date(dia.almoco) : null;
  const retorno = dia.retorno ? new Date(dia.retorno) : null;

  let horasTrabalhadas = (saida - entrada) / (1000 * 60 * 60); // em horas

  if (almoco && retorno) {
    const pausa = (retorno - almoco) / (1000 * 60 * 60);
    horasTrabalhadas -= Math.min(pausa, 1); // subtrai máximo 1h de almoço
  }

  return horasTrabalhadas;
}

//criar ou editar holerite (admin)
exports.criarOuEditarHolerite = async (req, res, next) => {
  try {
    const { funcionario, periodoInicio, periodoFim, descontos } = req.body;

    // Valor por hora padrão R$20
    const valorHora = Number(req.body.valorHora || 20);
    if (!funcionario || !periodoInicio || !periodoFim || !valorHora)
      return res.status(400).json({ msg: "Campos obrigatórios faltando" });

    // Buscar todos os pontos do funcionário no período
    const pontos = await Ponto.find({
      funcionario,
      horario: { $gte: new Date(periodoInicio), $lte: new Date(periodoFim) },
    }).sort({ horario: 1 });

    // Agrupar pontos por dia
    const dias = {};
    pontos.forEach((p) => {
      const dia = new Date(p.horario);
      dia.setHours(dia.getHours() - 3); // ajustar UTC-3
      const diaStr = dia.toISOString().slice(0, 10);
      if (!dias[diaStr]) dias[diaStr] = {};
      dias[diaStr][p.status] = p.horario;
    });

    let totalHoras = 0;
    const detalhesDias = [];

    // Calcular horas trabalhadas por dia
    for (const diaStr in dias) {
      const diaData = dias[diaStr];
      const horas = calcularHorasDoDia(diaData);
      totalHoras += horas;

      detalhesDias.push({
        data: new Date(diaStr),
        entrada: diaData.entrada || null,
        almoco: diaData.almoco || null,
        retorno: diaData.retorno || null,
        saida: diaData.saida || null,
        horasTrabalhadas: horas,
      });
    }

    const salarioLiquido = totalHoras * valorHora - Number(descontos || 0);

    // Verifica se holerite já existe
    let holerite = await Holerite.findOne({
      funcionario,
      periodoInicio,
      periodoFim,
    });

    if (holerite) {
      holerite.valorHora = valorHora;
      holerite.descontos = descontos || 0;
      holerite.totalHoras = totalHoras;
      holerite.salarioLiquido = salarioLiquido;
      holerite.detalhesDias = detalhesDias;
      await holerite.save();
      return res.json({ msg: "Holerite atualizado", holerite });
    }

    // Criar novo holerite
    holerite = await Holerite.create({
      funcionario,
      periodoInicio,
      periodoFim,
      valorHora,
      descontos,
      totalHoras,
      salarioLiquido,
      detalhesDias,
    });

    res.status(201).json({ msg: "Holerite criado", holerite });
  } catch (err) {
    next(err);
  }
};

//holerite do user logado
exports.meuHolerite = async (req, res, next) => {
  try {
    const funcionarioId = req.user.id;
    const holerites = await Holerite.find({ funcionario: funcionarioId }).sort({
      periodoInicio: -1,
    });
    res.json(holerites);
  } catch (err) {
    next(err);
  }
};

//todos os holerites (admin)
exports.todosHolerites = async (req, res, next) => {
  try {
    const holerites = await Holerite.find()
      .populate("funcionario", "nome email")
      .sort({ periodoInicio: -1 });
    res.json(holerites);
  } catch (err) {
    next(err);
  }
};
