import { Request, Response } from 'express';
import {User} from '../database/mongo/models/user.model';
import bcrypt from 'bcrypt';
import { generateToken } from '../utils/jwt';
import { AuthRequest } from '../types/auth-request';
import { Juego } from '../database/mongo/models/juego.model';

export function mostrarIndex(req: Request, res: Response) {
    res.render('index');
}

export function mostrarLogin(req: Request, res: Response) {
    res.render('login'); // solo mostramos el formulario, sin datos extra
}

export async function procesarLogin(req: Request, res: Response) {
    try {
        const { email, password } = req.body; // datos que mando el formulario (urlencoded)

        const user = await User.findOne({ correo: email }); // buscamos si existe el correo
        if (!user) {
            // si no existe, volvemos a mostrar el login con un mensaje de error
            return res.render('login', { error: 'Credenciales inválidas' });
        }

        const passwordCorrecta = await bcrypt.compare(password, user.contrasena_hash); // comparamos con el hash guardado
        if (!passwordCorrecta) {
            return res.render('login', { error: 'Credenciales inválidas' });
        }

        // generamos el token igual que en el login normal de la API
        const token = generateToken({ _id: user._id, correo: user.correo, rol: user.rol });

        // a diferencia de la API (que regresa el token en JSON), aqui lo guardamos en una cookie
        res.cookie('token', token, {
            httpOnly: true, // el JS del navegador no puede leer esta cookie, solo el navegador la manda sola
            maxAge: 60 * 60 * 1000 // 1 hora, mismo tiempo que el expiresIn del JWT
        });

        return res.redirect('/perfil'); // ya logueado, lo mandamos a completar/ver su perfil

    } catch (err) {
        console.log(err);
        return res.render('login', { error: 'Error del servidor' });
    }
}

export function mostrarRegister(req: Request, res: Response) {
    res.render('register'); // solo mostramos el formulario
}

export async function procesarRegister(req: Request, res: Response) {
    try {
        const { name, email, password } = req.body; // datos del formulario

        if (!name || !email || !password) {
            return res.render('register', { error: 'Todos los campos son requeridos' });
        }

        if (password.length < 8) {
            // misma validacion que validatePassword.middleware.ts, pero aqui a mano
            // porque este formulario no pasa por ese middleware
            return res.render('register', { error: 'La contraseña debe tener al menos 8 caracteres' });
        }

        const usuarioExistente = await User.findOne({ correo: email }); // evitamos correos duplicados
        if (usuarioExistente) {
            return res.render('register', { error: 'Este correo ya está siendo utilizado' });
        }

        const passwordHash = await bcrypt.hash(password, 10); // hasheamos antes de guardar

        const newUser = new User({
            nombre: name,
            correo: email,
            contrasena_hash: passwordHash
            // rol e isActive quedan con su default (usuario / true)
        });

        const doc = await newUser.save();

        // auto-login: generamos el token de una vez, sin pedirle que inicie sesion aparte
        const token = generateToken({ _id: doc._id, correo: doc.correo, rol: doc.rol });

        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 60 * 60 * 1000
        });

        return res.redirect('/perfil'); // directo a perfil, ya logueado

    } catch (err) {
        console.log(err);
        return res.render('register', { error: 'Error del servidor' });
    }
}


export async function mostrarPerfil(req: AuthRequest, res: Response) {
    try {
        if (typeof req.user === 'string' || !req.user) {
            return res.redirect('/login'); // por si acaso, aunque el middleware ya lo cubrió
        }

        const usuario = await User.findById(req.user._id).select('-contrasena_hash').lean();
        //Convertimos el dcumento aun objeto plano antes de pasarlo a la vista

        res.render('perfil', { usuario });

    } catch (err) {
        console.log(err);
        return res.redirect('/login');
    }
}


export async function mostrarJuegos(req: Request, res: Response) {
    try {
        const juegos = await Juego.find({ activo: true }).lean();
        res.render('juegos', { juegos });
    } catch (err) {
        console.log(err);
        res.render('juegos', { juegos: [], error: 'No se pudieron cargar los juegos' });
    }
}