const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });

//login do usuario
exports.login = async (req, res, next) => {
  try {
    const { email, senha } = req.body;
    const user = await User.findOne({ email: (email || "").toLowerCase() });
    if (!user) return res.status(400).json({ msg: "Usuário não encontrado" });
    const ok = await bcrypt.compare(senha, user.senha);
    if (!ok) return res.status(400).json({ msg: "Senha inválida" });
    const token = signToken(user);
    res.json({
      token,
      user: {
        id: user._id,
        nome: user.nome,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

//retorna dados do usuario logado (apenas autenticado)
exports.userAuth = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("-senha");
    res.json(user);
  } catch (err) {
    next(err);
  }
};
