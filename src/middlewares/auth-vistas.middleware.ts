import { Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import {User} from '../database/mongo/models/user.model';
import { AuthRequest } from '../types/auth-request';

export async function authMiddlewareVistas(req: AuthRequest, res: Response, next: NextFunction) {
    const token = req.cookies.token;

    if (!token) {
        return res.redirect('/login'); // en vez de 401 JSON, redirige a login
    }

    try {
        const decoded = verifyToken(token);

        if (typeof decoded === 'string') {
            return res.redirect('/login');
        }

        const usuario = await User.findById(decoded._id);

        if (!usuario || !usuario.isActive) {
            return res.redirect('/login');
        }

        req.user = decoded;
        next();
    } catch (err) {
        return res.redirect('/login');
    }
}