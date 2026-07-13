import { Router } from 'express';
import { crearReporte, listarReportes, obtenerReporte, actualizarReporte } from '../controllers/reporte.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * /reporte:
 *   post:
 *     tags: [Reportes]
 *     summary: Crear un reporte contra un usuario
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reportado_id, motivo]
 *             properties:
 *               reportado_id: { type: string }
 *               motivo:
 *                 type: string
 *                 enum: [spam, acoso, contenido_inapropiado, otro]
 *               descripcion: { type: string }
 *               grupo_id: { type: string }
 *               post_id: { type: string }
 *               comentario_id: { type: string }
 *     responses:
 *       201:
 *         description: Reporte creado exitosamente.
 *       400:
 *         description: Falta reportado_id/motivo, o intentaste reportarte a ti mismo.
 *   get:
 *     tags: [Reportes]
 *     summary: Listar reportes
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: pagina
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limite
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: estado
 *         schema:
 *           type: string
 *           enum: [pendiente, resuelto, rechazado]
 *     responses:
 *       200:
 *         description: Lista paginada de reportes.
 */
router.post('/', authMiddleware, crearReporte);
router.get('/', authMiddleware, listarReportes);

/**
 * @swagger
 * /reporte/{id}:
 *   get:
 *     tags: [Reportes]
 *     summary: Obtener un reporte por ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Datos del reporte.
 *       404:
 *         description: Reporte no encontrado.
 *   patch:
 *     tags: [Reportes]
 *     summary: Cambiar el estado de un reporte (pensado para moderador)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [estado]
 *             properties:
 *               estado:
 *                 type: string
 *                 enum: [pendiente, resuelto, rechazado]
 *     responses:
 *       200:
 *         description: Reporte actualizado.
 *       400:
 *         description: Falta el campo estado.
 */
router.get('/:id', authMiddleware, obtenerReporte);
router.patch('/:id', authMiddleware, actualizarReporte);
//Por el momento se puede modificar el reporte solo el cmapo del estado,
//Ya que en teoria un moderador puede cambiar el estado de un reporte, pero no puede cambiar el contenido del mismo.
//Falta el middleware para que solo un moderador pueda cambiar el estado del reporte, pero por el momento lo dejamos asi para poder probar la funcionalidad de actualizar un reporte.

export default router;
