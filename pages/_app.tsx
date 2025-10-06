import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { authClient } from '@/lib/auth/client';
import { QueryClient, QueryClientProvider } from 'react-query';

// Pages that don't require authentication
const publicPages = ['/login', '/signup', '/docs'];

const queryClient = new QueryClient();

function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (isPending) return; // Still loading

    const isPublicPage = publicPages.includes(router.pathname);

    if (!session && !isPublicPage) {
      // Redirect to login if not authenticated and not on a public page
      router.push('/login');
    }
  }, [session, isPending, router.pathname, router]);

  // Don't show loading screen - let pages handle their own loading states

  return (
    <QueryClientProvider client={queryClient}>
      <Component {...pageProps} />
    </QueryClientProvider>
  );
}

export default App;
