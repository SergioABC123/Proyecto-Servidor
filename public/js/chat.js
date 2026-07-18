// Leemos el id del grupo y el token desde el propio <script> tag
const scriptActual = document.currentScript;
const grupoId = scriptActual.dataset.grupoId;
const token = scriptActual.dataset.token;

// se conecta al servidor de sockets y se manda el token en el handshake
const socket = io({
    auth: { token: token }
});

const divMensajes = document.getElementById('mensajes');
const formMensaje = document.getElementById('form-mensaje');
const inputMensaje = document.getElementById('input-mensaje');

// cuando se establece la conexion pedimos unirnos a la sala del grupo
socket.on('connect', () => {
    socket.emit('unirse_grupo', grupoId);
});

// El servidor  manda el historial reciente
socket.on('historial', (mensajes) => {
    mensajes.forEach(mostrarMensaje);
});

// cada vez que llega un mensaje nuevo 
socket.on('mensaje_recibido', (mensaje) => {
    mostrarMensaje(mensaje);
});

// si el servidor rechaza algo
socket.on('error_chat', (mensajeError) => {
    alert(mensajeError);

    // Deshabilitamos el chat para que no quede una interfaz 
    formMensaje.style.display = 'none';
    divMensajes.innerHTML = `<p class="text-muted">${mensajeError}</p>`;
});

// Cuando el formulario se ennvia se manda el mensaje al servidor
formMensaje.addEventListener('submit', (e) => {
    e.preventDefault(); // eviar que la pagina se recargue

    const contenido = inputMensaje.value.trim();
    if (!contenido) return;

    socket.emit('mensaje_nuevo', { grupoId, contenido });
    inputMensaje.value = '';
});

function mostrarMensaje(mensaje) {
    const p = document.createElement('p');
    p.innerHTML = `<strong>${mensaje.nombreUsuario}:</strong> ${mensaje.contenido}`;
    divMensajes.appendChild(p);
    divMensajes.scrollTop = divMensajes.scrollHeight;
}