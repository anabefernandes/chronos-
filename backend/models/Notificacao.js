const mongoose = require('mongoose');

const notificacaoSchema = new mongoose.Schema(
  {
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    titulo: { type: String, required: true },
    descricao: { type: String },
    tipo: {
      type: String,
      enum: ['tarefa', 'ponto', 'alerta', 'sistema', 'escala'],
      default: 'sistema' // ⚠️ Padrão continua 'sistema', mas notificações de ponto serão 'alerta'
    },
    subtipo: {
      type: String,
      enum: ['atraso', 'almoco', 'retorno', 'saida', 'extra'],
      default: null
    },

    lida: { type: Boolean, default: false },
    dataCriacao: { type: Date, default: Date.now }
  },
  { collection: 'notificacoes' }
);

module.exports = mongoose.model('Notificacao', notificacaoSchema);
