import { useState } from 'react';
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
import { useQuery } from 'react-query';
import { User, Mail, MapPin, LogOut, Save, DollarSign } from 'lucide-react';

// eslint-disable-next-line complexity
function Profile() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Fetch transactions
  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const response = await fetch('/api/transactions');
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      return response.json() as Promise<any[]>;
    },
    enabled: !!session,
  });

  // Filter user's transactions
  const userTransactions = transactions.filter(
    (t) => t.userId === session?.user?.id
  );
  const transactionCount = userTransactions.length;
  const totalAmount = userTransactions.reduce((sum, t) => sum + t.monto, 0);

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
    // Implement save functionality
    setIsEditing(false);
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
                    defaultValue={session.user?.name || ''}
                    disabled={!isEditing}
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='email'>Correo Electrónico</Label>
                  <Input
                    id='email'
                    type='email'
                    defaultValue={session.user?.email || ''}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className='flex space-x-4'>
                {isEditing ? (
                  <>
                    <Button onClick={handleSave}>
                      <Save className='mr-2 h-4 w-4' />
                      Guardar Cambios
                    </Button>
                    <Button
                      variant='outline'
                      onClick={() => setIsEditing(false)}
                    >
                      Cancelar
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditing(true)}>
                    Editar Perfil
                  </Button>
                )}
              </div>
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
