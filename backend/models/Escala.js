const mongoose = require('mongoose');

const EscalaSchema = new mongoose.Schema({
  funcionario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  data: { type: Date, required: true },
  horaEntrada: Date,
  horaSaida: Date,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Escala', EscalaSchema);
