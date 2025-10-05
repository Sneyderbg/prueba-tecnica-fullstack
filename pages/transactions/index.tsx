import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NumberInput } from '@/components/ui/number-input';

import { authClient } from '@/lib/auth/client';
import { transactionSchema, TransactionFormData } from '@/lib/schemas';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';

export interface Transaction {
  id: string;
  concepto: string;
  monto: number;
  fecha: string;
  createdAt: string;
  updatedAt: string;
  user: {
    name: string;
    email: string;
  };
}

function Transactions(): JSX.Element {
  const queryClient = useQueryClient();

  // Fetch transactions
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const response = await fetch('/api/transactions');
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      return response.json() as Promise<Transaction[]>;
    },
  });

  // Create transaction mutation
  const createTransactionMutation = useMutation({
    mutationFn: async (data: TransactionFormData) => {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create transaction');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
    onError: (error: unknown) => {
      setErrorMessage((error as Error).message || 'Error');
    },
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { data: session } = authClient.useSession();
  const userRole = (session?.user as { role?: string })?.role || 'user';
  const isAdmin = userRole === 'admin';

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
    watch,
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      concepto: '',
      monto: 0,
      fecha: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
    },
  });

  const totalAmount =
    transactions?.reduce((sum, transaction) => sum + transaction.monto, 0) || 0;

  function onSubmit(data: TransactionFormData) {
    setErrorMessage(null);
    createTransactionMutation.mutate(data, {
      onSuccess: () => {
        reset();
        setIsDialogOpen(false);
        setErrorMessage(null);
      },
    });
  }

  return (
    <AppLayout>
      <div className='space-y-6'>
        <div>
          <h1 className='text-2xl font-bold underline'>Ingresos y Egresos</h1>
        </div>

        <Card className='h-[calc(100vh-200px)] flex flex-col'>
          <CardHeader className='flex flex-row items-center justify-end'>
            {isAdmin && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>Nuevo</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nuevo Movimiento</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
                    <div>
                      <Label htmlFor='concepto'>Concepto</Label>
                      <Input
                        id='concepto'
                        placeholder='Descripción de la transacción'
                        {...register('concepto')}
                      />
                      {errors.concepto && (
                        <p className='text-sm text-red-600 mt-1'>
                          {errors.concepto.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor='monto'>Monto</Label>
                      <NumberInput
                        id='monto'
                        placeholder='0.00'
                        precision={2}
                        value={watch('monto')}
                        onChange={(value) => setValue('monto', value)}
                      />
                      {errors.monto && (
                        <p className='text-sm text-red-600 mt-1'>
                          {errors.monto.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor='fecha'>Fecha</Label>
                      <Input id='fecha' type='date' {...register('fecha')} />
                      {errors.fecha && (
                        <p className='text-sm text-red-600 mt-1'>
                          {errors.fecha.message}
                        </p>
                      )}
                    </div>

                    {errorMessage && (
                      <p className='text-sm text-red-600 mt-1'>
                        {errorMessage}
                      </p>
                    )}

                    <Button
                      type='submit'
                      className='w-full'
                      disabled={createTransactionMutation.isLoading}
                    >
                      {createTransactionMutation.isLoading
                        ? 'Guardando...'
                        : 'Guardar'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </CardHeader>
          <CardContent className='flex flex-col h-full'>
            <div className='flex-1 overflow-y-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Concepto</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Usuario</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className='text-center'>
                        Cargando...
                      </TableCell>
                    </TableRow>
                  ) : transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className='text-center'>
                        No hay transacciones
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>{transaction.concepto}</TableCell>
                        <TableCell className='whitespace-break-spaces'>
                          <span
                            className={
                              'whitespace-break-spaces ' +
                              (transaction.monto >= 0
                                ? 'text-green-600 font-semibold'
                                : 'text-red-600 font-semibold')
                            }
                          >
                            {transaction.monto < 0 ? '-' : ''}$
                            {Math.abs(transaction.monto).toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {new Date(transaction.fecha).toLocaleDateString(
                            'es-ES'
                          )}
                        </TableCell>
                        <TableCell>{transaction.user.name}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <div className='mt-4 pt-4 border-t'>
              <div className='flex justify-between items-center'>
                <span className='font-semibold'>Total:</span>
                <span
                  className={
                    'whitespace-break-spaces font-bold text-lg ' +
                    (totalAmount >= 0
                      ? 'text-green-600 font-semibold'
                      : 'text-red-600 font-semibold')
                  }
                >
                  {totalAmount < 0 ? '-' : ''}$
                  {Math.abs(totalAmount).toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

export default Transactions;
