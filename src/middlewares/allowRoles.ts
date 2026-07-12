// aca iran los middlewares de los roles

import { Request, Response, NextFunction } from 'express';
import { HttpStatus } from '../types/https-status';
import  {AuthRequest} from '../types/auth-request'
import { Roles } from '../types/user.types';

export function requireAdmin (req: AuthRequest, res: Response, next: NextFunction){
    const userAdmin = req.user;
    if (typeof userAdmin === 'string' || !userAdmin) {
        return res.status(HttpStatus.UNAUTHORIZED).json({ message: 'No autenticado' });
    }
    if (userAdmin.rol != Roles.ADMIN){
        return res.status(HttpStatus.FORBIDDEN).json({ message: 'No Cuentas con los permisos necesarios' });
    }
    next();
}