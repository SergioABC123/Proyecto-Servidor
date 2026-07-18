import { Request, Response } from 'express';
import { User } from '../database/mongo/models/user.model';
import { AuthRequest } from '../types/auth-request';
import { Juego } from '../database/mongo/models/juego.model';
import { Grupo } from '../database/mongo/models/grupo.model';
import { Idioma, ModoDeJuego, Plataforma } from '../types/user.types';


export function mostrarIndex(req: Request, res: Response) {
    res.render('index'); // res.locals.estaLogueado ya está disponible en la vista sin pasarlo aquí
}

export function mostrarLogin(req: Request, res: Response) {
    const mensaje = req.query.registrado === 'true'
        ? 'Cuenta creada. Revisa tu correo para confirmarla antes de iniciar sesión.'
        : undefined;
    res.render('login', { mensaje });
}

export function mostrarRegister(req: Request, res: Response) {
    res.render('register'); // solo mostramos el formulario
}


export function logout(req: Request, res: Response) {
    res.clearCookie('token');
    res.redirect('/');
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
