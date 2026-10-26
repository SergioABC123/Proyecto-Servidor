import express from 'express';
import cors from 'cors';
import { engine } from 'express-handlebars';
import { handlebarsHelpers } from './config/handlebars-helpers';
import routes from './routes';
import path from 'path';
import cookieParser from 'cookie-parser';
import { inyectarUsuarioEnVistas } from './middlewares/auth-vistas.middleware';

let app: express.Express;

export function createApp() {
    app = express();

    // Permite que el front en Angular (otro origen) llame a esta API.
    // El origen sale de una variable de entorno; en desarrollo es el puerto 4200.
    // Cuando el front se despliegue, FRONT_URL cambia al dominio real.
    app.use(cors({ origin: process.env.FRONT_URL || 'http://localhost:4200' }));

    app.use(express.json());
    app.use(cookieParser());
    app.use(inyectarUsuarioEnVistas);

    app.use(express.urlencoded({ extended: true }));
    app.use(express.static(path.join(__dirname, '..', '..', 'FRONTEND', 'public')));

    app.engine(
        'handlebars',
        engine({
            helpers: handlebarsHelpers,
        }),
    );
    app.set('view engine', 'handlebars');
    app.set('views', path.join(__dirname, '..', '..', 'FRONTEND', 'views'));

    app.use(routes);

    return app;
}