const Escala = require('../models/Escala');
const User = require('../models/User');
const Notificacao = require('../models/Notificacao');

// ✅ Criar ou editar escala semanal
exports.criarOuEditarEscala = async (req, res, next) => {
  try {
    const { funcionario, data, horaEntrada, horaSaida, folga } = req.body;

    if (!funcionario || !data) {
      return res.status(400).json({ msg: 'Funcionário e data são obrigatórios' });
    }

    if (req.user.role === 'chefe' && funcionario === req.user.id) {
      return res.status(403).json({ msg: 'Chefes não podem criar ou editar suas próprias escalas' });
    }

    if (!folga && (!horaEntrada || !horaSaida)) {
      return res.status(400).json({ msg: 'Horários obrigatórios quando não é folga' });
    }

    const dataBase = new Date(data);
    const nomesDias = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
    const diaSemana = nomesDias[dataBase.getDay()];

    const semanaInicio = new Date(dataBase);
    semanaInicio.setDate(dataBase.getDate() - dataBase.getDay());
    semanaInicio.setHours(0, 0, 0, 0);

    const semanaFim = new Date(semanaInicio);
    semanaFim.setDate(semanaInicio.getDate() + 6);
    semanaFim.setHours(23, 59, 59, 999);

    const formatarHora = h => {
      if (!h) return null;
      if (typeof h === 'string') return h;
      return h.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    // 🔒 Verificação: funcionário já tem escala criada para esta semana?
    const escalaExistenteSemana = await Escala.findOne({
      funcionario,
      semanaInicio: { $lte: dataBase },
      semanaFim: { $gte: dataBase }
    });

    if (escalaExistenteSemana) {
      // Verifica se o mesmo dia já foi cadastrado
      const jaTemDia = escalaExistenteSemana.dias.some(
        d => new Date(d.data).toDateString() === dataBase.toDateString()
      );

      if (jaTemDia) {
        return res.status(400).json({ msg: 'Esse dia já está cadastrado nesta escala semanal.' });
      }

      // Caso a semana já tenha 7 dias cadastrados, bloqueia criação
      if (escalaExistenteSemana.dias.length >= 7) {
        return res.status(400).json({
          msg: `Essa semana (${semanaInicio.toLocaleDateString()} - ${semanaFim.toLocaleDateString()}) já está completa. Crie uma nova semana.`
        });
      }
    }

    let escala = await Escala.findOne({
      funcionario,
      semanaInicio: { $lte: dataBase },
      semanaFim: { $gte: dataBase }
    });

    let tipo = 'nova';

    if (escala) {
      tipo = 'atualizacao';

      const diaIndex = escala.dias.findIndex(d => new Date(d.data).toDateString() === dataBase.toDateString());

      if (diaIndex >= 0) {
        escala.dias[diaIndex] = {
          dia: diaSemana,
          data: dataBase,
          horaEntrada: formatarHora(horaEntrada),
          horaSaida: formatarHora(horaSaida),
          folga: !!folga
        };
      } else {
        escala.dias.push({
          dia: diaSemana,
          data: dataBase,
          horaEntrada: formatarHora(horaEntrada),
          horaSaida: formatarHora(horaSaida),
          folga: !!folga
        });
      }

      await escala.save();
    } else {
      escala = await Escala.create({
        funcionario,
        semanaInicio,
        semanaFim,
        dias: [
          {
            dia: diaSemana,
            data: dataBase,
            horaEntrada: formatarHora(horaEntrada),
            horaSaida: formatarHora(horaSaida),
            folga: !!folga
          }
        ]
      });
    }

    // 🔔 Criar ou atualizar notificação
    const titulo = 'Escala atualizada';
    const descricao = tipo === 'nova'
      ? `Sua escala semanal foi criada (${semanaInicio.toLocaleDateString()} - ${semanaFim.toLocaleDateString()}).`
      : 'Sua escala semanal foi atualizada.';

    let notificacao = await Notificacao.findOne({ usuario: funcionario, titulo: 'Escala atualizada' });

    if (notificacao) {
      notificacao.descricao = descricao;
      notificacao.dataCriacao = new Date();
      notificacao.tipo = 'escala';
      await notificacao.save();
    } else {
      notificacao = await Notificacao.create({
        usuario: funcionario,
        titulo,
        descricao,
        tipo: 'escala'
      });
    }

    const io = req.app.get('io');
    io.to(funcionario.toString()).emit('nova_notificacao', notificacao);

    const msg = tipo === 'nova' ? 'Escala semanal criada com sucesso!' : 'Escala semanal atualizada!';
    res.status(201).json({ msg, escala });
  } catch (err) {
    console.error('Erro ao criar/editar escala semanal:', err);
    res.status(500).json({ msg: 'Erro interno ao criar/editar escala semanal' });
  }
};

// ✅ Listar escalas do funcionário logado
exports.minhasEscalas = async (req, res, next) => {
  try {
    const funcionarioId = req.user.id;
    const escalas = await Escala.find({ funcionario: funcionarioId })
      .populate('funcionario', 'nome foto setor role') // ✅ populando todos os campos necessários
      .sort({ semanaInicio: 1 });

    res.json(escalas);
  } catch (err) {
    console.error('Erro ao listar escalas do funcionário:', err);
    res.status(500).json({ msg: 'Erro ao listar suas escalas' });
  }
};

// ✅ Listar todas as escalas
exports.todasEscalas = async (req, res, next) => {
  try {
    const escalas = await Escala.find()
      .populate('funcionario', 'nome foto setor role') // ✅ populando todos os campos
      .sort({ semanaInicio: -1 });

    res.json(escalas);
  } catch (err) {
    console.error('Erro ao listar todas as escalas:', err);
    res.status(500).json({ msg: 'Erro ao listar escalas' });
  }
};

// ✅ Listar escalas de um funcionário específico
exports.escalasPorFuncionario = async (req, res, next) => {
  try {
    const { funcionarioId } = req.params;

    if (!funcionarioId) {
      return res.status(400).json({ msg: 'ID do funcionário é obrigatório.' });
    }

    const escalas = await Escala.find({ funcionario: funcionarioId })
      .populate('funcionario', 'nome foto setor role') // ✅ populando todos os campos
      .sort({ semanaInicio: 1 });

    res.json(escalas);
  } catch (err) {
    console.error('Erro ao buscar escalas do funcionário:', err);
    res.status(500).json({ msg: 'Erro ao buscar escalas do funcionário.' });
  }
};
