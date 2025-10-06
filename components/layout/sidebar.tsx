import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth/client';
import { DollarSign, Users, FileText, User, LogOut, Home } from 'lucide-react';

const navigation = [
  {
    name: 'Dashboard',
    href: '/',
    icon: Home,
    roles: ['user', 'admin'],
  },
  {
    name: 'Ingresos y Egresos',
    href: '/transactions',
    icon: DollarSign,
    roles: ['user', 'admin'],
  },
  { name: 'Usuarios', href: '/users', icon: Users, roles: ['admin'] },
  {
    name: 'Reportes',
    href: '/reports',
    icon: FileText,
    roles: ['admin'],
  },
  {
    name: 'Perfil',
    href: '/profile',
    icon: User,
    roles: ['user', 'admin'],
  },
];

interface SidebarProps {
  className?: string;
}

function Sidebar({ className }: SidebarProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { data: session } = authClient.useSession();
  const userRole = (session?.user as { role?: string })?.role || 'user';

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

  return (
    <div
      className={cn(
        'flex h-full w-64 flex-col bg-gray-900 text-white',
        className
      )}
    >
      {/* Logo */}
      <div className='flex h-16 items-center px-6'>
        <div className='flex items-center space-x-2'>
          <DollarSign className='h-8 w-8 text-blue-400' />
          <span className='text-xl font-bold'>FinApp</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className='flex-1 space-y-1 px-4 py-4'>
        {navigation
          .filter((item) => item.roles.includes(userRole))
          .map((item) => {
            const isActive = router.pathname === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start text-left',
                    isActive
                      ? 'bg-gray-800 text-white hover:bg-gray-700'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  )}
                >
                  <item.icon className='mr-3 h-5 w-5' />
                  {item.name}
                </Button>
              </Link>
            );
          })}
      </nav>

      {/* Logout */}
      <div className='border-t border-gray-800 p-4'>
        <Button
          variant='ghost'
          className='w-full justify-start text-left text-gray-300 hover:bg-gray-800 hover:text-white'
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <>
              <div className='mr-3 h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent' />
              Cerrando...
            </>
          ) : (
            <>
              <LogOut className='mr-3 h-5 w-5' />
              Cerrar Sesión
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export { Sidebar };
