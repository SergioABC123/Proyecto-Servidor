// rutas de los usuarios
import { Router } from "express";
import { previsualizarJuego, crearJuego, listarJuegos, obtenerJuego, actualizarJuego, eliminarJuego} from "../controllers/juego.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { requireAdmin } from "../middlewares/allowRoles";

const router = Router();

router.get('/',listarJuegos)

router.get('/buscar',previsualizarJuego);
router.get('/:id',obtenerJuego);

router.post('/crearJuego',authMiddleware,requireAdmin,crearJuego);

router.patch('/:id',authMiddleware,requireAdmin,actualizarJuego);

router.delete('/:id',authMiddleware,requireAdmin,eliminarJuego);

export default router;