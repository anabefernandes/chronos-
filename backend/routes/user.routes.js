const router = require('express').Router();
const ctrl = require('../controllers/userController');
const { auth, requireRole } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const { atualizarMeusDados } = require('../controllers/userController');

/**
 * @swagger
 * tags:
 *   name: User (ADMIN)
 *   description: Gerenciamento de usuários
 */

/**
 * @swagger
 * /user/criarUsuario:
 *   post:
 *     summary: Criar usuário (funcionário ou chefe) – apenas admin
 *     tags: [User (ADMIN)]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nome
 *               - email
 *               - senha
 *               - role
 *             properties:
 *               nome:
 *                 type: string
 *                 example: Ana Beatriz
 *               email:
 *                 type: string
 *                 example: ana@email.com
 *               senha:
 *                 type: string
 *                 example: "123456"
 *               role:
 *                 type: string
 *                 enum: [funcionario, chefe]
 *                 example: funcionario
 *     responses:
 *       201:
 *         description: Usuário criado com sucesso
 *       400:
 *         description: Campos obrigatórios ausentes ou email já cadastrado
 *       403:
 *         description: Permissão negada
 */
router.post('/criarUsuario', auth, requireRole('admin', 'chefe'), ctrl.criarUsuario);

/**
 * @swagger
 * /user/listarFuncionarios:
 *   get:
 *     summary: Listar todos os funcionários – apenas admin
 *     tags: [User (ADMIN)]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de funcionários
 *       403:
 *         description: Permissão negada
 */
router.get('/listarFuncionarios', auth, requireRole('admin', 'chefe'), ctrl.listarFuncionarios);

/**
 * @swagger
 * /user/listarChefe:
 *   get:
 *     summary: Listar todas as chefe – apenas admin
 *     tags: [User (ADMIN)]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de chefe
 *       403:
 *         description: Permissão negada
 */
router.get('/listarChefe', auth, requireRole('admin', 'chefe'), ctrl.listarChefe);

/**
 * @swagger
 * /user/atualizarUsuario/{id}:
 *   put:
 *     summary: Atualizar usuário – apenas admin
 *     tags: [User (ADMIN)]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do usuário a ser atualizado
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *                 example: Ana Beatriz
 *               email:
 *                 type: string
 *                 example: ana@email.com
 *               senha:
 *                 type: string
 *                 example: "novaSenha123"
 *               role:
 *                 type: string
 *                 enum: [funcionario, chefe]
 *                 example: funcionario
 *     responses:
 *       200:
 *         description: Usuário atualizado com sucesso
 *       404:
 *         description: Usuário não encontrado
 *       403:
 *         description: Permissão negada
 */
router.put('/atualizarUsuario/:id', auth, requireRole('admin', 'chefe'), ctrl.atualizarUsuario);

// Atualizar dados do próprio usuário logado
router.put('/atualizarMeusDados', auth, ctrl.atualizarMeusDados);

// Atualizar apenas foto do usuário
router.put('/atualizarMinhaFoto', auth, upload.single('foto'), ctrl.atualizarMinhaFotoUsuario);

/**
 * @swagger
 * /user/excluirUsuario/{id}:
 *   delete:
 *     summary: Excluir usuário – apenas admin
 *     tags: [User (ADMIN)]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do usuário a ser excluído
 *     responses:
 *       200:
 *         description: Usuário excluído com sucesso
 *       404:
 *         description: Usuário não encontrado
 *       403:
 *         description: Permissão negada
 */
router.delete('/excluirUsuario/:id', auth, requireRole('admin', 'chefe'), ctrl.excluirUsuario);

module.exports = router;
