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

  // ⏰ Horários esperados (ex: "07:00" / "19:00")
  horarioEntrada: { type: String, default: "07:00" },
  horarioSaida:   { type: String, default: "19:00" },

  // 📅 Dias da semana em que o funcionário NÃO trabalha
  // 0 = Domingo, 6 = Sábado
  folgaSemana: { type: [Number], default: [] },

  cargaHorariaDiaria: { type: Number, default: 8 },
  salario: { type: Number, required: false, default: 0 },
  foto: { type: String, default: null },

  status: { type: String, default: 'Inativo' }
});

module.exports = mongoose.model('User', UserSchema);
