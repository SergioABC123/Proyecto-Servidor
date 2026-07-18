import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { enviarSolicitud, listarSolicitudesRecibidas, responderSolicitud, listarSolicitudesEnviadas } from '../controllers/solicitud.controller';

const router = Router();


router.post('/', authMiddleware, enviarSolicitud);
router.get('/recibidas', authMiddleware, listarSolicitudesRecibidas);
router.get('/enviadas', authMiddleware, listarSolicitudesEnviadas);
router.patch('/:id/responder', authMiddleware, responderSolicitud);

export default router;