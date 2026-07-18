import { Request, Response } from 'express';
import { User } from '../database/mongo/models/user.model';
import { HttpStatus } from '../types/https-status';
import bcrypt from 'bcrypt';
import { generateToken, verificarTokenConfirmacion } from '../utils/jwt';
import { AuthRequest } from '../types/auth-request';
import { IUser } from '../types/user.types';
import { crearUsuarioEnDgraph, actualizarUsuarioEnDgraph } from '../database/dgraph/queries/user.queries'; // para ponerlo en dgraph
import { sincronizarIdiomasUsuario } from '../database/dgraph/queries/idioma.queries'; // para ponerlo en dgraph
import { sincronizarPlataformasUsuario } from '../database/dgraph/queries/plataforma.queries'; // para ponerlo en dgraph
import { enviarCorreoConfirmacion } from '../services/email.service';
import { generarTokenConfirmacion } from '../utils/jwt';
import { subirImagenACloudinary } from '../services/cloudinary.service';



export async function registerUser(req: Request, res: Response) {
    try {
        const { name, email, password } = req.body;

        if (name == undefined || email == undefined || password == undefined) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Campos requeridos faltantes',
            });
        } else {
            const usuarioExistente = await User.findOne({ correo: email });
            if (usuarioExistente) {
                return res.status(HttpStatus.BAD_REQUEST).json({
                    message: 'Este correo ya esta siendo utilizado',
                });
            }
            const passwordHash = await bcrypt.hash(password, 10);

            const newUser = new User({
                nombre: name,
                correo: email,
                contrasena_hash: passwordHash,
            });

            const doc = await newUser.save();
            console.log('Usuario creado: ' + doc._id);

            const tokenConfirmacion = generarTokenConfirmacion(doc._id.toString());
            const urlConfirmacion = `http://localhost:3000/confirmar-correo/${tokenConfirmacion}`;
            try {
                await enviarCorreoConfirmacion(doc.correo, doc.nombre, urlConfirmacion);
            } catch (err) {
                console.error(`Usuario ${doc._id} creado en Mongo pero FALLÓ el envío de correo de confirmación:`, err);
            }

            // Sincronizar con Dgraph (no bloquea el registro si falla) --------------------------------------------------
            try {
                 console.log('INICIANDO SINCRONIZACION DGRAPH')
                await crearUsuarioEnDgraph(doc._id.toString(), doc.nombre);
            } catch (err) {
                console.error(`Usuario ${doc._id} creado en Mongo pero FALLÓ la sincronización con Dgraph:`, err);
            }
            // -----------------------------------------------------------------------------------------------------------

            res.status(HttpStatus.CREATED).json({
                message: 'Usuario creado exitosamente',
                user: {
                    _id: doc._id,
                    nombre: doc.nombre,
                    correo: doc.correo,
                    rol: doc.rol,
                },
            });
        }
    } catch (err) {
        console.log(err);
        res.status(HttpStatus.SERVER_ERROR).json({
            message: 'Error del servidor',
        });
    }
}

export async function loginUser(req: Request, res: Response) {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ correo: email });

        if (!user) {
            return res.status(HttpStatus.UNAUTHORIZED).json({ message: 'Credenciales inválidas' });
        }

        // Comparar la password ingresada con el hash guardado
        const passwordCorrecta = await bcrypt.compare(password, user.contrasena_hash);

        if (!passwordCorrecta) {
            return res.status(HttpStatus.UNAUTHORIZED).json({ message: 'Credenciales inválidas' });
        }

        if (!user.correo_confirmado) {
            return res.status(HttpStatus.UNAUTHORIZED).json({ message: 'Debes confirmar tu correo antes de iniciar sesión' });
        }

        // Generar token
        const token = generateToken({
            _id: user._id,
            correo: user.correo,
            rol: user.rol,
        });

        return res.json({ token: token });
    } catch (err) {
        console.log(err);
        res.status(HttpStatus.SERVER_ERROR).json({ message: 'Server error' });
    }
}

export function getMe(req: AuthRequest, res: Response) {
    if (typeof req.user === 'string' || !req.user) {
        return res.status(HttpStatus.UNAUTHORIZED).json({ message: 'No autenticado' });
    }

    res.json({
        message: 'Usuario autenticado',
        user: {
            id: req.user._id,
            correo: req.user.correo,
            rol: req.user.rol,
        },
    });
}




