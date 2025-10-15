const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  senha: { type: String, required: true },
  role: {
    type: String,
    enum: ["admin", "funcionario", "chefe"],
    default: "funcionario",
  },
  foto: String,
});

module.exports = mongoose.model("User", UserSchema);
