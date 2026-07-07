import { json, Router, Request, Response } from 'express';
import pagesRouter from './pages';

const router= Router(); // usamos el servicio de rutas de express

router.use(pagesRouter);

export default router;