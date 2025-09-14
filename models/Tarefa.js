const mongoose = require("mongoose");

const TarefaSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  descricao: String,
  prioridade: {
    type: String,
    enum: ["baixa", "media", "alta"],
    default: "media",
  },
  status: {
    type: String,
    enum: ["pendente", "em_andamento", "concluida"],
    default: "pendente",
  },
  funcionario: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  dataPrevista: Date,
  tempoEstimado: Number,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Tarefa", TarefaSchema);
