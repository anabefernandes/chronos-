const mongoose = require('mongoose');

const detalheDiaSchema = new mongoose.Schema({
  data: { type: Date, required: true },
  entrada: Date,
  almoco: Date,
  retorno: Date,
  saida: Date,
  horasTrabalhadas: Number,
  horasExtras: { type: Number, default: 0 },
  horasFaltantes: { type: Number, default: 0 }
});

const holeriteSchema = new mongoose.Schema({
  funcionario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  periodoInicio: { type: Date, required: true },
  periodoFim: { type: Date, required: true },
  valorHora: { type: Number, required: true },
  descontos: { type: Number, default: 0 },
  totalHoras: { type: Number, default: 0 },
  totalHorasExtras: { type: Number, default: 0 },
  totalHorasDescontadas: { type: Number, default: 0 },
  salarioLiquido: { type: Number, default: 0 },
  detalhesDias: [detalheDiaSchema]
});

module.exports = mongoose.model('Holerite', holeriteSchema);
