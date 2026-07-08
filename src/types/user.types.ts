import {  Types } from 'mongoose';

export enum Sexo{
    MASCULINO = "masculino",
    FEMENINO = "femenino",
    OTRO = "OTRO"
}

export enum ModoDeJuego {
    CASUAL = "casual",
    COMPETITIVO = "competitivo",
    AGRESIVO = "agresivo",
    ESTRATEGICO = "estrategico",
    COOPERATIVO = "cooperativo",
    EXPLORADOR = "explorador",
    APOYO = "apoyo",
    ROLERO = "rolero",
    COMPLETISTA = "completista", //logros/misiones
    TRYHARD = "tryhard"
}

export enum Idioma {
    ESPANOL = "español",
    INGLES = "inglés",
    PORTUGUES = "portugués",
    FRANCES = "francés",
    ALEMAN = "alemán",
    ITALIANO = "italiano",
    JAPONES = "japonés",
    COREANO = "coreano",
    CHINO = "chino",
    RUSO = "ruso",
    ARABE = "árabe",
    HINDI = "hindi"
}

export interface IJuegoActivo {
    juego_id: Types.ObjectId; // referencia a otro documento
    busca_equipo: boolean; 
    desde: Date;
}


export enum Plataforma {
    PC = "pc",
    PLAYSTATION = "playstation",
    XBOX = "xbox",
    NINTENDO_SWITCH = "nintendo_switch",
    MOBILE = "mobile"
}

export interface IPlataforma{
    nombre: Plataforma;
    gamertag: string;
}

export interface IUser{
    nombre : string;
    edad : number;
    sexo : Sexo;
    correo : string;
    contraseña_hash : string;
    rol : string;
    foto_perfil : string;
    zona_horaria : string;
    horario_juego : string;
    disponibilidad: string[];
    idiomas : Idioma[];
    modo_juego: ModoDeJuego[];
    plataformas: IPlataforma[];
    juegos_activos: IJuegoActivo[]; //Array de objetos anidados 
    juegos_pasados: Types.ObjectId[]; //Array de referencias a otros documetos 
}