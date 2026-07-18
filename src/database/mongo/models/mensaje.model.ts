import { Schema, model } from 'mongoose';
import { IMensaje } from '../../../types/mensaje.types';

const mensajeSchema = new Schema<IMensaje>({
    grupo_id: { type: Schema.Types.ObjectId, ref: 'Grupo', required: true },
    usuario_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    contenido: { type: String, required: true },
    fecha: { type: Date, default: Date.now, required: true },
});

export const Mensaje = model<IMensaje>('Mensaje', mensajeSchema);
