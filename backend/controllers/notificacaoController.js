const Notificacao = require('../models/Notificacao.js');
const User = require('../models/User.js');
const { io } = require('../server');

exports.criarNotificacao = async (req, res, next) => {
  try {
    const { usuario, titulo, descricao, tipo } = req.body; // tipo enviado pelo frontend
    if (!usuario || !titulo) {
      return res.status(400).json({ msg: 'Usuário e título são obrigatórios' });
    }

    const user = await User.findById(usuario);
    if (!user) return res.status(404).json({ msg: 'Usuário não encontrado' });

    const notificacao = await Notificacao.create({
      usuario,
      titulo,
      descricao,
      tipo: tipo || 'tarefa' // default para 'tarefa' se não enviar
    });

    io.to(usuario).emit('nova_notificacao', {
      _id: notificacao._id,
      titulo: notificacao.titulo,
      descricao: notificacao.descricao,
      tipo: notificacao.tipo,
      lida: notificacao.lida,
      dataCriacao: notificacao.dataCriacao
    });

    res.status(201).json({ msg: 'Notificação criada', notificacao });
  } catch (err) {
    next(err);
  }
};

// Listar notificações de um usuário específico
exports.minhasNotificacoes = async (req, res, next) => {
  try {
    const { usuarioId } = req.params;

    const notificacoes = await Notificacao.find({ usuario: usuarioId }).sort({ dataCriacao: -1 });
    res.json(notificacoes);
  } catch (err) {
    next(err);
  }
};

exports.marcarComoLida = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notificacao = await Notificacao.findByIdAndUpdate(id, { lida: true }, { new: true });
    if (!notificacao) return res.status(404).json({ msg: 'Notificação não encontrada' });
    res.json({ msg: 'Notificação marcada como lida', notificacao });
  } catch (err) {
    next(err);
  }
};

exports.marcarTodasComoLidas = async (req, res, next) => {
  try {
    const usuarioId = req.params.usuarioId;
    await Notificacao.updateMany({ usuario: usuarioId, lida: false }, { lida: true });
    res.json({ msg: 'Todas notificações marcadas como lidas' });
  } catch (err) {
    next(err);
  }
};

exports.excluirNotificacao = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notificacao = await Notificacao.findByIdAndDelete(id);
    if (!notificacao) {
      return res.status(404).json({ msg: 'Notificação não encontrada' });
    }

    res.json({ msg: 'Notificação excluída com sucesso' });
  } catch (err) {
    next(err);
  }
};

exports.excluirTodasNotificacoes = async (req, res, next) => {
  try {
    await Notificacao.deleteMany({ usuario: req.params.usuarioId });
    res.json({ msg: 'Todas notificações excluídas com sucesso' });
  } catch (err) {
    next(err);
  }
};
