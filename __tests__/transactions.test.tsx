/// <reference types="@testing-library/jest-dom" />

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from 'react-query';
import Transactions, { type Transaction } from '../pages/transactions/index';
import handler from '../pages/api/transactions/index';
import { authClient } from '@/lib/auth/client';
import { auth } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    reload: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  }),
}));

// Mock the auth client
jest.mock('@/lib/auth/client', () => ({
  authClient: {
    useSession: jest.fn(),
  },
}));

// Mock auth for API
jest.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: jest.fn(),
    },
  },
}));

// Mock Prisma
jest.mock('@prisma/client', () => {
  const mockTransactionRecord = {
    findMany: jest.fn(),
    create: jest.fn(),
  };

  const mockPrisma = {
    transactionRecord: mockTransactionRecord,
  };

  return { PrismaClient: jest.fn(() => mockPrisma) };
});

// Mock fetch to call the handler
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('Transaction Creation Flow', () => {
  let queryClient: QueryClient;
  let mockUseSession: jest.Mock;
  let mockGetSession: jest.Mock;
  let mockPrisma: any;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    mockUseSession = authClient.useSession as jest.Mock;
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: 'user-123',
          name: 'Admin User',
          email: 'admin@example.com',
          role: 'admin',
        },
      },
    });

    mockGetSession = auth.api.getSession as jest.Mock;
    mockGetSession.mockResolvedValue({
      user: {
        id: 'user-123',
        role: 'admin',
      },
    });

    mockPrisma = new PrismaClient();

    // Mock fetch to call the handler
    mockFetch.mockImplementation(async (url, options) => {
      if (url === '/api/transactions') {
        const req = {
          method: options?.method || 'GET',
          headers: options?.headers || {},
          body: options?.body ? JSON.parse(options.body) : undefined,
        } as any;
        const res = {
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        } as any;
        await handler(req, res);
        const statusCode = res.status.mock.calls[0]?.[0] || 200;
        return {
          ok: statusCode >= 200 && statusCode < 300,
          json: () => Promise.resolve(res.json.mock.calls[0]?.[0] || {}),
        };
      }
      return Promise.reject(new Error('Unknown URL'));
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
  });

  it('should allow admin user to create a new transaction successfully', async () => {
    const user = userEvent.setup();

    let callCount = 0;
    const initial: Transaction[] = [
      {
        id: 'existing-1',
        concepto: 'Initial transaction',
        monto: 100.0,
        fecha: '2024-01-10',
        createdAt: '2024-01-10T00:00:00Z',
        updatedAt: '2024-01-10T00:00:00Z',
        user: {
          name: 'Admin User',
          email: 'admin@example.com',
        },
      },
    ];
    const refetch: Transaction[] = [
      ...initial,
      {
        id: 'new-transaction-123',
        concepto: 'Venta de productos',
        monto: 1500.5,
        fecha: '2024-01-15',
        createdAt: '2024-01-15T00:00:00Z',
        updatedAt: '2024-01-15T00:00:00Z',
        user: {
          name: 'Admin User',
          email: 'admin@example.com',
        },
      },
    ];

    // Mock DB
    mockPrisma.transactionRecord.findMany.mockImplementation(() => {
      callCount++;
      return Promise.resolve(callCount === 1 ? initial : refetch);
    });

    mockPrisma.transactionRecord.create.mockResolvedValue(refetch[1]);

    render(
      <QueryClientProvider client={queryClient}>
        <Transactions />
      </QueryClientProvider>
    );

    // Wait for initial data to load
    await waitFor(() => {
      expect(screen.getByText('Initial transaction')).toBeInTheDocument();
    });

    // Click the "Nuevo" button to open the dialog
    const nuevoButton = screen.getByRole('button', { name: /nuevo/i });
    expect(nuevoButton).toBeInTheDocument();
    await user.click(nuevoButton);

    // Wait for dialog to open
    await waitFor(() => {
      expect(screen.getByText('Nuevo Movimiento')).toBeInTheDocument();
    });

    // Fill out the form
    const conceptoInput = screen.getByLabelText(/concepto/i);
    const montoInput = screen.getByLabelText(/monto/i);
    const fechaInput = screen.getByLabelText(/fecha/i);

    await user.type(conceptoInput, 'Venta de productos');
    await user.clear(montoInput);
    await user.type(montoInput, '1500.50');
    await user.clear(fechaInput);
    await user.type(fechaInput, '2024-01-15');

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /guardar/i });
    await user.click(submitButton);

    // Wait for the transaction to be created and dialog to close
    await waitFor(() => {
      expect(screen.queryByText('Nuevo Movimiento')).not.toBeInTheDocument();
    });

    // Verify the new transaction appears in the list
    await waitFor(() => {
      expect(screen.getByText('Venta de productos')).toBeInTheDocument();
    });

    // Verify the amount is displayed
    expect(screen.getByText('$1500.50')).toBeInTheDocument();

    // Verify the user name is displayed (should have at least 2 instances now)
    const userElements = screen.getAllByText('Admin User');
    expect(userElements.length).toBeGreaterThanOrEqual(2);
  });

  it('should display error message when transaction creation fails', async () => {
    const user = userEvent.setup();

    const initial: Transaction[] = [
      {
        id: 'existing-1',
        concepto: 'Initial transaction',
        monto: 100.0,
        fecha: '2024-01-10',
        createdAt: '2024-01-10T00:00:00Z',
        updatedAt: '2024-01-10T00:00:00Z',
        user: {
          name: 'Admin User',
          email: 'admin@example.com',
        },
      },
    ];

    // Mock DB
    mockPrisma.transactionRecord.findMany.mockResolvedValue(initial);
    mockPrisma.transactionRecord.create.mockRejectedValue(
      new Error('DB error')
    );

    render(
      <QueryClientProvider client={queryClient}>
        <Transactions />
      </QueryClientProvider>
    );

    // Wait for initial data to load
    await waitFor(() => {
      expect(screen.getByText('Initial transaction')).toBeInTheDocument();
    });

    // Click the "Nuevo" button to open the dialog
    const nuevoButton = screen.getByRole('button', { name: /nuevo/i });
    await user.click(nuevoButton);

    // Wait for dialog to open
    await waitFor(() => {
      expect(screen.getByText('Nuevo Movimiento')).toBeInTheDocument();
    });

    // Fill out the form
    const conceptoInput = screen.getByLabelText(/concepto/i);
    const montoInput = screen.getByLabelText(/monto/i);
    const fechaInput = screen.getByLabelText(/fecha/i);

    await user.type(conceptoInput, 'Invalid transaction');
    await user.clear(montoInput);
    await user.type(montoInput, '100');
    await user.clear(fechaInput);
    await user.type(fechaInput, '2024-01-17');

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /guardar/i });
    await user.click(submitButton);

    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText('Internal server error')).toBeInTheDocument();
    });

    // Verify the dialog is still open (since creation failed)
    expect(screen.getByText('Nuevo Movimiento')).toBeInTheDocument();

    // Verify the transaction was not added to the list
    expect(screen.queryByText('Invalid transaction')).not.toBeInTheDocument();
  });
});
