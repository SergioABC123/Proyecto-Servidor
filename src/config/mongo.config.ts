// conexion a mongo
import {Schema, model, connect} from 'mongoose'


export async function mongodbConection () {
    try{
        await connect(process.env.MONGODB_URI!)
        console.log("Conexion establecida con Mongodb");
    }catch (error){
        console.log("Error al conectar con Mongodb",error);
        process.exit(1);
    }
    
}