export async function actualizarUsuario(req: AuthRequest, res: Response) {
    try {
        if (typeof req.user === 'string' || !req.user) {
            return res.status(HttpStatus.UNAUTHORIZED).json({ message: 'No autenticado' });
        }
        const { rol, password, correo_confirmado, plataformas, ...resto } = req.body;
        //Sacar el rol y password del objeto de actializacion para hacer validaciones
        //Todo lo demas se agrupa dentro de resto como un objeto

        if (rol !== undefined) {
            return res.status(HttpStatus.BAD_REQUEST).json({ message: 'No se puede modificar el rol' });
        }
        if (correo_confirmado !== undefined) {
            return res.status(HttpStatus.BAD_REQUEST).json({ message: 'No se puede modificar correo_confirmado desde aquí' });
        }

        const userUpdate: Partial<IUser> = { ...resto };
        //Se utiliza spread para expandir la variable resto denro del objeto de UserUpdate

        if (password !== undefined) {
            userUpdate.contrasena_hash = await bcrypt.hash(password, 10);
        }

        // NUEVO: plataformas llega como string JSON desde el formulario (multipart/form-data
        // no soporta estructuras anidadas como {nombre, gamertag} directamente)
        if (plataformas !== undefined) {
            try {
                userUpdate.plataformas = JSON.parse(plataformas);
            } catch {
                return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Formato de plataformas inválido' });
            }
        }

        // NUEVO: si viene un archivo (gracias a upload.single('foto_perfil') en la ruta),
        // lo subimos a Cloudinary y guardamos la URL resultante
        if (req.file) {
            userUpdate.foto_perfil = await subirImagenACloudinary(req.file.buffer);
        }

        const usuarioActualizado = await User.findByIdAndUpdate(req.user._id, userUpdate, { new: true }).select(
            '-contrasena_hash',
        );
        //.select('-contrasena_hash') Es para decirle a moongose que traiga todo el documento
        //sin contar ese campo y evitar filtrar la contrasena

        if (!usuarioActualizado) {
            return res.status(HttpStatus.NOT_FOUND).json({ message: 'Usuario no encontrado' });
        }

        const mongoId = req.user._id.toString(); // para funciones de abajo

        // Actualizar usuario en dgraph ---------------------------------------------------------------------------------------------
        try {
            const camposDgraph: any = {}; // creamos un objeto vacio
            if (userUpdate.nombre !== undefined) camposDgraph.nombre = userUpdate.nombre;
            if (userUpdate.edad !== undefined) camposDgraph.edad = userUpdate.edad;
            if (userUpdate.sexo !== undefined) camposDgraph.genero = userUpdate.sexo;
            if (userUpdate.rol !== undefined) camposDgraph.rol = userUpdate.rol;

            if (Object.keys(camposDgraph).length > 0) {
                await actualizarUsuarioEnDgraph(mongoId, camposDgraph);
            }
        } catch (err) {
            console.error(`Usuario ${req.user._id} actualizado en Mongo pero FALLÓ la sincronización con Dgraph:`, err);
        }
        // --------------------------------------------------------------------------------------------------------------------------

        // Sincronizar idiomas en dgraph ---------------------------------------------------------------------------------------------
        if (userUpdate.idiomas !== undefined) {
            try {
                await sincronizarIdiomasUsuario(mongoId, userUpdate.idiomas);
            } catch (err) {
                console.error(
                    `Usuario ${mongoId} actualizado en Mongo pero FALLÓ la sincronización de idiomas con Dgraph:`,
                    err,
                );
            }
        }
        // ---------------------------------------------------------------------------------------------------------------------------

        // Sincronizar plataformas en dgraph ----------------------------------------------------------------------------------------------
        if (userUpdate.plataformas !== undefined) {
            try {
                const nombresPlataformas = userUpdate.plataformas.map((p) => p.nombre);
                await sincronizarPlataformasUsuario(mongoId, nombresPlataformas);
            } catch (err) {
                console.error(
                    `Usuario ${mongoId} actualizado en Mongo pero FALLÓ la sincronización de plataformas con Dgraph:`,
                    err,
                );
            }
        }
        // --------------------------------------------------------------------------------------------------------------------------------

        return res.json(usuarioActualizado);
    } catch (err) {
        console.log(err);
        if ((err as Error).name === 'CastError') {
            return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Id Invalido' });
        }
        return res.status(HttpStatus.SERVER_ERROR).json({ message: 'Error del servidor' });
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
        return res.status(HttpStatus.SERVER_ERROR).json({ message: 'Error del servidor' });
    }
}

export async function listarUsuarios(req: Request, res: Response) {
    try {
        const pagina = Number(req.query.pagina) || 1;
        const limite = Number(req.query.limite) || 10;
        const skip = (pagina - 1) * limite;

        const usuariosActivos = req.query.incluirInactivos === 'true' ? {} : { isActive: true };

        const usuarios = await User.find(usuariosActivos).select('-contrasena_hash').skip(skip).limit(limite);
        const total = await User.countDocuments(usuariosActivos);

        res.json({
            data: usuarios,
            pagina,
            totalPaginas: Math.ceil(total / limite),
            total,
        });
    } catch (err) {
        console.log(err);
        res.status(HttpStatus.SERVER_ERROR).json({
            message: 'Error del servidor',
        });
    }
}



export async function confirmarCuenta(req: Request, res: Response) {
    try {
        const { token } = req.params;
        if (typeof token !== 'string') {
            return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Token inválido' });
        }
        const { id } = verificarTokenConfirmacion(token);

        const usuario = await User.findById(id);
        if (!usuario) {
            return res.status(HttpStatus.NOT_FOUND).json({ message: 'Usuario no encontrado' });
        }

        usuario.correo_confirmado = true;
        await usuario.save();

        return res.json({ message: 'Cuenta confirmada exitosamente' });

    } catch (err) {
        console.log(err);
        return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Token de confirmación inválido o expirado' });
    }
}