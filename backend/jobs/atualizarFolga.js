const cron = require('node-cron');
const User = require('../models/User');
const Escala = require('../models/Escala');

function atualizarFolgas(io) {
  // Executa todo dia às 00:01
  cron.schedule('* * * * *', async () => {
    console.log('Atualizando status de folgas dos funcionários...');

    try {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);

      // Buscar todas escalas ativas para hoje
      const escalas = await Escala.find({
        semanaInicio: { $lte: hoje },
        semanaFim: { $gte: hoje }
      }).populate('funcionario');

      for (const escala of escalas) {
        const diaEscala = escala.dias.find(d => {
          const dataDia = new Date(d.data);
          dataDia.setHours(0, 0, 0, 0);
          return dataDia.getTime() === hoje.getTime();
        });

        if (diaEscala?.folga) {
          const funcionarioId = escala.funcionario._id;

          await User.findByIdAndUpdate(funcionarioId, { status: 'Folga' });

          // Notificação via WebSocket
          if (io) {
            io.emit('statusAtualizado', { userId: funcionarioId, novoStatus: 'Folga' });
          }

          console.log(`Status de folga atualizado para ${escala.funcionario.nome}`);
        }
      }

      console.log('Atualização de folgas concluída ✅');
    } catch (err) {
      console.error('Erro ao atualizar folgas:', err);
    }
  });
}

module.exports = atualizarFolgas;
