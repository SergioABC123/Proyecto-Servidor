/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         nombre:
 *           type: string
 *         edad:
 *           type: number
 *         sexo:
 *           type: string
 *           enum: [masculino, femenino, otro]
 *         correo:
 *           type: string
 *           format: email
 *         rol:
 *           type: string
 *           enum: [administrador, usuario, moderador]
 *           default: usuario
 *         isActive:
 *           type: boolean
 *           default: true
 *         foto_perfil:
 *           type: string
 *         zona_horaria:
 *           type: string
 *         horario_juego:
 *           type: string
 *         disponibilidad:
 *           type: array
 *           items:
 *             type: string
 *         idiomas:
 *           type: array
 *           items:
 *             type: string
 *         modo_juego:
 *           type: array
 *           items:
 *             type: string
 *         plataformas:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               gamertag:
 *                 type: string
 *     RegisterInput:
 *       type: object
 *       required: [name, email, password]
 *       properties:
 *         name:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           minLength: 8
 *     LoginInput:
 *       type: object
 *       required: [email, password]
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *     Juego:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         titulo:
 *           type: string
 *         imagen:
 *           type: string
 *         generos:
 *           type: array
 *           items:
 *             type: string
 *         plataformas:
 *           type: array
 *           items:
 *             type: string
 *             enum: [pc, playstation, xbox, nintendo_switch, mobile]
 *         id_api:
 *           type: number
 *         activo:
 *           type: boolean
 *           default: true
 */