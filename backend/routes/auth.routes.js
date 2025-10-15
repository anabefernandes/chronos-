const router = require("express").Router();
const ctrl = require("../controllers/authController");
const { auth } = require("../middlewares/auth");

/**
 * @swagger
 * tags:
 *   name: Autenticação
 *   description: Rotas de autenticação de usuários
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login de usuário
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - senha
 *             properties:
 *               email:
 *                 type: string
 *                 example: chronos@email.com
 *               senha:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *       401:
 *         description: Credenciais inválidas
 */
router.post("/login", ctrl.login);

/**
 * @swagger
 * /auth/userAuth:
 *   get:
 *     summary: Retorna dados do usuário autenticado
 *     tags: [Autenticação]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Usuário autenticado
 *       401:
 *         description: Token inválido ou ausente
 */
router.get("/userAuth", auth, ctrl.userAuth);

module.exports = router;
