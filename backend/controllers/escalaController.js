const mongoose = require('mongoose');
const Escala = require('../models/Escala');
const User = require('../models/User');
const Notificacao = require('../models/Notificacao');

exports.criarOuEditarEscala = async (req, res) => {
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

    // 🔹 Semana: domingo e sábado em UTC
    const semanaInicio = new Date(dataBase);
    semanaInicio.setUTCDate(dataBase.getUTCDate() - dataBase.getUTCDay());
    semanaInicio.setUTCHours(0, 0, 0, 0);

    const semanaFim = new Date(semanaInicio);
    semanaFim.setUTCDate(semanaInicio.getUTCDate() + 6);
    semanaFim.setUTCHours(23, 59, 59, 999);

    const nomesDias = [
      'domingo', 'segunda-feira', 'terça-feira', 'quarta-feira',
      'quinta-feira', 'sexta-feira', 'sábado'
    ];
    const diaSemana = nomesDias[dataBase.getUTCDay()];

    // 🔹 Formatar hora
    const formatarHora = h => {
      if (!h) return null;
      if (typeof h === 'string') return h;
      return h.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    // 🔹 Buscar escala da mesma semana exata
    let escala = await Escala.findOne({
      funcionario,
      semanaInicio
    });

    let tipo = 'nova';

    if (escala) {
      tipo = 'atualizacao';

      const diaIndex = escala.dias.findIndex(
        d => new Date(d.data).toUTCString() === dataBase.toUTCString()
      );

      if (diaIndex >= 0) {
        escala.dias[diaIndex] = {
          dia: diaSemana,
          data: dataBase,
          horaEntrada: formatarHora(horaEntrada),
          horaSaida: formatarHora(horaSaida),
          folga: !!folga
        };
      } else {
        if (escala.dias.length >= 7) {
          return res.status(400).json({
            msg: `Essa semana (${semanaInicio.toLocaleDateString()} - ${semanaFim.toLocaleDateString()}) já está completa.`
          });
        }

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
      // 🔹 Criar nova semana
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

    // 🔔 Notificação
    const titulo = 'Escala atualizada';
    const descricao =
      tipo === 'nova'
        ? `Sua escala semanal foi criada (${semanaInicio.toLocaleDateString()} - ${semanaFim.toLocaleDateString()}).`
        : 'Sua escala semanal foi atualizada.';

    let notificacao = await Notificacao.findOne({ usuario: funcionario, titulo });

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

    // Enviar via socket
    const io = req.app.get('io');
    io.to(funcionario.toString()).emit('nova_notificacao', notificacao);

    return res.status(201).json({
      msg: tipo === 'nova' ? 'Escala semanal criada com sucesso!' : 'Escala semanal atualizada!',
      escala
    });

  } catch (err) {
    console.error('Erro ao criar/editar escala semanal:', err);
    res.status(500).json({ msg: 'Erro interno ao criar/editar escala semanal' });
  }
};



//
//  🗑️ EXCLUIR ESCALA
//
exports.excluirEscala = async (req, res) => {
  try {
    const { id } = req.params;

    const escala = await Escala.findById(id);

    if (!escala) {
      return res.status(404).json({ msg: 'Escala não encontrada.' });
    }

    await Escala.findByIdAndDelete(id);

    return res.status(200).json({ msg: 'Escala excluída com sucesso!' });

  } catch (error) {
    console.error('Erro ao excluir escala:', error);
    return res.status(500).json({ msg: 'Erro interno do servidor.' });
  }
};



//
//  📌 MINHAS ESCALAS
//
exports.minhasEscalas = async (req, res) => {
  try {
    const funcionarioId = req.user.id;

    const escalas = await Escala.find({ funcionario: funcionarioId })
      .populate('funcionario', 'nome foto setor role')
      .sort({ semanaInicio: 1 });

    res.json(escalas);

  } catch (err) {
    console.error('Erro ao listar escalas do funcionário:', err);
    res.status(500).json({ msg: 'Erro ao listar suas escalas' });
  }
};

exports.todasEscalas = async (req, res) => {
  try {
    const escalas = await Escala.find()
      .populate('funcionario', 'nome foto setor role')
      .sort({ semanaInicio: -1 });

    res.json(escalas);

  } catch (err) {
    console.error('Erro ao listar todas as escalas:', err);
    res.status(500).json({ msg: 'Erro ao listar escalas' });
  }
};



//
//  📌 ESCALAS POR FUNCIONÁRIO (usada pela rota /:funcionarioId)
//
exports.escalasPorFuncionario = async (req, res) => {
  try {
    const { funcionarioId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(funcionarioId)) {
      return res.status(400).json({ msg: 'ID inválido.' });
    }

    const escalas = await Escala.find({ funcionario: funcionarioId })
      .populate('funcionario', 'nome foto setor role')
      .sort({ semanaInicio: 1 });

    res.json(escalas);

  } catch (err) {
    console.error('Erro ao buscar escalas do funcionário:', err);
    res.status(500).json({ msg: 'Erro ao buscar escalas do funcionário.' });
  }
};



//
//  ⏰ HORÁRIO DO DIA
//
exports.horarioDoDia = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ msg: 'Usuário não autenticado.' });
    }

    const funcionarioId = req.user.id;

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const escala = await Escala.findOne({
      funcionario: funcionarioId,
      semanaInicio: { $lte: hoje },
      semanaFim: { $gte: hoje }
    });

    if (!escala) {
      return res.status(404).json({ msg: 'Nenhuma escala encontrada para esta semana.' });
    }

    const dia = escala.dias.find(d => {
      const dataDia = new Date(d.data);
      dataDia.setHours(0, 0, 0, 0);
      return dataDia.getTime() === hoje.getTime();
    });

    if (!dia) {
      return res.status(404).json({ msg: 'Nenhuma escala encontrada para hoje.' });
    }

    res.json({
      dia: dia.dia,
      data: dia.data,
      folga: dia.folga,
      horaEntrada: dia.horaEntrada,
      horaSaida: dia.horaSaida
    });

  } catch (err) {
    console.error('Erro ao buscar horário do dia:', err);
    res.status(500).json({ msg: 'Erro ao buscar horário do dia.' });
  }
};
