const router = require("express").Router();
const ctrl = require("../controllers/holeriteController");
const { auth, requireRole } = require("../middlewares/auth");

/**
 * @swagger
 * tags:
 *   name: Holerite
 *   description: Rotas para criação e visualização de holerites
 */

/**
 * @swagger
 * /holerite/criarOuEditarHolerite:
 *   post:
 *     summary: Criar ou editar holerite de um funcionário (somente admin)
 *     tags: [Holerite]
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
 *               - periodoInicio
 *               - periodoFim
 *               - valorHora
 *             properties:
 *               funcionario:
 *                 type: string
 *                 description: ID do funcionário
 *                 example: "64f0b3f123456789abcdef01"
 *               periodoInicio:
 *                 type: string
 *                 format: date
 *                 example: "2025-09-01"
 *               periodoFim:
 *                 type: string
 *                 format: date
 *                 example: "2025-09-30"
 *               valorHora:
 *                 type: number
 *                 description: Valor da hora para cálculo do holerite
 *                 example: 20
 *               descontos:
 *                 type: number
 *                 description: Descontos no holerite
 *                 example: 200
 *     responses:
 *       201:
 *         description: Holerite criado ou atualizado com sucesso
 *       400:
 *         description: Campos obrigatórios ausentes
 *       403:
 *         description: Permissão negada
 */
router.post(
  "/criarOuEditarHolerite",
  auth,
  requireRole("admin"),
  ctrl.criarOuEditarHolerite
);

/**
 * @swagger
 * /holerite/meuHolerite:
 *   get:
 *     summary: Visualizar holerite do funcionário logado
 *     tags: [Holerite]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Holerite do usuário
 *       401:
 *         description: Token inválido ou ausente
 */
router.get("/meuHolerite", auth, ctrl.meuHolerite);

/**
 * @swagger
 * /holerite/todosHolerites:
 *   get:
 *     summary: Listar todos os holerites (somente admin)
 *     tags: [Holerite]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de todos os holerites
 *       403:
 *         description: Permissão negada
 */
router.get("/todosHolerites", auth, requireRole("admin"), ctrl.todosHolerites);

module.exports = router;
