import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';

const prisma = new PrismaClient();

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Obtener todos los usuarios
 *     description: Recuperar una lista de todos los usuarios (solo administrador)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido - Se requiere acceso de administrador
 *       500:
 *         description: Error interno del servidor
 *   put:
 *     summary: Actualizar un usuario
 *     description: Actualizar información del usuario (solo administrador)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - name
 *               - role
 *             properties:
 *               id:
 *                 type: string
 *                 description: User ID
 *               name:
 *                 type: string
 *                 description: User name
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *                 description: User role
 *     responses:
 *       200:
 *         description: Usuario actualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Faltan campos requeridos
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido - Se requiere acceso de administrador
 *       500:
 *         description: Error interno del servidor
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Get session
    const headers = new Headers();
    Object.entries(req.headers).forEach(([key, value]) => {
      if (value) {
        headers.set(key, Array.isArray(value) ? value.join(', ') : value);
      }
    });

    const session = await auth.api.getSession({
      headers,
    });

    if (!session) {
      return res.status(401).json({ message: 'No autorizado' });
    }

    if (session.user.role !== 'admin') {
      return res
        .status(403)
        .json({ message: 'Prohibido: Se requiere acceso de administrador' });
    }

    if (req.method === 'GET') {
      // Get all users
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      res.status(200).json(users);
    } else if (req.method === 'PUT') {
      const { id, name, role } = req.body;

      if (!id || !name || !role) {
        return res.status(400).json({ message: 'Faltan campos requeridos' });
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: { name, role },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      });

      res.status(200).json(updatedUser);
    } else {
      res.status(405).json({ message: 'Método no permitido' });
    }
  } catch {
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}
