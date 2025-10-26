const router = require('express').Router();
const ctrl = require('../controllers/tarefaController');
const { auth, requireRole } = require('../middlewares/auth');

/**
 * @swagger
 * tags:
 *   name: Tarefas
 *   description: Gerenciamento de tarefas dos funcionários
 */

/**
 * @swagger
 * /tarefas:
 *   post:
 *     summary: Criar tarefa para um funcionário (chefe ou admin)
 *     tags: [Tarefas]
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
 *               - titulo
 *             properties:
 *               funcionario:
 *                 type: string
 *                 description: ID do funcionário
 *                 example: "64f0b3f123456789abcdef01"
 *               titulo:
 *                 type: string
 *                 example: "Revisar prontuário"
 *               descricao:
 *                 type: string
 *                 example: "Verificar todos os pacientes do turno"
 *               prioridade:
 *                 type: string
 *                 enum: [baixa, media, alta]
 *                 example: media
 *               dataPrevista:
 *                 type: string
 *                 format: date
 *                 example: "2025-09-15"
 *               tempoEstimado:
 *                 type: number
 *                 example: 120
 *     responses:
 *       201:
 *         description: Tarefa criada com sucesso
 *       400:
 *         description: Campos obrigatórios ausentes
 *       403:
 *         description: Permissão negada
 */
router.post('/', auth, requireRole('chefe', 'admin'), ctrl.criarTarefa);

router.get('/', auth, requireRole('chefe', 'admin'), ctrl.todasTarefas);
/**
 * @swagger
 * /tarefas/funcionario/{funcionarioId}:
 *   get:
 *     summary: Listar tarefas de um funcionário (chefe ou admin)
 *     tags: [Tarefas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: funcionarioId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID do funcionário
 *     responses:
 *       200:
 *         description: Lista de tarefas do funcionário
 *       403:
 *         description: Permissão negada
 */
router.get('/funcionario/:funcionarioId', auth, requireRole('chefe', 'admin'), ctrl.tarefasFuncionario);

/**
 * @swagger
 * /tarefas/{id}:
 *   put:
 *     summary: Atualizar uma tarefa (chefe ou admin)
 *     tags: [Tarefas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID da tarefa
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               titulo:
 *                 type: string
 *               descricao:
 *                 type: string
 *               prioridade:
 *                 type: string
 *                 enum: [baixa, media, alta]
 *               status:
 *                 type: string
 *                 enum: [pendente, em_andamento, concluida]
 *               dataPrevista:
 *                 type: string
 *                 format: date
 *               tempoEstimado:
 *                 type: number
 *     responses:
 *       200:
 *         description: Tarefa atualizada com sucesso
 *       404:
 *         description: Tarefa não encontrada
 */
router.put('/:id', auth, requireRole('chefe', 'admin'), ctrl.atualizarTarefa);

/**
 * @swagger
 * /tarefas/{id}:
 *   delete:
 *     summary: Deletar uma tarefa (chefe ou admin)
 *     tags: [Tarefas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID da tarefa
 *     responses:
 *       200:
 *         description: Tarefa deletada com sucesso
 *       404:
 *         description: Tarefa não encontrada
 */
router.delete('/:id', auth, requireRole('chefe', 'admin'), ctrl.deletarTarefa);

/**
 * @swagger
 * /tarefas/minhas:
 *   get:
 *     summary: Listar tarefas do usuário logado
 *     tags: [Tarefas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de tarefas do usuário logado
 *       401:
 *         description: Token inválido ou ausente
 */
router.get('/minhas', auth, ctrl.minhasTarefas);
router.put('/minha/:id', auth, ctrl.atualizarStatusProprio);

module.exports = router;
