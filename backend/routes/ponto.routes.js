const router = require('express').Router();
const ctrl = require('../controllers/pontoController');
const { auth, requireRole } = require('../middlewares/auth');

console.log(ctrl);

/**
 * @swagger
 * tags:
 *   name: Ponto
 *   description: Controle de ponto eletrônico
 */

/**
 * @swagger
 * /ponto:
 *   post:
 *     summary: Registrar batida de ponto (Entrada, Saída, Almoço, Retorno)
 *     tags: [Ponto]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [entrada, saida, almoco, retorno]
 *                 example: entrada
 *               localizacao:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                   longitude:
 *                     type: number
 *     responses:
 *       201:
 *         description: Ponto registrado
 */
router.post('/', auth, ctrl.registrarPonto);

/**
 * @swagger
 * /ponto/meus:
 *   get:
 *     summary: Listar pontos do funcionário logado
 *     tags: [Ponto]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de pontos
 */
router.get('/meus', auth, ctrl.meusPontos);

/**
 * @swagger
 * /ponto/todos:
 *   get:
 *     summary: Listar pontos de todos os funcionários (somente admin)
 *     tags: [Ponto]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de pontos
 */
router.get('/todos', auth, requireRole('admin', 'chefe'), ctrl.todosPontos);
router.get('/statusAtual/:userId', auth, ctrl.getStatusAtual);
router.get('/check-folga', auth, ctrl.checkFolga);

/**
 * @swagger
 * /ponto/tempo-restante:
 *   get:
 *     summary: Retorna o próximo ponto e tempo restante
 *     tags: [Ponto]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Próximo ponto e tempo restante
 */
router.get('/tempo-restante', auth, ctrl.tempoRestante);

module.exports = router;
