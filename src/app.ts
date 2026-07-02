import express from 'express';
import routes from './routes';

let app;

export function createApp(){
    app= express(); 
    
    app.use(routes);

    return app;
}