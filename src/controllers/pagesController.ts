import { json, Router, Request, Response } from 'express';
import path from 'path';

function showLogin(req: Request, res: Response) {
    res.sendFile(path.join(__dirname, '..', '..', 'views', 'login.html')) // agregamos los .. para salir de controllers y entrar a views
}

export { showLogin };