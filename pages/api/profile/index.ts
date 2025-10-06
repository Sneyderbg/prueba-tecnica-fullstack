import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';

const prisma = new PrismaClient();

/**
 * @swagger
 * /api/profile:
 *   get:
 *     summary: Obtener perfil del usuario actual
 *     description: Recuperar la información del perfil del usuario actual
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil de usuario con estadísticas
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/User'
 *                 - type: object
 *                   properties:
 *                     statistics:
 *                       type: object
 *                       properties:
 *                         transactionCount:
 *                           type: integer
 *                           description: Number of transactions
 *                         totalAmount:
 *                           type: number
 *                           description: Total amount of transactions
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 *   put:
 *     summary: Actualizar perfil del usuario actual
 *     description: Actualizar la información del perfil del usuario actual
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *             properties:
 *               name:
 *                 type: string
 *                 description: User name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User email
 *     responses:
 *       200:
 *         description: Perfil actualizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Faltan campos requeridos
 *       401:
 *         description: No autorizado
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

    if (req.method === 'GET') {
      // Get current user profile
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      });

      if (!user) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      // Get user's transactions for statistics
      const transactions = await prisma.transactionRecord.findMany({
        where: { userId: session.user.id },
        select: {
          monto: true,
        },
      });

      const transactionCount = transactions.length;
      const totalAmount = transactions.reduce((sum, t) => sum + t.monto, 0);

      res.status(200).json({
        ...user,
        statistics: {
          transactionCount,
          totalAmount,
        },
      });
    } else if (req.method === 'PUT') {
      const { name, email } = req.body;

      if (!name || !email) {
        return res.status(400).json({ message: 'Faltan campos requeridos' });
      }

      // Update current user
      const updatedUser = await prisma.user.update({
        where: { id: session.user.id },
        data: { name, email },
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
  } catch (error) {
    console.error('Profile API error:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}
