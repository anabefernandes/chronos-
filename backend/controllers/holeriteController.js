const Holerite = require("../models/Holerite");
const Ponto = require("../models/Ponto");

function formatarHoras(horasDecimais) {
  const horas = Math.floor(horasDecimais);
  const minutos = Math.round((horasDecimais - horas) * 60);
  return `${horas}h${minutos.toString().padStart(2, "0")}min`;
}

//croar ou editar holerite (apenas admin)
//serve para setar valorHora e descontos
exports.criarOuEditarHolerite = async (req, res, next) => {
  try {
    const { funcionario, periodoInicio, periodoFim, valorHora, descontos } =
      req.body;

    if (!funcionario || !periodoInicio || !periodoFim) {
      return res.status(400).json({ msg: "Campos obrigatórios faltando" });
    }

    let holerite = await Holerite.findOne({
      funcionario,
      periodoInicio: new Date(periodoInicio),
      periodoFim: new Date(periodoFim),
    });

    if (!holerite) {
      holerite = await Holerite.create({
        funcionario,
        periodoInicio: new Date(periodoInicio),
        periodoFim: new Date(periodoFim),
        valorHora: Number(valorHora || 20),
        descontos: Number(descontos || 0),
        totalHoras: 0, //preenchido no pontoController
        salarioLiquido: 0, //tb
        detalhesDias: [],
      });
      return res
        .status(201)
        .json({ msg: "Holerite criado (aguardando pontos)", holerite });
    }

    if (valorHora !== undefined) holerite.valorHora = Number(valorHora);
    if (descontos !== undefined) holerite.descontos = Number(descontos);

    holerite.detalhesDias = holerite.detalhesDias.map((d) => ({
      ...d.toObject(),
      horasFormatadas: formatarHoras(d.horasTrabalhadas || 0),
    }));

    await holerite.save();

    res.json({ msg: "Holerite atualizado", holerite });
  } catch (err) {
    next(err);
  }
};

//holerites do func logado
exports.meuHolerite = async (req, res, next) => {
  try {
    const funcionarioId = req.user.id;
    let holerites = await Holerite.find({ funcionario: funcionarioId }).sort({
      periodoInicio: -1,
    });

    holerites = holerites.map((h) => ({
      ...h.toObject(),
      detalhesDias: h.detalhesDias.map((d) => ({
        ...d.toObject(),
        horasFormatadas: formatarHoras(d.horasTrabalhadas || 0),
      })),
    }));

    res.json(holerites);
  } catch (err) {
    next(err);
  }
};

//tds os holerites (admin)
exports.todosHolerites = async (req, res, next) => {
  try {
    let holerites = await Holerite.find()
      .populate("funcionario", "nome email")
      .sort({ periodoInicio: -1 });
    holerites = holerites.map((h) => {
      h.detalhesDias = h.detalhesDias.map((d) => ({
        ...d.toObject(),
        horasFormatadas: formatarHoras(d.horasTrabalhadas || 0),
      }));
      return h;
    });
    res.json(holerites);
  } catch (err) {
    next(err);
  }
};
