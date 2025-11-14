const router = require('express').Router();
const ctrl = require('../controllers/relatorioController');
const { auth, requireRole } = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Relatórios
 *   description: Relatórios de funcionários
 */

/**
 * @swagger
 * /relatorio/me:
 *   get:
 *     summary: Obter relatório do funcionário logado
 *     tags: [Relatórios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Relatório do próprio funcionário
 */
router.get('/me', auth, ctrl.relatorioFuncionario);

/**
 * @swagger
 * /relatorio/funcionario/{id}:
 *   get:
 *     summary: Obter relatório de um funcionário específico (somente admin)
 *     tags: [Relatórios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do funcionário
 *     responses:
 *       200:
 *         description: Relatório do funcionário especificado
 */
router.get('/funcionario/:id', auth, requireRole('admin'), ctrl.relatorioFuncionario);

module.exports = router;
