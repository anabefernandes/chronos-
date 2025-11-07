const mongoose = require('mongoose');

const diaSchema = new mongoose.Schema({
  dia: { type: String, required: true }, // Segunda, Terça...
  data: { type: Date, required: true },
  horaEntrada: { type: String, required: false },
  horaSaida: { type: String, required: false },
  folga: { type: Boolean, default: false },
});

const escalaSchema = new mongoose.Schema({
  funcionario: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  semanaInicio: { type: Date, required: true },
  semanaFim: { type: Date, required: true },
  dias: [diaSchema], // <-- array com horários por dia
}, { timestamps: true });

module.exports = mongoose.model('Escala', escalaSchema);
