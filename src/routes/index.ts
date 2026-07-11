import {  Router} from 'express';
import pagesRouter from './pages';
import routes from './users'

const router= Router(); // usamos el servicio de rutas de express

router.use(pagesRouter);

router.use('/user',routes)

export default router;