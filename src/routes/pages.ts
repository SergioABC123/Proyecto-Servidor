import express from 'express';
import { mostrarIndex, mostrarLogin, procesarLogin, mostrarRegister, procesarRegister, mostrarPerfil, mostrarJuegos } from '../controllers/pages.Controller';
import { authMiddlewareVistas } from '../middlewares/auth-vistas.middleware';

const router = express.Router();

router.get('/', mostrarIndex);
router.get('/login', mostrarLogin);
router.post('/login', procesarLogin);
router.get('/register', mostrarRegister);
router.post('/register', procesarRegister);
router.get('/perfil', authMiddlewareVistas, mostrarPerfil);
router.get('/juegos', mostrarJuegos);

export default router;