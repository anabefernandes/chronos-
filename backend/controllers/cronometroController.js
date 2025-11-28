// cronometro.controller.js
const Escala = require('../models/Escala');
const Ponto = require('../models/Ponto');
const Notificacao = require('../models/Notificacao');

// Controle de notificações enviadas para evitar spam
const notificacoesEnviadas = {};

// Reaproveita a função de enviar notificação
async function enviarNotificacao(usuario, titulo, descricao, io) {
  const notificacao = await Notificacao.create({
    usuario,
    titulo,
    descricao,
    tipo: 'alerta'
  });
  io.to(usuario.toString()).emit('nova_notificacao', notificacao);
}

// Converte "07:00" em Date (mesma data)
function gerarHorarioEsperado(dataBase, horarioStr) {
  if (!horarioStr) return null;
  const [h, m] = horarioStr.split(':').map(Number);
  const d = new Date(dataBase);
  d.setHours(h, m, 0, 0);
  return d;
}

// Função principal do cronometro
async function checarAvisosPonto(io) {
  const hoje = new Date();
  hoje.setHours(0,0,0,0);

  const escalasHoje = await Escala.find({
    semanaInicio: { $lte: hoje },
    semanaFim: { $gte: hoje }
  }).populate('funcionario');

  for (const escala of escalasHoje) {
    const diaEscalaHoje = escala.dias.find(d => {
      const dataDia = new Date(d.data);
      dataDia.setHours(0,0,0,0);
      return dataDia.getTime() === hoje.getTime();
    });

    if (!diaEscalaHoje || diaEscalaHoje.folga) continue;

    const userId = escala.funcionario._id.toString();

    // ⚡ Horário de Entrada
    if (diaEscalaHoje.horaEntrada) {
      const horarioEntrada = gerarHorarioEsperado(hoje, diaEscalaHoje.horaEntrada);
      const diffEntrada = (horarioEntrada - new Date()) / 60000;

      if (diffEntrada > 0 && diffEntrada <= 5) {
        if (!notificacoesEnviadas[userId]?.entrada) {
          await enviarNotificacao(userId, 'Entrada', `Faltam ${Math.round(diffEntrada)} min para o início do expediente (${diaEscalaHoje.horaEntrada})`, io);
          notificacoesEnviadas[userId] = { ...notificacoesEnviadas[userId], entrada: true };
        }
      }
    }

    // ⚡ Horário de Almoço baseado no registro real
    const pontoAlmoco = await Ponto.findOne({
      funcionario: userId,
      status: 'almoco',
      horario: { $gte: hoje, $lt: new Date(hoje.getTime() + 24*60*60*1000) }
    });

    const pontoRetorno = await Ponto.findOne({
      funcionario: userId,
      status: 'retorno',
      horario: { $gte: hoje, $lt: new Date(hoje.getTime() + 24*60*60*1000) }
    });

    if (pontoAlmoco) {
      // Se começou almoço → aviso faltando 5 min para terminar
      const horarioFimAlmoco = pontoRetorno
        ? pontoRetorno.horario
        : new Date(pontoAlmoco.horario.getTime() + 60*60*1000); // 1h padrão se ainda não registrou retorno

      const diffAlmoco = (horarioFimAlmoco - new Date()) / 60000;
      if (diffAlmoco > 0 && diffAlmoco <= 5) {
        if (!notificacoesEnviadas[userId]?.almocoFim) {
          await enviarNotificacao(userId, 'Almoço', `Faltam ${Math.round(diffAlmoco)} min para terminar o almoço`, io);
          notificacoesEnviadas[userId] = { ...notificacoesEnviadas[userId], almocoFim: true };
        }
      }
    }
  }
}

// Inicia checagem a cada minuto
function iniciarCronometro(io) {
  setInterval(() => checarAvisosPonto(io), 60 * 1000);
}

module.exports = iniciarCronometro;
