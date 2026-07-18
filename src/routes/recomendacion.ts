import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { obtenerRecomendaciones } from '../controllers/recomendacion.controller';

const router = Router();

router.get('/', authMiddleware, obtenerRecomendaciones);

export default router;
