import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
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
    } catch {
      res.status(500).json({ message: 'Internal server error' });
    }
  } else if (req.method === 'PUT') {
    try {
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
    } catch {
      res.status(500).json({ message: 'Internal server error' });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
