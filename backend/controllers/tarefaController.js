const Tarefa = require('../models/Tarefa');
const User = require('../models/User');
const Notificacao = require('../models/Notificacao');

// Criar tarefa (chefe e admin)
exports.criarTarefa = async (req, res, next) => {
  try {
    const chefeId = req.user.id;
    const { funcionario, titulo, descricao, prioridade, dataPrevista, tempoEstimado, paciente, categorias } = req.body;

    if (!funcionario || !titulo) {
      return res.status(400).json({ msg: 'Funcionario e título são obrigatórios' });
    }

    const user = await User.findById(funcionario);
    if (!user) return res.status(404).json({ msg: 'Funcionário não encontrado' });

    const categoriasFormatadas = Array.isArray(categorias)
      ? categorias.map(c => ({
          nome: c.nome || 'Sem nome',
          cor: c.cor || '#3C188F',
          icone: c.icone || '⭐'
        }))
      : [];

    const tarefa = await Tarefa.create({
      titulo,
      descricao,
      prioridade,
      funcionario,
      dataPrevista,
      tempoEstimado,
      paciente,
      categorias: categoriasFormatadas
    });

    // 🔔 Criar notificação automática para o funcionário
    const notificacao = await Notificacao.create({
      usuario: funcionario,
      titulo: titulo,
      descricao: descricao || 'Você recebeu uma nova tarefa do seu chefe.'
    });

    // 🔴 Emitir notificação via Socket.io
    const io = req.app.get('io'); // pega o io
    io.to(funcionario.toString()).emit('nova_notificacao', notificacao);

    res.status(201).json({ msg: 'Tarefa criada e notificação enviada', tarefa });
  } catch (err) {
    next(err);
  }
};

// ✅ Agora populando também o campo `role`
exports.todasTarefas = async (req, res) => {
  try {
    const tarefas = await Tarefa.find().populate('funcionario', 'nome setor foto role');
    res.json(tarefas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Listar tarefas de um funcionário específico
exports.tarefasFuncionario = async (req, res, next) => {
  try {
    const { funcionarioId } = req.params;

    const tarefas = await Tarefa.find({ funcionario: funcionarioId })
      .populate('funcionario', '_id nome foto role')
      .sort({ createdAt: -1 });

    res.json(tarefas);
  } catch (err) {
    next(err);
  }
};

// Atualizar tarefa (chefe e admin)
exports.atualizarTarefa = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const tarefa = await Tarefa.findByIdAndUpdate(id, updates, { new: true }).populate(
      'funcionario',
      '_id nome foto role'
    );

    if (!tarefa) return res.status(404).json({ msg: 'Tarefa não encontrada' });

    res.json({ msg: 'Tarefa atualizada', tarefa });
  } catch (err) {
    next(err);
  }
};

// Deletar tarefa (chefe e admin)
exports.deletarTarefa = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tarefa = await Tarefa.findByIdAndDelete(id);
    if (!tarefa) return res.status(404).json({ msg: 'Tarefa não encontrada' });

    res.json({ msg: 'Tarefa deletada' });
  } catch (err) {
    next(err);
  }
};

// ✅ Também adicionando `role` aqui
exports.minhasTarefas = async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const tarefas = await Tarefa.find({ funcionario: usuarioId }).populate('funcionario', 'nome setor foto role');
    res.json(tarefas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.atualizarStatusProprio = async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const { id } = req.params;
    const { status } = req.body;

    const tarefa = await Tarefa.findOne({ _id: id, funcionario: usuarioId });
    if (!tarefa) return res.status(404).json({ msg: 'Tarefa não encontrada' });

    if (!['pendente', 'em_andamento', 'concluida'].includes(status)) {
      return res.status(400).json({ msg: 'Status inválido' });
    }

    tarefa.status = status;
    await tarefa.save();

    res.json({ msg: 'Status atualizado', tarefa });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
