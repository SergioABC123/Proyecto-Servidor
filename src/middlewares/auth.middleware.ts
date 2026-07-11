
import { Request, Response, NextFunction } from 'express';
import { HttpStatus } from '../types/https-status';
import { verifyToken } from '../utils/jwt';
import  {AuthRequest} from '../types/auth-request'

export function authMiddleware (req: AuthRequest, res: Response, next: NextFunction){
    const authHeader = req.headers.authorization;
    if (!authHeader){
        return res.status(HttpStatus.UNAUTHORIZED).json({message:'Proporciona credenciales validas'})
    }
    const partesHeader = authHeader.split(' ');
        if(partesHeader.length !== 2){
            return res.status(HttpStatus.UNAUTHORIZED).json({message:'formato incorrecto'})
        }else if(partesHeader[0] != "Bearer"){
            return res.status(HttpStatus.UNAUTHORIZED).json({message:'formato incorrecto'})
        }
    const token= partesHeader[1];
    try {
        const decoded = verifyToken(token);
        req.user = decoded;
        next();
    }catch (err){
        return res.status(HttpStatus.UNAUTHORIZED).json({message:'Error en el token'})
    }
}