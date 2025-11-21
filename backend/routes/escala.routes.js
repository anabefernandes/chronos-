const router = require('express').Router();
const ctrl = require('../controllers/escalaController');
const { auth, requireRole } = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Escala
 *   description: Rotas para criação e visualização de escalas
 */

/**
 * @swagger
 * /escala/criarOuEditarEscala:
 *   post:
 *     summary: Criar ou editar escala de um funcionário (somente chefe e admin)
 *     tags: [Escala]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - funcionario
 *               - dataInicio
 *               - dataFim
 *             properties:
 *               funcionario:
 *                 type: string
 *                 description: ID do funcionário
 *                 example: "64f0b3f123456789abcdef01"
 *               dataInicio:
 *                 type: string
 *                 format: date
 *                 example: "2025-09-15"
 *               dataFim:
 *                 type: string
 *                 format: date
 *                 example: "2025-09-21"
 *               turno:
 *                 type: string
 *                 example: "matutino"
 *     responses:
 *       201:
 *         description: Escala criada ou atualizada com sucesso
 *       400:
 *         description: Campos obrigatórios ausentes
 *       403:
 *         description: Permissão negada
 */
router.post('/criarOuEditarEscala', auth, requireRole('chefe', 'admin'), ctrl.criarOuEditarEscala);

/**
 * @swagger
 * /escala/minhasEscalas:
 *   get:
 *     summary: Listar escalas do funcionário logado
 *     tags: [Escala]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de escalas do usuário
 *       401:
 *         description: Token inválido ou ausente
 */
router.get('/minhasEscalas', auth, ctrl.minhasEscalas);

/**
 * @swagger
 * /escala/todasEscalas:
 *   get:
 *     summary: Listar todas as escalas (somente admin)
 *     tags: [Escala]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de todas as escalas
 *       403:
 *         description: Permissão negada
 */
router.get('/todasEscalas', auth, requireRole('admin', 'chefe'), ctrl.todasEscalas);

/**
 * @swagger
 * /escala/{funcionarioId}:
 *   get:
 *     summary: Listar todas as escalas de um funcionário específico
 *     tags: [Escala]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: funcionarioId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do funcionário
 *     responses:
 *       200:
 *         description: Lista de escalas do funcionário
 *       400:
 *         description: ID ausente
 *       401:
 *         description: Token inválido
 *       500:
 *         description: Erro interno do servidor
 */
router.get('/:funcionarioId', auth, requireRole('chefe', 'admin'), ctrl.escalasPorFuncionario);

router.get('/horario-do-dia', auth, ctrl.horarioDoDia);

router.delete('/:id', auth, ctrl.excluirEscala);

module.exports = router;
