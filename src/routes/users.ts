// rutas de los usuarios
import { Router } from 'express';
import {
    actualizarUsuario,
    eliminarUsuario,
    getMe,
    loginUser,
    registerUser,
    listarUsuarios,
    confirmarCuenta,
} from '../controllers/users.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validatePassword } from '../middlewares/validatePassword.middleware';
import { requireAdmin } from '../middlewares/allowRoles';
import { upload } from '../middlewares/upload.middleware';

const router = Router();

/**
 * @swagger
 * /user/register:
 *   post:
 *     tags: [Users]
 *     summary: Registrar un nuevo usuario
 *     description: Crea la cuenta y envía un correo de confirmación. La cuenta no podrá iniciar sesión hasta confirmar el correo.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterInput'
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente.
 *       400:
 *         description: Faltan campos requeridos, contraseña muy corta, o correo ya en uso.
 */
router.post('/register', validatePassword, registerUser);

/**
 * @swagger
 * /user/login:
 *   post:
 *     tags: [Users]
 *     summary: Iniciar sesión
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginInput'
 *     responses:
 *       200:
 *         description: Login exitoso, regresa un JWT.
 *       401:
 *         description: Credenciales inválidas, o el correo aún no ha sido confirmado.
 */
router.post('/login', loginUser);
router.post('/login', loginUser);

/**
 * @swagger
 * /user/actualizar:
 *   patch:
 *     tags: [Users]
 *     summary: Actualizar el perfil propio
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       200:
 *         description: Perfil actualizado correctamente.
 *       400:
 *         description: Se intentó modificar el rol.
 *       401:
 *         description: No autenticado.
 */
router.patch('/actualizar', authMiddleware, upload.single('foto_perfil'),actualizarUsuario);

/**
 * @swagger
 * /user/me:
 *   get:
 *     tags: [Users]
 *     summary: Obtener el perfil del usuario autenticado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos del usuario autenticado.
 *       401:
 *         description: No autenticado.
 */
router.get('/me', authMiddleware, getMe);

/**
 * @swagger
 * /user/listarUsuarios:
 *   get:
 *     tags: [Users]
 *     summary: Listar todos los usuarios (solo admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: pagina
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limite
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: incluirInactivos
 *         schema:
 *           type: boolean
 *           default: false
 *     responses:
 *       200:
 *         description: Lista paginada de usuarios.
 *       403:
 *         description: No tienes permisos de administrador.
 */
router.get('/listarUsuarios', authMiddleware, requireAdmin, listarUsuarios);

/**
 * @swagger
 * /user/eliminar:
 *   delete:
 *     tags: [Users]
 *     summary: Eliminar (soft delete) la cuenta propia
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Usuario eliminado exitosamente.
 *       401:
 *         description: No autenticado.
 */
router.delete('/eliminar', authMiddleware, eliminarUsuario);


/**
 * @swagger
 * /user/confirmar/{token}:
 *   get:
 *     tags: [Users]
 *     summary: Confirmar cuenta mediante el token enviado por correo
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cuenta confirmada exitosamente.
 *       400:
 *         description: Token inválido o expirado.
 *       404:
 *         description: Usuario no encontrado.
 */
router.get('/confirmar/:token', confirmarCuenta);

export default router;
