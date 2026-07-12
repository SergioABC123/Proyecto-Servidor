import { Response } from "express";
import { AuthRequest } from "../types/auth-request";
import { HttpStatus } from "../types/https-status";
import { Grupo } from "../database/mongo/models/grupo.model";

export async function crearGrupo(req: AuthRequest, res: Response) {
    try {
        if (typeof req.user === 'string' || !req.user) {
            return res.status(HttpStatus.UNAUTHORIZED).json({ message: 'No autenticado' });
        }

        const { nombre, descripcion } = req.body;

        if (nombre === undefined) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                message: 'El nombre del grupo es requerido'
            });
        }

        const nuevoGrupo = new Grupo({
            nombre,
            descripcion,
            lider_id: req.user._id,
            integrantes: [req.user._id]
        });

        const doc = await nuevoGrupo.save();
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