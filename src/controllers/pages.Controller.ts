import { Request, Response } from 'express';
import { User } from '../database/mongo/models/user.model';
import bcrypt from 'bcrypt';
import { generateToken } from '../utils/jwt';
import { AuthRequest } from '../types/auth-request';
import { Juego } from '../database/mongo/models/juego.model';
import { Grupo } from '../database/mongo/models/grupo.model';
import { Idioma, ModoDeJuego, Plataforma } from '../types/user.types';
import { crearUsuarioEnDgraph } from '../database/dgraph/queries/user.queries';
import { enviarCorreoConfirmacion } from '../services/email.service';
import { generarTokenConfirmacion } from '../utils/jwt';

export function mostrarIndex(req: Request, res: Response) {
    res.render('index'); // res.locals.estaLogueado ya está disponible en la vista sin pasarlo aquí
}

export function mostrarLogin(req: Request, res: Response) {
    res.render('login'); // solo mostramos el formulario, sin datos extra
}

export function logout(req: Request, res: Response) {
    res.clearCookie('token');
    res.redirect('/');
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
            maxAge: 60 * 60 * 1000, // 1 hora, mismo tiempo que el expiresIn del JWT
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
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.render('register', { error: 'Todos los campos son requeridos' });
        }

        if (password.length < 8) {
            return res.render('register', { error: 'La contraseña debe tener al menos 8 caracteres' });
        }

        const usuarioExistente = await User.findOne({ correo: email });
        if (usuarioExistente) {
            return res.render('register', { error: 'Este correo ya está siendo utilizado' });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const newUser = new User({
            nombre: name,
            correo: email,
            contrasena_hash: passwordHash
        });

        const doc = await newUser.save();
        console.log('Usuario creado: ' + doc._id);

        // NUEVO: correo de confirmación (mismo patrón que registerUser)
        const tokenConfirmacion = generarTokenConfirmacion(doc._id.toString());
        const urlConfirmacion = `http://localhost:3000/confirmar-correo/${tokenConfirmacion}`;
        try {
            await enviarCorreoConfirmacion(doc.correo, doc.nombre, urlConfirmacion);
        } catch (err) {
            console.error(`Usuario ${doc._id} creado pero FALLÓ el envío de correo de confirmación:`, err);
        }

        // sincronizar con Dgraph 
        try {
            await crearUsuarioEnDgraph(doc._id.toString(), doc.nombre);
        } catch (err) {
            console.error(`Usuario ${doc._id} creado pero FALLÓ la sincronización con Dgraph:`, err);
        }

        // e confirmar el correo primero
        return res.render('login', {
            mensaje: 'Cuenta creada. Revisa tu correo para confirmarla antes de iniciar sesión.'
        });

    } catch (err) {
        console.log(err);
        return res.render('register', { error: 'Error del servidor' });
    }
}

export async function mostrarPerfil(req: AuthRequest, res: Response) {
    try {
        if (typeof req.user === 'string' || !req.user) {
            return res.redirect('/login');
        }

        const usuario = await User.findById(req.user._id).select('-contrasena_hash').lean();
        const token = req.cookies.token;

        const zonasHorarias = ['GMT-8', 'GMT-7', 'GMT-6', 'GMT-5', 'GMT-4', 'GMT-3'];
        const horariosJuego = ['mañana', 'tarde', 'noche'];
        const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

        res.render('perfil', {
            usuario,
            token,
            idiomas: Object.values(Idioma),
            modosJuego: Object.values(ModoDeJuego),
            plataformas: Object.values(Plataforma),
            zonasHorarias,
            horariosJuego,
            diasSemana
        });

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

export async function mostrarDetalleJuego(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const juego = await Juego.findById(id).lean();

        if (!juego || !juego.activo) {
            return res.render('juego-detalle', { error: 'No se encontro el juego' });
        }

        res.render('juego-detalle', { juego });
    } catch (err) {
        console.log(err);
        res.render('juego-detalle', { error: 'No se encontro el juego' });
    }
}

interface FiltroGrupo {
    activo: boolean;
    integrantes?: string;
}

export async function mostrarGrupos(req: Request, res: Response) {
    try {
        const soloMios = req.query.misGrupos === 'true';
        const usuario = res.locals.usuario;

        const filtro: FiltroGrupo = { activo: true };

        if (soloMios && usuario) {
            filtro.integrantes = usuario._id.toString();
        }

        const grupos = await Grupo.find(filtro).lean();
        res.render('grupos', { grupos, soloMios });
    } catch (err) {
        console.log(err);
        res.render('grupos', { grupos: [], error: 'No se pudieron cargar los grupos' });
    }
}
export async function mostrarDetalleGrupo(req: Request, res: Response) {
    try {
        const { id } = req.params;
        const grupo = await Grupo.findById(id).lean();

        if (!grupo || !grupo.activo) {
            return res.render('grupo-detalle', { error: 'No se encontro el grupo' });
        }

        const token = req.cookies.token; // el servidor puede leer la cookie httpOnly

        res.render('grupo-detalle', { grupo, token });
    } catch (err) {
        console.log(err);
        res.render('grupo-detalle', { error: 'No se encontro el grupo' });
    }
}
