import { Router } from 'express';
import { listarMisMatches } from '../controllers/match.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.get('/mis-matches', authMiddleware, listarMisMatches);

export default router;