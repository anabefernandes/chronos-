const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  senha: { type: String, required: true },

  role: {
    type: String,
    enum: ['admin', 'funcionario', 'chefe'],
    default: 'funcionario'
  },

  setor: { type: String, required: true },
  cargaHorariaDiaria: { type: Number, default: 8 },
  salario: { type: Number, default: 0 },
  foto: { type: String, default: null },
  horaEntradaEscala: { type: String, default: null },
  horaSaidaEscala: { type: String, default: null },
  folgaHoje: { type: Boolean, default: false },

  status: { type: String, default: 'Inativo' }
});

module.exports = mongoose.model('User', UserSchema);
