import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { auth, Session } from '@/lib/auth';

const prisma = new PrismaClient();

/**
 * @swagger
 * /api/transactions:
 *   get:
 *     summary: Obtener todas las transacciones
 *     description: Recuperar una lista de todos los registros de transacciones
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de transacciones
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Transaction'
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 *   post:
 *     summary: Crear una nueva transacción
 *     description: Crear un nuevo registro de transacción (solo administrador)
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
 *         description: Transacción creada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Transaction'
 *       400:
 *         description: Faltan campos requeridos
 *       403:
 *         description: Prohibido - Se requiere acceso de administrador
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
      return handleGetTransactions(req, res);
    } else if (req.method === 'POST') {
      return handleCreateTransaction(req, res, session);
    } else {
      return res.status(405).json({ message: 'Método no permitido' });
    }
  } catch {
    return res.status(500).json({ message: 'Error interno del servidor' });
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
    res.status(500).json({ message: 'Error interno del servidor' });
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
        .json({ message: 'Prohibido: Se requiere acceso de administrador' });
    }

    const { concepto, monto, fecha } = req.body;

    // Validate required fields
    if (!concepto || monto === undefined || !fecha) {
      return res.status(400).json({ message: 'Faltan campos requeridos' });
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
    res.status(500).json({ message: 'Error interno del servidor' });
  }
}
