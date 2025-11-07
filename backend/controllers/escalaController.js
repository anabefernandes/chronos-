const Escala = require('../models/Escala');
const User = require('../models/User');

// ✅ Criar ou editar escala semanal
exports.criarOuEditarEscala = async (req, res, next) => {
  try {
    const { funcionario, data, horaEntrada, horaSaida, folga } = req.body;

    if (!funcionario || !data) {
      return res.status(400).json({ msg: 'Funcionário e data são obrigatórios' });
    }

    // Se não for folga, precisa ter horaEntrada e horaSaida
    if (!folga && (!horaEntrada || !horaSaida)) {
      return res.status(400).json({ msg: 'Horários obrigatórios quando não é folga' });
    }

    const dataBase = new Date(data);
    const nomesDias = [
      'domingo',
      'segunda-feira',
      'terça-feira',
      'quarta-feira',
      'quinta-feira',
      'sexta-feira',
      'sábado'
    ];
    const diaSemana = nomesDias[dataBase.getDay()];

    // 📅 Início (domingo) e fim (sábado) da semana
    const semanaInicio = new Date(dataBase);
    semanaInicio.setDate(dataBase.getDate() - dataBase.getDay());
    semanaInicio.setHours(0, 0, 0, 0);

    const semanaFim = new Date(semanaInicio);
    semanaFim.setDate(semanaInicio.getDate() + 6);
    semanaFim.setHours(23, 59, 59, 999);

    // 🕐 Formatar hora se existir
    const formatarHora = h => {
      if (!h) return null;
      if (typeof h === 'string') return h;
      return h.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    // 🔎 Busca escala da semana
    let escala = await Escala.findOne({
      funcionario,
      semanaInicio: { $lte: dataBase },
      semanaFim: { $gte: dataBase }
    });

    if (escala) {
      // Atualiza o dia existente ou adiciona novo
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
      return res.json({ msg: 'Dia atualizado na escala semanal!', escala });
    }

    // 🆕 Cria nova escala
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

    res.status(201).json({ msg: 'Escala semanal criada!', escala });
  } catch (err) {
    console.error('Erro ao criar/editar escala semanal:', err);
    res.status(500).json({ msg: 'Erro interno ao criar/editar escala semanal' });
  }
};

// ✅ Listar escalas do funcionário logado
exports.minhasEscalas = async (req, res, next) => {
  try {
    const funcionarioId = req.user.id;

    const escalas = await Escala.find({ funcionario: funcionarioId }).sort({ semanaInicio: 1 });

    res.json(escalas);
  } catch (err) {
    console.error('Erro ao listar escalas do funcionário:', err);
    res.status(500).json({ msg: 'Erro ao listar suas escalas' });
  }
};

// ✅ Listar todas as escalas (admin)
exports.todasEscalas = async (req, res, next) => {
  try {
    const escalas = await Escala.find().populate('funcionario', 'nome email').sort({ semanaInicio: -1 });

    res.json(escalas);
  } catch (err) {
    console.error('Erro ao listar todas as escalas:', err);
    res.status(500).json({ msg: 'Erro ao listar escalas' });
  }
};
