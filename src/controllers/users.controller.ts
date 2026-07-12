import { Request, Response } from "express";
import { User } from "../database/mongo/models/user.model";
import { HttpStatus } from "../types/https-status";
import bcrypt from "bcrypt"
import { generateToken } from "../utils/jwt";
import { AuthRequest } from "../types/auth-request";
import { IUser } from "../types/user.types";


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


export async function actualizarUsuario(req: AuthRequest, res: Response) {
    try {
        if (typeof req.user === 'string' || !req.user) {
            return res.status(HttpStatus.UNAUTHORIZED).json({ message: 'No autenticado' });
        }
        const { rol, password, ...resto } = req.body;
        //Sacar el rol y password del objeto de actializacion para hacer validaciones
        //Todo lo demas se agrupa dentro de resto como un objeto

        if (rol !== undefined) { 
            return res.status(HttpStatus.BAD_REQUEST).json({ message: "No se puede modificar el rol" });
        }

        const userUpdate: Partial<IUser> = { ...resto };  
        //Se utiliza spread para expandir la variable resto denro del objeto de UserUpdate

        if (password !== undefined) {
            userUpdate.contrasena_hash = await bcrypt.hash(password, 10);
        }

        const usuarioActualizado = await User.findByIdAndUpdate(req.user._id, userUpdate, { new: true }).select('-contrasena_hash');
        //.select('-contrasena_hash') Es para decirle a moongose que traiga todo el documento
        //sin contar ese campo y evitar filtrar la contrasena
        
        if (!usuarioActualizado) {
            return res.status(HttpStatus.NOT_FOUND).json({ message: 'Usuario no encontrado' });
        }

        return res.json(usuarioActualizado);
    } catch (err) {
        console.log(err);
        if ((err as Error).name === 'CastError') {
            return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Id Invalido' });
        }
        return res.status(HttpStatus.SERVER_ERROR).json({ message: "Error del servidor" });
    }
}


export async function eliminarUsuario(req: AuthRequest, res: Response) {
    try {
        if (typeof req.user === 'string' || !req.user) {
            return res.status(HttpStatus.UNAUTHORIZED).json({ message: 'No autenticado' });
        }

        const usuarioEliminado = await User.findById(req.user._id);
        
        if (!usuarioEliminado) {
            return res.status(HttpStatus.NOT_FOUND).json({ message: 'Usuario no encontrado' });
        }

        //agregar sufijo de eliminacion
        usuarioEliminado.correo += `_eliminado_${Date.now()}`;
        usuarioEliminado.isActive = false;
        await usuarioEliminado.save();

        return res.json({ message: 'Usuario eliminado exitosamente' });


    } catch (err) {
        console.log(err);
        return res.status(HttpStatus.SERVER_ERROR).json({ message: "Error del servidor" });
    }
}

export async function listarUsuarios(req: Request, res: Response) {
    try {
        const pagina = Number(req.query.pagina) || 1;
        const limite = Number(req.query.limite) || 10;
        const skip = (pagina - 1) * limite;

        const usuariosActivos =  req.query.incluirInactivos  === 'true' ? {} : { isActive: true };
       
        const usuarios = await User.find(usuariosActivos).select('-contrasena_hash').skip(skip).limit(limite);
        const total = await User.countDocuments(usuariosActivos);

        res.json({
            data: usuarios,
            pagina,
            totalPaginas: Math.ceil(total / limite),
            total
        });
    }catch(err){
        console.log(err);
        res.status(HttpStatus.SERVER_ERROR).json({
            message: "Error del servidor"
        })
    }
}