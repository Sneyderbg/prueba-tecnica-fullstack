import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { auth, Session } from '@/lib/auth';

const prisma = new PrismaClient();

/**
 * @swagger
 * /api/transactions:
 *   get:
 *     summary: Get all transactions
 *     description: Retrieve a list of all transaction records
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Transaction'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 *   post:
 *     summary: Create a new transaction
 *     description: Create a new transaction record (admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - concepto
 *               - monto
 *               - fecha
 *             properties:
 *               concepto:
 *                 type: string
 *                 description: Transaction concept
 *               monto:
 *                 type: number
 *                 description: Transaction amount
 *               fecha:
 *                 type: string
 *                 format: date-time
 *                 description: Transaction date
 *     responses:
 *       201:
 *         description: Transaction created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Transaction'
 *       400:
 *         description: Missing required fields
 *       403:
 *         description: Forbidden - Admin access required
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
      return handleGetTransactions(req, res);
    } else if (req.method === 'POST') {
      return handleCreateTransaction(req, res, session);
    } else {
      return res.status(405).json({ message: 'Method not allowed' });
    }
  } catch {
    return res.status(500).json({ message: 'Internal server error' });
  }
}

async function handleGetTransactions(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Get all transactions
    const transactions = await prisma.transactionRecord.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        fecha: 'desc',
      },
    });

    res.status(200).json(transactions);
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function handleCreateTransaction(
  req: NextApiRequest,
  res: NextApiResponse,
  session: Session
) {
  try {
    // Check if user has admin role
    if (session.user.role !== 'admin') {
      return res
        .status(403)
        .json({ message: 'Forbidden: Admin access required' });
    }

    const { concepto, monto, fecha } = req.body;

    // Validate required fields
    if (!concepto || monto === undefined || !fecha) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Create transaction
    const transaction = await prisma.transactionRecord.create({
      data: {
        concepto,
        monto: parseFloat(monto),
        fecha: new Date(fecha),
        userId: session.user.id,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json(transaction);
  } catch {
    res.status(500).json({ message: 'Internal server error' });
  }
}
