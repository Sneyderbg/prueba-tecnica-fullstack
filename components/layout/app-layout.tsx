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
        <div className='p-8'>{children}</div>
      </main>
    </div>
  );
}

export { AppLayout };
