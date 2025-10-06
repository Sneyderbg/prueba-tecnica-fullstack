import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { auth } from '@/lib/auth';

const prisma = new PrismaClient();

/**
 * @swagger
 * /api/profile:
 *   get:
 *     summary: Get current user profile
 *     description: Retrieve the current user's profile information
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile with statistics
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
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 *   put:
 *     summary: Update current user profile
 *     description: Update the current user's profile information
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
 *         description: Profile updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
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
        return res.status(404).json({ message: 'User not found' });
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
        return res.status(400).json({ message: 'Missing required fields' });
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
      res.status(405).json({ message: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Profile API error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
