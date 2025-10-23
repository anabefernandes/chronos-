const Escala = require('../models/Escala');
const User = require('../models/User');

//cria/edita escala (chefe/admin)
exports.criarOuEditarEscala = async (req, res, next) => {
  try {
    const { funcionario, data, horaEntrada, horaSaida } = req.body;
    if (!funcionario || !data || !horaEntrada || !horaSaida)
      return res.status(400).json({ msg: 'Todos os campos são obrigatórios' });

    let escala = await Escala.findOne({ funcionario, data: new Date(data) });
    if (escala) {
      escala.horaEntrada = horaEntrada;
      escala.horaSaida = horaSaida;
      await escala.save();
      return res.json({ msg: 'Escala atualizada', escala });
    }

    escala = await Escala.create({ funcionario, data, horaEntrada, horaSaida });
    res.status(201).json({ msg: 'Escala criada', escala });
  } catch (err) {
    next(err);
  }
};

//listar escalas (todos)
exports.minhasEscalas = async (req, res, next) => {
  try {
    const funcionarioId = req.user.id;
    const escalas = await Escala.find({ funcionario: funcionarioId }).sort({
      data: 1
    });
    res.json(escalas);
  } catch (err) {
    next(err);
  }
};

//listar todas as escalas (admin)
exports.todasEscalas = async (req, res, next) => {
  try {
    const escalas = await Escala.find().populate('funcionario', 'nome email').sort({ data: 1 });
    res.json(escalas);
  } catch (err) {
    next(err);
  }
};
