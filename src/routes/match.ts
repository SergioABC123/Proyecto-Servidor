import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { listarMisMatches } from '../controllers/match.controller';

const router = Router();

/**
 * @swagger
 * /match/mis-matches:
 *   get:
 *     tags: [Matches]
 *     summary: Listar mis matches confirmados
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de matches, con los datos del compañero de cada uno.
 */
router.get('/mis-matches', authMiddleware, listarMisMatches);

export default router;