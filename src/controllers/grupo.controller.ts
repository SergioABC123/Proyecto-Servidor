import { Request, Response } from "express";
import { AuthRequest } from "../types/auth-request";
import { HttpStatus } from "../types/https-status";
import { Grupo } from "../database/mongo/models/grupo.model";
import { IGrupo } from "../types/grupo.types";

export async function crearGrupo(req: AuthRequest, res: Response) {
    try {
        if (typeof req.user === 'string' || !req.user) { // verificamos que no sea string porque esperamos un objeto 
            return res.status(HttpStatus.UNAUTHORIZED).json({ message: 'No autenticado' });
        }

        const { nombre, descripcion } = req.body; // obtenemos los datos desde el cliente

        if (nombre === undefined) { 
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'El nombre del grupo es requerido'
            });
        }

        const nuevoGrupo = new Grupo({ // creamos el documento pero todavia no lo guardamos en mongo
            nombre,
            descripcion,
            lider_id: req.user._id, 
            integrantes: [req.user._id]
        });

        const doc = await nuevoGrupo.save(); // guardamos el documento en mongo
        console.log("Grupo creado: " + doc._id);

        res.status(HttpStatus.CREATED).json({
            message: "Grupo creado exitosamente",
            grupo: {
                _id: doc._id,
                nombre: doc.nombre,
                descripcion: doc.descripcion,
                fecha_creacion: doc.fecha_creacion,
                lider_id: doc.lider_id,
                integrantes: doc.integrantes
            }
        });

    } catch (err) {
        console.log(err);
        res.status(HttpStatus.SERVER_ERROR).json({
            message: "Error del servidor"
        });
    }
}

export async function listarGrupos(req: Request, res: Response) { // no necesitamos saber quien esta autenticado por eso solo request
    try {
        const pagina = Number(req.query.pagina) || 1; // datos del cliente, por defecto 1
        const limite = Number(req.query.limite) || 10; // datos del cliente, por defecto 10
        const skip = (pagina - 1) * limite; // datos del cliente, por defecto 0

        const filtro = req.query.incluirInactivos === 'true' ? {} : { activo: true }; // preguntamos si quiere que mostremos los inactivos o no
        // filtro= {} significa que no se filtre nada, si se la al else el filtro seria que este activo el grupo
         
        const grupos = await Grupo.find(filtro).skip(skip).limit(limite); // aplicamos lo que nos pidio el usuario
        const total = await Grupo.countDocuments(filtro); // contamos los documentos 

        res.json({
            data: grupos,
            pagina,
            totalPaginas: Math.ceil(total / limite),
            total
        });
    } catch (err) {
        console.log(err);
        res.status(HttpStatus.SERVER_ERROR).json({
            message: "Error del servidor"
        });
    }
}

export async function obtenerGrupo(req: Request, res: Response) {
    try {
        const { id } = req.params; // obtenemos el parametro de la URL
        const grupo = await Grupo.findById(id); // buscamos el grupo con el id que nos dieron

        if (!grupo || !grupo.activo) {
            return res.status(HttpStatus.NOT_FOUND).json({
                message: 'No se encontro el grupo'
            });
        }

        return res.json(grupo); // si existe lo devolvemos
    } catch (err) {
        console.log(err);
        if ((err as Error).name === 'CastError') {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'Id Invalido'
            });
        }
        return res.status(HttpStatus.SERVER_ERROR).json({
            message: "Error del servidor"
        });
    }
}

export async function actualizarGrupo(req: AuthRequest, res: Response) { // volvemos a requerir saber quien es para ver si tiene permisos
    try {
        if (typeof req.user === 'string' || !req.user) { 
            return res.status(HttpStatus.UNAUTHORIZED).json({ message: 'No autenticado' });
        }

        const { id } = req.params; // obtenemos el id que nos enviaron
        const { nombre, descripcion, lider_id, integrantes, activo } = req.body; // recibimos los datos que nos enviaron

        if (lider_id !== undefined || integrantes !== undefined || activo !== undefined) { // el cliente no puede modificar estas cosas
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: "No se puede modificar lider_id, integrantes o activo desde aquí"
            });
        }

        const grupo = await Grupo.findById(id); // buscamos el grupo
        if (!grupo || !grupo.activo) {
            return res.status(HttpStatus.NOT_FOUND).json({ message: 'No se encontro el grupo' });
        }

        if (grupo.lider_id.toString() !== req.user._id.toString()) { // verificamos que el usuario autenticado sea el lider del grupo
            return res.status(HttpStatus.UNAUTHORIZED).json({ message: 'Solo el lider puede editar el grupo' });
        }

        const grupoUpdate: Partial<IGrupo> = {}; // creamos el objeto de actializacion, con partial porque no le pasaremos todas las propiedades
        if (nombre !== undefined) grupoUpdate.nombre = nombre; // si recibimos nombre lo actualizamos
        if (descripcion !== undefined) grupoUpdate.descripcion = descripcion; // si recibimos descripcion la actualizamos

        const grupoActualizado = await Grupo.findByIdAndUpdate(id, grupoUpdate, { new: true }); // el new true es para devolver el doc actualziado
        return res.json(grupoActualizado);

    } catch (err) {
        console.log(err);
        if ((err as Error).name === 'CastError') {
            return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Id Invalido' });
        }
        return res.status(HttpStatus.SERVER_ERROR).json({ message: "Error del servidor" });
    }
}

export async function eliminarGrupo(req: AuthRequest, res: Response) {
    try {
        if (typeof req.user === 'string' || !req.user) {
            return res.status(HttpStatus.UNAUTHORIZED).json({ message: 'No autenticado' });
        }

        const { id } = req.params;
        const grupo = await Grupo.findById(id);

        if (!grupo) {
            return res.status(HttpStatus.NOT_FOUND).json({ message: 'No se encontro el grupo' });
        }

        if (grupo.lider_id.toString() !== req.user._id.toString()) {
            return res.status(HttpStatus.UNAUTHORIZED).json({ message: 'Solo el lider puede eliminar el grupo' });
        }

        if (!grupo.activo) {
            return res.status(HttpStatus.BAD_REQUEST).json({ message: 'El grupo ya estaba inactivo' });
        }

        grupo.activo = false; // lo ponemos como inactivo
        await grupo.save(); // guardamos el cambio

        return res.json({ message: "Grupo eliminado (marcado inactivo) correctamente" });

    } catch (err) {
        console.log(err);
        if ((err as Error).name === 'CastError') {
            return res.status(HttpStatus.BAD_REQUEST).json({ message: 'Id Invalido' });
        }
        return res.status(HttpStatus.SERVER_ERROR).json({ message: "Error del servidor" });
    }
}