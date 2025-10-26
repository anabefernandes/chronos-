const mongoose = require('mongoose');

const notificacaoSchema = new mongoose.Schema({
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  titulo: { type: String, required: true },
  descricao: { type: String },
  lida: { type: Boolean, default: false },
  dataCriacao: { type: Date, default: Date.now }
}, { collection: 'notificacoes' });


module.exports = mongoose.model('Notificacao', notificacaoSchema);
