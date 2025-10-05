/// <reference types="@testing-library/jest-dom" />

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from 'react-query';
import Users, { type User } from '../pages/users/index';
import handler from '../pages/api/users/index';
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
  const mockUser = {
    findMany: jest.fn(),
    update: jest.fn(),
  };

  const mockPrisma = {
    user: mockUser,
  };

  return { PrismaClient: jest.fn(() => mockPrisma) };
});

// Mock fetch to call the handler
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('User Management Flow', () => {
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
      if (url === '/api/users') {
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

    // For PUT requests, we need to handle them separately since the handler is mocked
    // But actually, since we're calling the real handler, it should work. The issue might be in the mock setup.
  });

  afterEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
  });

  it('should display user list for admin users', async () => {
    const initial: User[] = [
      {
        id: 'user-1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'admin',
      },
      {
        id: 'user-2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        role: 'user',
      },
    ];

    // Mock DB
    mockPrisma.user.findMany.mockResolvedValue(initial);

    render(
      <QueryClientProvider client={queryClient}>
        <Users />
      </QueryClientProvider>
    );

    // Wait for initial data to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Verify table headers
    expect(screen.getByText('Nombre')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Rol')).toBeInTheDocument();
    expect(screen.getByText('Acciones')).toBeInTheDocument();

    // Verify user data
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('admin')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    expect(screen.getByText('user')).toBeInTheDocument();

    // Verify edit buttons
    const editButtons = screen.getAllByRole('button', { name: /editar/i });
    expect(editButtons.length).toBe(2);
  });

  it('should allow admin user to edit a user successfully', async () => {
    const user = userEvent.setup();

    let callCount = 0;
    const initial: User[] = [
      {
        id: 'user-1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user',
      },
    ];
    const refetch: User[] = [
      {
        id: 'user-1',
        name: 'John Updated',
        email: 'john@example.com',
        role: 'admin',
      },
    ];
    const updated: User = refetch[0];

    // Mock DB
    mockPrisma.user.findMany.mockImplementation(() => {
      callCount++;
      return Promise.resolve(callCount === 1 ? initial : refetch);
    });
    mockPrisma.user.update.mockResolvedValue(updated);

    render(
      <QueryClientProvider client={queryClient}>
        <Users />
      </QueryClientProvider>
    );

    // Wait for initial data to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Click the "Editar" button
    const editButton = screen.getByRole('button', { name: /editar/i });
    await user.click(editButton);

    // Wait for dialog to open
    await waitFor(() => {
      expect(screen.getByText('Editar Usuario')).toBeInTheDocument();
    });

    // Fill out the form
    const nameInput = screen.getByLabelText(/nombre/i);
    const roleSelect = screen.getByLabelText(/rol/i);

    await user.clear(nameInput);
    await user.type(nameInput, 'John Updated');
    await user.selectOptions(roleSelect, 'admin');

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /guardar/i });
    await user.click(submitButton);

    // Wait for the user to be updated and dialog to close
    await waitFor(() => {
      expect(screen.queryByText('Editar Usuario')).not.toBeInTheDocument();
    });

    // Verify the updated user appears in the list
    await waitFor(() => {
      expect(screen.getByText('John Updated')).toBeInTheDocument();
    });

    // Verify the role is updated
    expect(screen.getByText('admin')).toBeInTheDocument();
  });

  it('should display error message when user update fails', async () => {
    const user = userEvent.setup();

    const initial: User[] = [
      {
        id: 'user-1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user',
      },
    ];

    // Mock DB
    mockPrisma.user.findMany.mockResolvedValue(initial);
    mockPrisma.user.update.mockRejectedValue(new Error('DB error'));

    render(
      <QueryClientProvider client={queryClient}>
        <Users />
      </QueryClientProvider>
    );

    // Wait for initial data to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Click the "Editar" button
    const editButton = screen.getByRole('button', { name: /editar/i });
    await user.click(editButton);

    // Wait for dialog to open
    await waitFor(() => {
      expect(screen.getByText('Editar Usuario')).toBeInTheDocument();
    });

    // Fill out the form
    const nameInput = screen.getByLabelText(/nombre/i);
    const roleSelect = screen.getByLabelText(/rol/i);

    await user.clear(nameInput);
    await user.type(nameInput, 'John Updated');
    await user.selectOptions(roleSelect, 'admin');

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /guardar/i });
    await user.click(submitButton);

    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText('Internal server error')).toBeInTheDocument();
    });

    // Verify the dialog is still open (since update failed)
    expect(screen.getByText('Editar Usuario')).toBeInTheDocument();

    // Verify the user was not updated in the list
    expect(screen.queryByText('John Updated')).not.toBeInTheDocument();
  });

  it('should deny access to non-admin users', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: 'user-456',
          name: 'Regular User',
          email: 'user@example.com',
          role: 'user',
        },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <Users />
      </QueryClientProvider>
    );

    // Verify access denied message
    await waitFor(() => {
      expect(
        screen.getByText(
          'Acceso denegado. Solo administradores pueden ver esta página.'
        )
      ).toBeInTheDocument();
    });

    // Verify no table is shown
    expect(screen.queryByText('Nombre')).not.toBeInTheDocument();
  });
});
