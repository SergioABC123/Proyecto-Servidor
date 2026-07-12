import {  Router} from 'express';
import pagesRouter from './pages';
import userRoutes from './users'
import juegosRoutes from './juego';

const router= Router(); // usamos el servicio de rutas de express

router.use(pagesRouter);

router.use('/user',userRoutes);

router.use('/juegos',juegosRoutes);

export default router;