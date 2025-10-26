const Notificacao = require('../models/Notificacao.js');
const User = require('../models/User.js');

// Criar notificação manual
exports.criarNotificacao = async (req, res, next) => {
  try {
    const { usuario, titulo, descricao } = req.body;
    if (!usuario || !titulo) {
      return res.status(400).json({ msg: 'Usuário e título são obrigatórios' });
    }

    const user = await User.findById(usuario);
    if (!user) return res.status(404).json({ msg: 'Usuário não encontrado' });

    const notificacao = await Notificacao.create({
      usuario,
      titulo,
      descricao
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
  } catch (err) { next(err); }
};


