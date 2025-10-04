import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { auth, Session } from '@/lib/auth';

const prisma = new PrismaClient();

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
