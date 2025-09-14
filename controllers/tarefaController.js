const Tarefa = require("../models/Tarefa");
const User = require("../models/User");

//criar tarefa(chefe e admin)
exports.criarTarefa = async (req, res, next) => {
  try {
    const chefeId = req.user.id;
    const {
      funcionario,
      titulo,
      descricao,
      prioridade,
      dataPrevista,
      tempoEstimado,
    } = req.body;

    if (!funcionario || !titulo) {
      return res
        .status(400)
        .json({ msg: "Funcionario e título são obrigatórios" });
    }

    const user = await User.findById(funcionario);
    if (!user)
      return res.status(404).json({ msg: "Funcionário não encontrado" });

    const tarefa = await Tarefa.create({
      titulo,
      descricao,
      prioridade,
      funcionario,
      dataPrevista,
      tempoEstimado,
    });

    res.status(201).json({ msg: "Tarefa criada", tarefa });
  } catch (err) {
    next(err);
  }
};

//listar tarefas do funcionario (chefe e admin)
exports.tarefasFuncionario = async (req, res, next) => {
  try {
    const { funcionarioId } = req.params;

    const tarefas = await Tarefa.find({ funcionario: funcionarioId }).sort({
      createdAt: -1,
    });
    res.json(tarefas);
  } catch (err) {
    next(err);
  }
};

//atualizar tarefa (chefe e admin)
exports.atualizarTarefa = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const tarefa = await Tarefa.findByIdAndUpdate(id, updates, { new: true });
    if (!tarefa) return res.status(404).json({ msg: "Tarefa não encontrada" });

    res.json({ msg: "Tarefa atualizada", tarefa });
  } catch (err) {
    next(err);
  }
};

//deleta tarefa (chefe e admin)
exports.deletarTarefa = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tarefa = await Tarefa.findByIdAndDelete(id);
    if (!tarefa) return res.status(404).json({ msg: "Tarefa não encontrada" });

    res.json({ msg: "Tarefa deletada" });
  } catch (err) {
    next(err);
  }
};

//listar tarefas do user logado
exports.minhasTarefas = async (req, res, next) => {
  try {
    const funcionarioId = req.user.id;

    const tarefas = await Tarefa.find({ funcionario: funcionarioId }).sort({
      createdAt: -1,
    });

    res.json(tarefas);
  } catch (err) {
    next(err);
  }
};
