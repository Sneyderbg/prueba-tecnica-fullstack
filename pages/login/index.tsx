import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { LoginForm } from '@/components/login-form';
import { authClient } from '@/lib/auth/client';

function Page() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (session) {
      router.push('/');
    }
  }, [session, router]);

  return (
    <div className='flex min-h-svh w-full items-center justify-center p-6'>
      <div className='w-full max-w-sm'>
        <LoginForm isLoading={isPending} />
      </div>
    </div>
  );
}

export default Page;
