import express from 'express';

let app;

export function createApp(){
    app= express(); 

    return app;
}