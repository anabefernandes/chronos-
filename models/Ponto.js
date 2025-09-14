const mongoose = require("mongoose");

const PontoSchema = new mongoose.Schema({
  funcionario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    enum: ["entrada", "saida", "almoco", "retorno"],
    required: true,
  },
  horario: { type: Date, default: Date.now },
  localizacao: {
    latitude: Number,
    longitude: Number,
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Ponto", PontoSchema);
