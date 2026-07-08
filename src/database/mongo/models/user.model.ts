// modelos
import {Schema, model, connect} from 'mongoose'
import { IUser,Sexo,ModoDeJuego,Idioma,Plataforma } from '../../../types/user.types' 

//En este archivo se define el modelo de usuario,
// que es la estructura de los documentos que se guardaran en la coleccion de usuarios en MongoDB


//<Iuser> es un generico que le dice a mongoose que el modelo de usuario debe cumplir con la interfaz IUse
const userSchema = new Schema<IUser>({
    nombre: { type: String, required: true},
    edad: { type: Number, required:true},
    sexo: { type: String, enum: Object.values(Sexo), required:true }, // enum: Object.values(Sexo) asegura que solo se puedan guardar los valores definidos en el enum Sexo
    correo: { type: String, required:true, unique: true},
    contraseña_hash: {type: String, required:true},
    rol: {type: String, required:true},
    foto_perfil: {type: String},
    zona_horaria: {type: String},
    horario_juego: {type: String},
    disponibilidad: {type: [String]},
    idiomas: [{type: String, enum: Object.values(Idioma)}], 
    modo_juego: [{type: String, enum: Object.values(ModoDeJuego)}],
    plataformas: [{
        nombre: {type: String, enum: Object.values(Plataforma)},
        gamertag: {type: String}
    }],
    juegos_activos: [{
        juego_id: {type: Schema.Types.ObjectId},
        busca_equipo: {type: Boolean},
        desde: {type: Date}
    }],
    juegos_pasados: {type: [Schema.Types.ObjectId]}
})

//Exportamos el modelo de usuario para poder usarlo en otras partes del proyecto
export const User = model<IUser>('User', userSchema);

//El schema es la estructura de los documentos, y el modelo es la clase que nos permite interactuar con la coleccion de usuarios en MongoDB
