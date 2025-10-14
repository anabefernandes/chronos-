const User = require("../models/User");
const bcrypt = require("bcryptjs");

//criar usuario chefe ou func (admin)
exports.criarUsuario = async (req, res, next) => {
  try {
    const { nome, email, senha, role } = req.body;
    if (!nome || !email || !senha || !role)
      return res.status(400).json({ msg: "Campos obrigatórios" });

    if (await User.findOne({ email }))
      return res.status(400).json({ msg: "Email já cadastrado" });

    const hashed = await bcrypt.hash(senha, 10);

    const foto = req.file ? `/uploads/${req.file.filename}` : null;

    const user = await User.create({
      nome,
      email: email.toLowerCase(),
      senha: hashed,
      role,
      foto,
    });

    res.status(201).json({
      msg: "Usuário criado",
      user: {
        id: user._id,
        nome: user.nome,
        email: user.email,
        role: user.role,
        foto: user.foto,
      },
    });
  } catch (err) {
    next(err);
  }
};

//atualizar user (admin)
exports.atualizarUsuario = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    if (req.file) {
      updates.foto = `/uploads/${req.file.filename}`;
    }

    if (updates.senha) {
      if (updates.senha.trim() !== "") {
        updates.senha = await bcrypt.hash(updates.senha, 10);
      } else {
        delete updates.senha;
      }
    }

    const user = await User.findByIdAndUpdate(id, updates, {
      new: true,
    }).select("-senha");
    if (!user) return res.status(404).json({ msg: "Usuário não encontrado" });

    res.json({ msg: "Usuário atualizado", user });
  } catch (err) {
    next(err);
  }
};

//excluir user (admin)
exports.excluirUsuario = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ msg: "Usuário não encontrado" });

    res.json({ msg: "Usuário excluído com sucesso" });
  } catch (err) {
    next(err);
  }
};

//ver tds funcionarios
exports.listarFuncionarios = async (req, res, next) => {
  try {
    const funcionarios = await User.find({ role: "funcionario" }).select(
      "-senha"
    );
    res.json(funcionarios);
  } catch (err) {
    next(err);
  }
};

//ver tds chefe
exports.listarChefe = async (req, res, next) => {
  try {
    const chefe = await User.find({ role: "chefe" }).select("-senha");
    res.json(chefe);
  } catch (err) {
    next(err);
  }
};
