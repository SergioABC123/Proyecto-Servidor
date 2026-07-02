import { json, Router, Request, Response } from 'express';

const router= Router(); // usamos el servicio de rutas de express

router.get('', (req: Request, res: Response) => {
    res.json({ message: 'raiz' });
});

router.get('/admin', (req: Request, res: Response) => { // Poder absoluto
    res.json({ message: 'Hola admin' });
});

router.get('/moderator', (req: Request, res: Response) => { // no puede cambiar cosas en el servidor
    res.json({ message: 'hola moderador' });
});

router.get('/groupLeader', (req: Request, res: Response) => { // usuario con permisos en comunidades especificas
    res.json({ message: 'hola lider de grupo' });
});

router.get('/user', (req: Request, res: Response) => { // usuario normal
    res.json({ message: 'hola usuario' });
});

export default router;