const Ponto = require("../models/Ponto");

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

    res.status(201).json({ msg: "Ponto registrado", ponto });
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
