import { Router } from 'express';
import {
    crearGrupo,
    eliminarGrupo,
    actualizarGrupo,
    obtenerGrupo,
    listarGrupos, 
    unirseAGrupo, 
    salirDeGrupo, 
    expulsarIntegrante,
    transferirLiderazgo
} from '../controllers/grupo.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * /grupo:
 *   post:
 *     tags: [Grupos]
 *     summary: Crear un grupo (el creador queda como líder)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre]
 *             properties:
 *               nombre:
 *                 type: string
 *               descripcion:
 *                 type: string
 *     responses:
 *       201:
 *         description: Grupo creado exitosamente.
 *       400:
 *         description: El nombre es requerido.
 *   get:
 *     tags: [Grupos]
 *     summary: Listar grupos
 *     parameters:
 *       - in: query
 *         name: pagina
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limite
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: incluirInactivos
 *         schema: { type: boolean, default: false }
 *     responses:
 *       200:
 *         description: Lista paginada de grupos.
 */
router.post('/', authMiddleware, crearGrupo);
router.get('/', listarGrupos);

/**
 * @swagger
 * /grupo/{id}:
 *   get:
 *     tags: [Grupos]
 *     summary: Obtener un grupo por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Datos del grupo.
 *       404:
 *         description: Grupo no encontrado.
 *   patch:
 *     tags: [Grupos]
 *     summary: Actualizar nombre/descripción (solo el líder)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre: { type: string }
 *               descripcion: { type: string }
 *     responses:
 *       200:
 *         description: Grupo actualizado.
 *       403:
 *         description: Solo el líder puede editar el grupo.
 *   delete:
 *     tags: [Grupos]
 *     summary: Eliminar (soft delete) un grupo (solo el líder)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Grupo eliminado correctamente.
 *       403:
 *         description: Solo el líder puede eliminar el grupo.
 */
router.get('/:id', obtenerGrupo);
router.patch('/:id', authMiddleware, actualizarGrupo);
router.delete('/:id', authMiddleware, eliminarGrupo);
router.post('/:id/unirse', authMiddleware, unirseAGrupo);
router.post('/:id/salir', authMiddleware, salirDeGrupo);
router.delete('/:id/integrantes', authMiddleware, expulsarIntegrante);
router.patch('/:id/transferir-liderazgo', authMiddleware, transferirLiderazgo);

export default router;
