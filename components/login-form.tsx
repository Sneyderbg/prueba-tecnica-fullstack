import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { authClient, getErrorMessage } from '@/lib/auth/client';
import { loginSchema, type LoginFormData } from '@/lib/schemas';

interface LoginFormProps extends React.ComponentPropsWithoutRef<'div'> {
  isLoading?: boolean;
}

function LoginForm({ className, isLoading = false, ...props }: LoginFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [isGithubLoading, setIsGithubLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  return (
    <div className={cn('flex flex-col gap-6 relative', className)} {...props}>
      {isLoading && (
        <div className='absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2'></div>
            <p className='text-sm text-gray-600'>Verificando sesión...</p>
          </div>
        </div>
      )}
      <Card>
        <CardHeader>
          <div className='flex items-center gap-2 mb-4'>
            <div className='flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg'>
              <span className='text-green-600 font-bold text-lg'>$</span>
            </div>
            <span className='text-xl font-semibold'>FinApp</span>
          </div>
          <CardTitle className='text-2xl'>Iniciar Sesión</CardTitle>
          <CardDescription>
            Introduce tu correo electrónico a continuación para iniciar sesión
            en tu cuenta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit(async (data) => {
              setError(null);
              setIsLoginLoading(true);

              const { error } = await authClient.signIn.email({
                email: data.email,
                password: data.password,
                callbackURL: '/',
              });

              if (error?.code) {
                const translatedMessage = getErrorMessage(error.code, 'es');
                setError(
                  translatedMessage || error.message || 'Ha ocurrido un error'
                );
              } else if (error?.message) {
                setError(error.message);
              }

              setIsLoginLoading(false);
            })}
          >
            <div className='flex flex-col gap-6'>
              <div className='grid gap-2'>
                <Label htmlFor='email'>Correo Electrónico</Label>
                <Input
                  id='email'
                  type='email'
                  placeholder='m@example.com'
                  {...register('email')}
                />
                {errors.email && (
                  <p className='text-red-500 text-sm'>{errors.email.message}</p>
                )}
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='password'>Contraseña</Label>
                <Input
                  id='password'
                  type='password'
                  autoComplete='current-password'
                  {...register('password')}
                />
                {errors.password && (
                  <p className='text-red-500 text-sm'>
                    {errors.password.message}
                  </p>
                )}
              </div>
              {error && <p className='text-red-500 text-sm mt-2'>{error}</p>}
              <Button
                type='submit'
                className='w-full'
                disabled={isLoginLoading || isGithubLoading}
              >
                {isLoginLoading ? (
                  <>
                    <div className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
                    Iniciando Sesión...
                  </>
                ) : (
                  'Iniciar Sesión'
                )}
              </Button>
              <Button
                type='button'
                variant='outline'
                className='w-full'
                disabled={isGithubLoading}
                onClick={async () => {
                  setIsGithubLoading(true);
                  const { error } = await authClient.signIn.social({
                    provider: 'github',
                    callbackURL: '/',
                  });
                  if (error?.code) {
                    const translatedMessage = getErrorMessage(error.code, 'es');
                    setError(
                      translatedMessage ||
                        error.message ||
                        'Ha ocurrido un error'
                    );
                  } else if (error?.message) {
                    setError(error.message);
                  }
                  setIsGithubLoading(false);
                }}
              >
                {isGithubLoading ? (
                  <>
                    <div className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
                    Conectando...
                  </>
                ) : (
                  'Iniciar Sesión con Github'
                )}
              </Button>
            </div>
            <div className='mt-4 text-center text-sm'>
              ¿No tienes una cuenta?{' '}
              <Link href='/signup' className='underline underline-offset-4'>
                Registrarse
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export { LoginForm };
