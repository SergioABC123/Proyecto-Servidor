import express from 'express';
import {
    mostrarIndex,
    mostrarLogin,
    mostrarRegister,
    mostrarPerfil,
    mostrarJuegos,
    mostrarDetalleJuego,
    mostrarDetalleGrupo,
    mostrarGrupos,
    logout,
} from '../controllers/pages.Controller';
import { authMiddlewareVistas, authOpcionalVistas } from '../middlewares/auth-vistas.middleware';

const router = express.Router();

router.get('/', authOpcionalVistas, mostrarIndex);
router.get('/login', mostrarLogin);
router.get('/register', mostrarRegister);
router.get('/perfil', authMiddlewareVistas, mostrarPerfil);
router.get('/juegos', mostrarJuegos);
router.get('/juegos/:id', mostrarDetalleJuego);
router.get('/grupos', mostrarGrupos);
router.get('/grupos/:id', mostrarDetalleGrupo);
router.get('/logout', logout);

export default router;
