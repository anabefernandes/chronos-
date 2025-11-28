const router = require('express').Router();
const ctrl = require('../controllers/mlController');
const path = require('path');

/**
 * @swagger
 * tags:
 *   name: ML
 *   description: Rotas para predição de prioridade de pacientes
 */

/**
 * @swagger
 * /ml/predict:
 *   post:
 *     summary: Predizer prioridade de um paciente
 *     tags: [ML]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idade
 *               - temperatura
 *               - saturacao
 *               - queixa
 *             properties:
 *               idade:
 *                 type: number
 *                 example: 25
 *               temperatura:
 *                 type: number
 *                 example: 37.5
 *               saturacao:
 *                 type: number
 *                 example: 98
 *               queixa:
 *                 type: string
 *                 example: "dor de cabeça"
 *     responses:
 *       200:
 *         description: Predição realizada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 prioridade:
 *                   type: string
 *                   example: "MÉDIA"
 *       400:
 *         description: Campos obrigatórios ausentes
 */
router.post('/predict', ctrl.predictPrioridade);

/**
 * @swagger
 * /ml/todasPredicoes:
 *   get:
 *     summary: Listar todas as predições de pacientes (apenas para teste)
 *     tags: [ML]
 *     responses:
 *       200:
 *         description: Lista de todas as predições
 */
router.get('/todasPredicoes', ctrl.todasPredicoes);

module.exports = router;
