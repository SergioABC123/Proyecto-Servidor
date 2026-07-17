import express from 'express';
import { engine } from 'express-handlebars';
import routes from './routes';
import path from 'path';
import cookieParser from 'cookie-parser';

let app: express.Express;

export function createApp() {
    app = express();
    app.use(express.json());
    app.use(cookieParser());

    app.use(express.urlencoded({ extended: true }));
    app.use(express.static(path.join(__dirname, '..', 'public')));

    // Configuración de Handlebars
    app.engine('handlebars', engine());
    app.set('view engine', 'handlebars');
    app.set('views', path.join(__dirname, '..','views'));

    app.use(routes);

    return app;
}