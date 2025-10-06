import { PrismaClient } from '@prisma/client';
import { createId } from '@paralleldrive/cuid2';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const now = new Date();

  // Delete existing data
  await prisma.transactionRecord.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  // Create 4 users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        id: createId(),
        name: 'Admin User',
        email: 'admin@example.com',
        emailVerified: true,
        role: 'administrador',
        createdAt: now,
        updatedAt: now,
      },
    }),
    prisma.user.create({
      data: {
        id: createId(),
        name: 'User 1',
        email: 'user1@example.com',
        emailVerified: true,
        role: 'usuario',
        createdAt: now,
        updatedAt: now,
      },
    }),
    prisma.user.create({
      data: {
        id: createId(),
        name: 'User 2',
        email: 'user2@example.com',
        emailVerified: true,
        role: 'usuario',
        createdAt: now,
        updatedAt: now,
      },
    }),
    prisma.user.create({
      data: {
        id: createId(),
        name: 'User 3',
        email: 'user3@example.com',
        emailVerified: true,
        role: 'usuario',
        createdAt: now,
        updatedAt: now,
      },
    }),
  ]);

  const [adminUser, user1, user2, user3] = users;

  // Delete existing accounts
  await prisma.account.deleteMany();

  // Create accounts: 2 with github, 2 with password
  const password = await hash('password123', 12);

  await Promise.all([
    // Password accounts
    prisma.account.create({
      data: {
        id: createId(),
        accountId: adminUser.email,
        providerId: 'credential',
        userId: adminUser.id,
        password,
        createdAt: now,
        updatedAt: now,
      },
    }),
    prisma.account.create({
      data: {
        id: createId(),
        accountId: user1.email,
        providerId: 'credential',
        userId: user1.id,
        password,
        createdAt: now,
        updatedAt: now,
      },
    }),
    // Github accounts
    prisma.account.create({
      data: {
        id: createId(),
        accountId: '12345', // Mock github id
        providerId: 'github',
        userId: user2.id,
        accessToken: 'mock_token',
        createdAt: now,
        updatedAt: now,
      },
    }),
    prisma.account.create({
      data: {
        id: createId(),
        accountId: '67890', // Mock github id
        providerId: 'github',
        userId: user3.id,
        accessToken: 'mock_token',
        createdAt: now,
        updatedAt: now,
      },
    }),
  ]);

  // Create 10 transactions
  await Promise.all([
    prisma.transactionRecord.create({
      data: {
        concepto: 'Salary',
        monto: 3000.0,
        fecha: new Date('2024-10-01'),
        userId: adminUser.id,
      },
    }),
    prisma.transactionRecord.create({
      data: {
        concepto: 'Groceries',
        monto: -200.0,
        fecha: new Date('2024-10-02'),
        userId: adminUser.id,
      },
    }),
    prisma.transactionRecord.create({
      data: {
        concepto: 'Freelance',
        monto: 500.0,
        fecha: new Date('2024-10-03'),
        userId: user1.id,
      },
    }),
    prisma.transactionRecord.create({
      data: {
        concepto: 'Rent',
        monto: -800.0,
        fecha: new Date('2024-10-04'),
        userId: user1.id,
      },
    }),
    prisma.transactionRecord.create({
      data: {
        concepto: 'Sale',
        monto: 1500.0,
        fecha: new Date('2024-10-05'),
        userId: user2.id,
      },
    }),
    prisma.transactionRecord.create({
      data: {
        concepto: 'Utilities',
        monto: -100.0,
        fecha: new Date('2024-10-06'),
        userId: user2.id,
      },
    }),
    prisma.transactionRecord.create({
      data: {
        concepto: 'Bonus',
        monto: 1000.0,
        fecha: new Date('2024-10-07'),
        userId: user3.id,
      },
    }),
    prisma.transactionRecord.create({
      data: {
        concepto: 'Dining',
        monto: -50.0,
        fecha: new Date('2024-10-08'),
        userId: user3.id,
      },
    }),
    prisma.transactionRecord.create({
      data: {
        concepto: 'Investment',
        monto: -500.0,
        fecha: new Date('2024-10-09'),
        userId: adminUser.id,
      },
    }),
    prisma.transactionRecord.create({
      data: {
        concepto: 'Gift',
        monto: 200.0,
        fecha: new Date('2024-10-10'),
        userId: user1.id,
      },
    }),
  ]);

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
