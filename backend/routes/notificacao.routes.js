const router = require('express').Router();
const ctrl = require('../controllers/notificacaoController');
const { auth, requireRole } = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Notificações
 *   description: Notificações de tarefas para usuários
 */

/**
 * @swagger
 * /notificacoes/{usuarioId}:
 *   get:
 *     summary: Listar notificações de um usuário
 *     tags: [Notificações]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: usuarioId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do usuário
 *     responses:
 *       200:
 *         description: Lista de notificações
 */
router.get('/:usuarioId', auth, ctrl.minhasNotificacoes);

/**
 * Criar notificação manual (ex.: admin pode enviar)
 */
router.post('/', auth, requireRole('chefe', 'admin'), ctrl.criarNotificacao);

// notificacao.routes.js
router.patch('/:id/lida', auth, ctrl.marcarComoLida);

// Marcar todas como lidas
router.patch('/usuario/:usuarioId/lidas', auth, ctrl.marcarTodasComoLidas);

module.exports = router;
