import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';

const prisma = new PrismaClient();

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     description: Retrieve a list of all users (admin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
 *   put:
 *     summary: Update a user
 *     description: Update user information (admin only)
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
 *         description: User updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         description: Internal server error
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
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (session.user.role !== 'administrador') {
      return res
        .status(403)
        .json({ message: 'Forbidden: Admin access required' });
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
        return res.status(400).json({ message: 'Missing required fields' });
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
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
}
