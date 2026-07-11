import express from 'express';
import routes from './routes';
import path from 'path';

let app;

export function createApp(){
    app= express(); 
    app.use(express.json());


    app.use(express.urlencoded({ extended: true })); // lo usamos para leer el formulario con el formato urlencoded
    app.use(express.static(path.join(__dirname, '..', 'public'))); // carcar los estilos css

    app.use(routes);

    return app;
}