import { ReactNode } from 'react';
import { Sidebar } from './sidebar';

interface AppLayoutProps {
  children: ReactNode;
}

function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className='flex h-screen bg-gray-50'>
      <Sidebar />
      <main className='flex-1 overflow-auto'>
        <header className='px-8 py-8'>
          <h1 className='text-3xl font-bold text-gray-900 text-center'>
            Sistema de gestión de Ingresos y Gastos
          </h1>
        </header>
        <div className='p-8'>{children}</div>
      </main>
    </div>
  );
}

export { AppLayout };
