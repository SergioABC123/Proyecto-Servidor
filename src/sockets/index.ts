import { Server } from 'socket.io';
import { configurarChatSocket } from './chat.socket';
//import { configurarNotificacionesSocket } from './notifications.socket';

//Es archivo se encarga de conectar chat, notificaciones por separado

export function configurarSockets(io: Server) {
    configurarChatSocket(io);
    // configurarNotificacionesSocket(io);
}
