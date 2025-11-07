const Holerite = require('../models/Holerite');
const Ponto = require('../models/Ponto');

function formatarHoras(horasDecimais) {
  const horas = Math.floor(horasDecimais);
  const minutos = Math.round((horasDecimais - horas) * 60);
  return `${horas}h${minutos.toString().padStart(2, '0')}min`;
}

// criar ou editar holerite (apenas admin)
exports.criarOuEditarHolerite = async (req, res, next) => {
  try {
    const { funcionario, periodoInicio, periodoFim, valorHora, descontos } = req.body;

    if (!funcionario || !periodoInicio || !periodoFim) {
      return res.status(400).json({ msg: 'Campos obrigatórios faltando' });
    }

    let holerite = await Holerite.findOne({
      funcionario,
      periodoInicio: new Date(periodoInicio),
      periodoFim: new Date(periodoFim)
    });

    if (!holerite) {
      holerite = await Holerite.create({
        funcionario,
        periodoInicio: new Date(periodoInicio),
        periodoFim: new Date(periodoFim),
        valorHora: Number(valorHora || 20),
        descontos: Number(descontos || 0),
        totalHoras: 0,
        totalHorasExtras: 0,
        totalHorasDescontadas: 0,
        salarioLiquido: 0,
        detalhesDias: []
      });
      return res.status(201).json({ msg: 'Holerite criado (aguardando pontos)', holerite });
    }

    if (valorHora !== undefined) holerite.valorHora = Number(valorHora);
    if (descontos !== undefined) holerite.descontos = Number(descontos);

    holerite.detalhesDias = holerite.detalhesDias.map(d => ({
      ...d.toObject(),
      horasFormatadas: formatarHoras(d.horasTrabalhadas || 0),
      horasExtrasFormatadas: formatarHoras(d.horasExtras || 0),
      horasFaltantesFormatadas: formatarHoras(d.horasFaltantes || 0)
    }));

    await holerite.save();

    res.json({ msg: 'Holerite atualizado', holerite });
  } catch (err) {
    next(err);
  }
};

// holerites do func logado
exports.meuHolerite = async (req, res, next) => {
  try {
    const funcionarioId = req.user.id;
    let holerites = await Holerite.find({ funcionario: funcionarioId }).sort({ periodoInicio: -1 });

    holerites = holerites.map(h => ({
      ...h.toObject(),
      detalhesDias: h.detalhesDias.map(d => ({
        ...d.toObject(),
        horasFormatadas: formatarHoras(d.horasTrabalhadas || 0),
        horasExtrasFormatadas: formatarHoras(d.horasExtras || 0),
        horasFaltantesFormatadas: formatarHoras(d.horasFaltantes || 0)
      }))
    }));

    res.json(holerites);
  } catch (err) {
    next(err);
  }
};

// todos os holerites (admin)
exports.todosHolerites = async (req, res, next) => {
  try {
    let holerites = await Holerite.find()
      .populate('funcionario', 'nome email')
      .sort({ periodoInicio: -1 });

    holerites = holerites.map(h => ({
      ...h.toObject(),
      detalhesDias: h.detalhesDias.map(d => ({
        ...d.toObject(),
        horasFormatadas: formatarHoras(d.horasTrabalhadas || 0),
        horasExtrasFormatadas: formatarHoras(d.horasExtras || 0),
        horasFaltantesFormatadas: formatarHoras(d.horasFaltantes || 0)
      }))
    }));

    res.json(holerites);
  } catch (err) {
    next(err);
  }
};
