const User = require('../models/User');
const bcrypt = require('bcryptjs');

//criar usuario chefe ou func (admin)
exports.criarUsuario = async (req, res, next) => {
  try {
    const { nome, email, senha, role, setor, cargaHorariaDiaria, salario } = req.body;
    if (!nome || !email || !senha || !role || !setor || !cargaHorariaDiaria)
      return res.status(400).json({ msg: 'Campos obrigatórios' });

    if (await User.findOne({ email })) return res.status(400).json({ msg: 'Email já cadastrado' });

    const hashed = await bcrypt.hash(senha, 10);

    const user = await User.create({
      nome,
      email: email.toLowerCase(),
      senha: hashed,
      role,
      setor,
      cargaHorariaDiaria: cargaHorariaDiaria || 8,
      salario: salario || 0,
      foto: '/assets/images/telas-public/sem_foto.png'
    });

    res.status(201).json({
      msg: 'Usuário criado',
      user: {
        id: user._id,
        nome: user.nome,
        email: user.email,
        role: user.role,
        setor: user.setor,
        cargaHorariaDiaria: user.cargaHorariaDiaria,
        slario: user.salario,
        foto: user.foto
      }
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

    if (updates.senha) {
      if (updates.senha.trim() !== '') {
        updates.senha = await bcrypt.hash(updates.senha, 10);
      } else {
        delete updates.senha;
      }
    }

    const user = await User.findByIdAndUpdate(id, updates, {
      new: true
    }).select('-senha');
    if (!user) return res.status(404).json({ msg: 'Usuário não encontrado' });

    res.json({ msg: 'Usuário atualizado', user });
  } catch (err) {
    next(err);
  }
};

// Atualizar dados do próprio usuário logado
exports.atualizarMeusDados = async (req, res) => {
  try {
    const userId = req.user.id;
    const { email, senhaAtual, novaSenha } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: 'Usuário não encontrado.' });

    if (email) {
      user.email = email;
    }

    if (senhaAtual && novaSenha) {
      const bcrypt = require('bcryptjs');
      const senhaCorreta = await bcrypt.compare(senhaAtual, user.senha);
      if (!senhaCorreta) {
        return res.status(400).json({ msg: 'Senha atual incorreta.' });
      }
      const salt = await bcrypt.genSalt(10);
      user.senha = await bcrypt.hash(novaSenha, salt);
    }

    await user.save();
    res.json({ msg: 'Dados atualizados com sucesso!', user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: 'Erro ao atualizar dados.' });
  }
};

//atualizarFotoUsuario
exports.atualizarMinhaFotoUsuario = async (req, res) => {
  try {
    const userId = req.user.id;

    let newFoto = '/assets/images/telas-public/sem_foto.png'; // padrão
    if (req.file) {
      newFoto = `uploads/${req.file.filename}`;
    }

    const user = await User.findByIdAndUpdate(userId, { foto: newFoto }, { new: true });

    if (!user) return res.status(404).json({ msg: 'Usuário não encontrado' });

    res.json({ msg: 'Foto atualizada com sucesso', user });
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: 'Erro ao atualizar foto do usuário' });
  }
};

//excluir user (admin)
exports.excluirUsuario = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ msg: 'Usuário não encontrado' });

    res.json({ msg: 'Usuário excluído com sucesso' });
  } catch (err) {
    next(err);
  }
};

//ver tds funcionarios
exports.listarFuncionarios = async (req, res, next) => {
  try {
    const funcionarios = await User.find({ role: 'funcionario' }).select('-senha');
    res.json(funcionarios);
  } catch (err) {
    next(err);
  }
};

//ver tds chefe
exports.listarChefe = async (req, res, next) => {
  try {
    const chefe = await User.find({ role: 'chefe' }).select('-senha');
    res.json(chefe);
  } catch (err) {
    next(err);
  }
};
