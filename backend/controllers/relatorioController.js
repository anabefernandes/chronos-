const Ponto = require('../models/Ponto');
const User = require('../models/User');
const Holerite = require('../models/Holerite');

function formatarHora(horasDecimais) {
  if (!horasDecimais || horasDecimais <= 0) return '0h 00min';
  const h = Math.floor(horasDecimais);
  const m = Math.round((horasDecimais - h) * 60);
  return `${h}h ${m.toString().padStart(2, '0')}min`;
}

exports.relatorioFuncionario = async (req, res) => {
  try {
    const funcionarioId = req.params.id || req.user.id;

    // Busca usuário e seleciona campos essenciais
    const funcionario = await User.findById(funcionarioId).select(
      'nome email salario cargaHorariaDiaria role setor foto'
    );

    if (!funcionario) {
      return res.status(404).json({ msg: 'Funcionário não encontrado' });
    }

    // Busca o último holerite do usuário
    const holerite = await Holerite.findOne({ funcionario: funcionarioId }).sort({ periodoInicio: -1 });

    // Monta retorno padrão caso não tenha holerite
    if (!holerite) {
      return res.json({
        funcionario: {
          nome: funcionario.nome,
          role: funcionario.role || 'funcionario',
          setor: funcionario.setor || 'Sem setor',
          foto: funcionario.foto || 'sem_foto.png'
        },
        periodo: { inicio: null, fim: null },
        totais: {
          horasTrabalhadas: '0h 00min',
          horasExtras: '0h 00min',
          horasDescontadas: '0h 00min',
          salarioLiquido: 0,
          horasTrabalhadasDecimal: 0,
          horasExtrasDecimal: 0,
          horasDescontadasDecimal: 0
        },
        pontosDetalhados: []
      });
    }

    // Monta retorno completo caso tenha holerite
    const dados = {
      funcionario: {
        nome: funcionario.nome,
        role: funcionario.role || 'funcionario',
        setor: funcionario.setor || 'Sem setor',
        foto: funcionario.foto || 'sem_foto.png'
      },
      periodo: {
        inicio: holerite.periodoInicio || null,
        fim: holerite.periodoFim || null
      },
      totais: {
        horasTrabalhadas: formatarHora(holerite.totalHoras),
        horasExtras: formatarHora(holerite.totalHorasExtras),
        horasDescontadas: formatarHora(holerite.totalHorasDescontadas),
        salarioLiquido: holerite.salarioLiquido || 0,
        horasTrabalhadasDecimal: holerite.totalHoras || 0,
        horasExtrasDecimal: holerite.totalHorasExtras || 0,
        horasDescontadasDecimal: holerite.totalHorasDescontadas || 0
      },
      pontosDetalhados: holerite.detalhesDias || []
    };

    return res.json(dados);
  } catch (e) {
    console.error('Erro ao gerar relatório:', e);
    return res.status(500).json({ msg: 'Erro ao gerar relatório' });
  }
};
