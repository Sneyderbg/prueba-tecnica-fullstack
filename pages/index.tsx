import Link from 'next/link';
import { AppLayout } from '@/components/layout/app-layout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, Users, FileText, ArrowRight } from 'lucide-react';
import { authClient } from '@/lib/auth/client';

const modules = [
  {
    title: 'Ingresos y Egresos',
    description: 'Gestiona tus transacciones financieras',
    href: '/transactions',
    icon: DollarSign,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    adminOnly: false,
  },
  {
    title: 'Usuarios',
    description: 'Administra los usuarios de la aplicación',
    href: '/users',
    icon: Users,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    adminOnly: true,
  },
  {
    title: 'Reportes',
    description: 'Genera y descarga informes financieros',
    href: '/reports',
    icon: FileText,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    adminOnly: true,
  },
];

function Home() {
  const { data: session } = authClient.useSession();
  const isAdmin = (session?.user as any)?.role === 'administrador';

  const visibleModules = modules.filter(
    (module) => !module.adminOnly || isAdmin
  );

  return (
    <AppLayout>
      <div className='space-y-6'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>Dashboard</h1>
          <p className='text-gray-600'>
            Bienvenido a tu panel de control financiero
          </p>
        </div>

        <div
          className={`grid gap-6 ${visibleModules.length === 1 ? 'grid-cols-1 max-w-md' : 'grid-cols-3'}`}
        >
          {visibleModules.map((module) => (
            <Link key={module.title} href={module.href}>
              <Card className='cursor-pointer hover:shadow-lg transition-shadow duration-200'>
                <CardHeader>
                  <div
                    className={`w-12 h-12 rounded-lg ${module.bgColor} flex items-center justify-center mb-4`}
                  >
                    <module.icon className={`h-6 w-6 ${module.color}`} />
                  </div>
                  <CardTitle className='text-xl'>{module.title}</CardTitle>
                  <CardDescription>{module.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant='outline' className='w-full'>
                    Acceder
                    <ArrowRight className='ml-2 h-4 w-4' />
                  </Button>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}

export default Home;
