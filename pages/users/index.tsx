import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { authClient } from '@/lib/auth/client';
import { userUpdateSchema, UserUpdateFormData } from '@/lib/schemas';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

function Users(): JSX.Element {
  const queryClient = useQueryClient();

  // Fetch users
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await fetch('/api/users');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      return response.json() as Promise<User[]>;
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (data: UserUpdateFormData & { id: string }) => {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update user');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: unknown) => {
      setErrorMessage((error as Error).message || 'Error');
    },
  });

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { data: session } = authClient.useSession();
  const userRole = (session?.user as { role?: string })?.role || 'user';
  const isAdmin = userRole === 'admin';

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UserUpdateFormData>({
    resolver: zodResolver(userUpdateSchema),
  });

  function onSubmit(data: UserUpdateFormData) {
    if (!editingUser) return;
    setErrorMessage(null);
    updateUserMutation.mutate(
      { ...data, id: editingUser.id },
      {
        onSuccess: () => {
          reset();
          setIsDialogOpen(false);
          setEditingUser(null);
          setErrorMessage(null);
        },
      }
    );
  }

  function openEditDialog(user: User) {
    setEditingUser(user);
    reset({ name: user.name, role: user.role as 'admin' | 'user' });
    setIsDialogOpen(true);
  }

  if (!isAdmin) {
    return (
      <AppLayout>
        <div className='flex items-center justify-center h-64'>
          <p className='text-lg text-gray-600'>
            Acceso denegado. Solo administradores pueden ver esta página.
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className='space-y-6'>
        <div>
          <h1 className='text-2xl font-bold underline'>Gestión de Usuarios</h1>
        </div>

        <Card>
          <CardContent className='pt-6'>
            <div className='max-h-96 overflow-y-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className='text-center'>
                        Cargando...
                      </TableCell>
                    </TableRow>
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className='text-center'>
                        No hay usuarios
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.role}</TableCell>
                        <TableCell>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => openEditDialog(user)}
                          >
                            Editar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Usuario</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
              <div>
                <Label htmlFor='name'>Nombre</Label>
                <Input
                  id='name'
                  placeholder='Nombre del usuario'
                  {...register('name')}
                />
                {errors.name && (
                  <p className='text-sm text-red-600 mt-1'>
                    {errors.name.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor='role'>Rol</Label>
                <select
                  id='role'
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  {...register('role')}
                >
                  <option value='admin'>Admin</option>
                  <option value='user'>User</option>
                </select>
                {errors.role && (
                  <p className='text-sm text-red-600 mt-1'>
                    {errors.role.message}
                  </p>
                )}
              </div>

              {errorMessage && (
                <p className='text-sm text-red-600 mt-1'>{errorMessage}</p>
              )}

              <Button
                type='submit'
                className='w-full'
                disabled={updateUserMutation.isLoading}
              >
                {updateUserMutation.isLoading ? 'Guardando...' : 'Guardar'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}

export default Users;
