import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { AppLayout } from '@/components/layout/app-layout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { authClient } from '@/lib/auth/client';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { User, Mail, LogOut, Save, DollarSign } from 'lucide-react';
import { z } from 'zod';
import { profileUpdateSchema } from '@/lib/schemas';

// eslint-disable-next-line complexity
function Profile() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Update state when session loads
  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || '');
      setEmail(session.user.email || '');
    }
  }, [session]);

  // Fetch user profile with statistics
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await fetch('/api/profile');
      if (!response.ok) {
        throw new Error('Error al obtener perfil');
      }
      return response.json();
    },
    enabled: !!session,
  });

  const transactionCount = profile?.statistics?.transactionCount || 0;
  const totalAmount = profile?.statistics?.totalAmount || 0;

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: { name: string; email: string }) => {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar perfil');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      // Refresh session to get updated user data
      window.location.reload();
    },
    onError: (error: unknown) => {
      setErrorMessage((error as Error).message || 'Error al actualizar perfil');
    },
  });

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await authClient.signOut();
      router.push('/login');
    } catch {
      // Handle logout error silently
    } finally {
      setIsLoggingOut(false);
    }
  }

  function handleSave() {
    setErrorMessage(null);

    try {
      profileUpdateSchema.parse({ name, email });
    } catch (error) {
      if (error instanceof z.ZodError) {
        setErrorMessage(error.issues[0].message);
      }
      return;
    }

    updateProfileMutation.mutate(
      { name, email },
      {
        onSuccess: () => {
          setIsEditing(false);
          setErrorMessage(null);
        },
      }
    );
  }

  function handleCancel() {
    setName(session?.user?.name || '');
    setEmail(session?.user?.email || '');
    setIsEditing(false);
    setErrorMessage(null);
  }

  if (!session) {
    return (
      <AppLayout>
        <div className='flex items-center justify-center h-64'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4'></div>
            <p>Cargando perfil...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className='space-y-6'>
        <div className='flex justify-between items-center'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>Perfil</h1>
            <p className='text-gray-600'>Gestiona tu información personal</p>
          </div>
          <Button
            variant='destructive'
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <>
                <div className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
                Cerrando Sesión...
              </>
            ) : (
              <>
                <LogOut className='mr-2 h-4 w-4' />
                Cerrar Sesión
              </>
            )}
          </Button>
        </div>

        <div className='grid grid-cols-3 gap-6'>
          {/* Profile Info */}
          <Card className='lg:col-span-2'>
            <CardHeader>
              <CardTitle>Información Personal</CardTitle>
              <CardDescription>
                Actualiza tu información personal y de contacto
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='flex items-center space-x-4'>
                <Avatar className='h-20 w-20'>
                  <AvatarImage
                    src={session.user?.image || ''}
                    alt={session.user?.name || ''}
                  />
                  <AvatarFallback className='text-lg'>
                    {session.user?.name
                      ?.split(' ')
                      .map((n) => n[0])
                      .join('') || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className='text-lg font-medium'>{session.user?.name}</h3>
                  <p className='text-gray-500'>{session.user?.email}</p>
                  <Badge variant='secondary' className='mt-1'>
                    Usuario Activo
                  </Badge>
                </div>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='name'>Nombre Completo</Label>
                  <Input
                    id='name'
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='email'>Correo Electrónico</Label>
                  <Input
                    id='email'
                    type='email'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className='flex space-x-4'>
                {isEditing ? (
                  <>
                    <Button
                      onClick={handleSave}
                      disabled={updateProfileMutation.isLoading}
                    >
                      {updateProfileMutation.isLoading ? (
                        <>
                          <div className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Save className='mr-2 h-4 w-4' />
                          Guardar Cambios
                        </>
                      )}
                    </Button>
                    <Button variant='outline' onClick={handleCancel}>
                      Cancelar
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditing(true)}>
                    Editar Perfil
                  </Button>
                )}
              </div>

              {errorMessage && (
                <p className='text-sm text-red-600 mt-2'>{errorMessage}</p>
              )}
            </CardContent>
          </Card>

          {/* Account Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Estadísticas de Cuenta</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center'>
                  <User className='mr-2 h-4 w-4 text-gray-500' />
                  <span className='text-sm'>Estado</span>
                </div>
                <Badge variant='secondary' className='text-xs'>
                  Activo
                </Badge>
              </div>

              <div className='flex items-center justify-between'>
                <div className='flex items-center'>
                  <Mail className='mr-2 h-4 w-4 text-gray-500' />
                  <span className='text-sm'>Transacciones</span>
                </div>
                <span className='text-sm font-medium'>{transactionCount}</span>
              </div>

              <div className='flex items-center justify-between'>
                <div className='flex items-center'>
                  <DollarSign className='mr-2 h-4 w-4 text-gray-500' />
                  <span className='text-sm'>Monto Total</span>
                </div>
                <span
                  className={`text-sm font-medium ${totalAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  {totalAmount < 0 ? '-' : ''}$
                  {Math.abs(totalAmount).toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

export default Profile;
