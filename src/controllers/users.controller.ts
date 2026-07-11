import { Request, Response } from "express";
import { User } from "../database/mongo/models/user.model";
import { HttpStatus } from "../types/https-status";
import bcrypt from "bcrypt"
import { generateToken } from "../utils/jwt";
import { AuthRequest } from "../types/auth-request";


export async function registerUser(req: Request, res: Response) {
    try{
        const {name,email,password} = req.body;

        if( name== undefined || email== undefined || password == undefined ){
            return res.status(HttpStatus.BAD_REQUEST).json({
                "message":'Campos requeridos faltantes'
            });
        }else{
            const usuarioExistente = await User.findOne({correo: email});
            if (usuarioExistente){
                return res.status(HttpStatus.BAD_REQUEST).json({
                    message: "Este correo ya esta siendo utilizado"
                });
            }
            const passwordHash = await bcrypt.hash(password,10);

            const newUser = new User({
                nombre: name,
                correo: email,
                contrasena_hash: passwordHash
            })

            const doc = await newUser.save();
            console.log("Usuario creado: " + doc._id);

            res.status(HttpStatus.CREATED).json({
                message: "Usuario creado exitosamente",
                user: {
                    _id: doc._id,
                    nombre: doc.nombre,
                    correo: doc.correo,
                    rol: doc.rol
                }
            })
        }
    }catch (err){
        console.log(err);
        res.status(HttpStatus.SERVER_ERROR).json({
            message: "Error del servidor"
        })
    }

}


export async function loginUser(req: Request, res: Response) {
    const {email, password} = req.body;
    try{
        const user = await User.findOne({ correo: email });
    
        if (!user) {
        return res.status(HttpStatus.UNAUTHORIZED).json({ message: 'Credenciales inválidas' });
        }
        
        // Comparar la password ingresada con el hash guardado
        const passwordCorrecta = await bcrypt.compare(password, user.contrasena_hash);
        
        if (!passwordCorrecta) {
        return res.status(HttpStatus.UNAUTHORIZED).json({ message: 'Credenciales inválidas' });
        }
        
        // Generar token
        const token = generateToken({
        _id: user._id,
        correo: user.correo,
        rol: user.rol
        });

        return res.json({"token": token});
    }catch (err){
        console.log(err);
        res.status(HttpStatus.SERVER_ERROR).json({message: 'Server error'});
    }

}


export function getMe(req: AuthRequest, res: Response) {
    if (typeof req.user === 'string' || !req.user) {
        return res.status(HttpStatus.UNAUTHORIZED).json({ message: 'No autenticado' });
    }

    res.json({
        message: "Usuario autenticado",
        user: {
            id: req.user._id,
            correo: req.user.correo,
            rol: req.user.rol
        }
    });
}