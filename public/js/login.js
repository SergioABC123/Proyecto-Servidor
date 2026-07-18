const formLogin = document.getElementById('form-login');
const mensajeDiv = document.getElementById('mensaje-login');

formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    mensajeDiv.innerHTML = '';

    const email = formLogin.email.value;
    const password = formLogin.password.value;

    try {
        const response = await fetch('/user/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            mensajeDiv.innerHTML = `<div class="alert alert-danger">${data.message}</div>`;
            return;
        }

        // Guardamos el token en una cookie normal =
        document.cookie = `token=${data.token}; path=/; max-age=3600`;

        window.location.href = '/perfil';

    } catch (err) {
        mensajeDiv.innerHTML = `<div class="alert alert-danger">Error al iniciar sesión</div>`;
    }
});