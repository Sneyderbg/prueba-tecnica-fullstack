import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { authClient } from '@/lib/auth/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import Papa from 'papaparse';
import { useState } from 'react';
import { useQuery } from 'react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts';

export interface Transaction {
  id: string;
  concepto: string;
  monto: number;
  fecha: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  user: {
    name: string;
    email: string;
  };
}

function Reports() {
  const { data: session, isPending } = authClient.useSession();
  const userRole = (session?.user as { role?: string })?.role || 'user';
  const isAdmin = userRole === 'admin';

  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
  ); // 1 year ago
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());

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
    enabled: isAdmin && !isPending,
  });

  if (isPending) {
    return (
      <AppLayout>
        <div className='flex items-center justify-center h-64'>
          <p className='text-lg text-muted-foreground'>Cargando...</p>
        </div>
      </AppLayout>
    );
  }

  if (!isAdmin) {
    return (
      <AppLayout>
        <div className='flex items-center justify-center h-64'>
          <p className='text-lg text-muted-foreground'>
            Acceso denegado. Solo administradores pueden ver reportes.
          </p>
        </div>
      </AppLayout>
    );
  }

  // Filter transactions by date range
  const filteredTransactions = transactions.filter((t) => {
    const date = new Date(t.fecha);
    return (!startDate || date >= startDate) && (!endDate || date <= endDate);
  });

  // Calculate current balance
  const currentBalance = transactions.reduce(
    (sum, transaction) => sum + transaction.monto,
    0
  );

  // Prepare bar chart data: total movement per day
  const dailyMovements: { [key: string]: number } = {};
  filteredTransactions.forEach((t) => {
    const date = new Date(t.fecha).toISOString().split('T')[0];
    dailyMovements[date] = (dailyMovements[date] || 0) + t.monto;
  });
  const barChartData = Object.entries(dailyMovements)
    .map(([date, total]) => ({
      date: format(new Date(date), 'dd/MM/yyyy', { locale: es }),
      total,
      color: total >= 0 ? '#22c55e' : '#ef4444',
    }))
    .sort(
      (a, b) =>
        new Date(a.date.split('/').reverse().join('-')).getTime() -
        new Date(b.date.split('/').reverse().join('-')).getTime()
    );

  const barChartConfig = {
    total: {
      label: 'Movimiento Total',
      color: 'hsl(var(--chart-1))',
    },
  };

  // Prepare pie chart data: income vs expenses
  const income = filteredTransactions
    .filter((t) => t.monto > 0)
    .reduce((sum, t) => sum + t.monto, 0);
  const expenses = Math.abs(
    filteredTransactions
      .filter((t) => t.monto < 0)
      .reduce((sum, t) => sum + t.monto, 0)
  );
  const pieChartData = [
    { name: 'Ingresos', value: income, color: '#22c55e' },
    { name: 'Egresos', value: expenses, color: '#ef4444' },
  ];

  const pieChartConfig = {
    ingresos: {
      label: 'Ingresos',
      color: '#22c55e',
    },
    egresos: {
      label: 'Egresos',
      color: '#ef4444',
    },
  };

  // CSV export for bar chart
  const exportBarChartCSV = () => {
    const csv = Papa.unparse(barChartData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'movimientos-diarios.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV export for pie chart
  const exportPieChartCSV = () => {
    const csv = Papa.unparse(
      pieChartData.map((d) => ({
        Categoria: d.name,
        Monto: d.name === 'Ingresos' ? d.value : -d.value,
      }))
    );
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'ingresos-egresos.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AppLayout>
      <div className='space-y-6'>
        <div>
          <h1 className='text-2xl font-bold underline'>Reportes</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Saldo Actual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold'>
              <span
                className={
                  currentBalance >= 0 ? 'text-green-600' : 'text-red-600'
                }
              >
                {currentBalance < 0 ? '-' : ''}$
                {Math.abs(currentBalance).toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <CalendarIcon className='h-5 w-5' />
              Rango de Fechas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex flex-col sm:flex-row gap-4'>
              <div>
                <Label className='block text-sm font-medium mb-2'>
                  Fecha Inicio
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant='outline'
                      className='justify-start text-left font-normal h-10 min-w-[200px]'
                    >
                      <CalendarIcon className='mr-2 h-4 w-4' />
                      {startDate
                        ? format(startDate, 'PPP', { locale: es })
                        : 'Seleccionar fecha'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className='w-auto p-0'>
                    <Calendar
                      mode='single'
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label className='block text-sm font-medium mb-2'>
                  Fecha Fin
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant='outline'
                      className='justify-start text-left font-normal h-10 min-w-[200px]'
                    >
                      <CalendarIcon className='mr-2 h-4 w-4' />
                      {endDate
                        ? format(endDate, 'PPP', { locale: es })
                        : 'Seleccionar fecha'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className='w-auto p-0'>
                    <Calendar
                      mode='single'
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between'>
              <CardTitle>Movimientos Diarios</CardTitle>
              <Button onClick={exportBarChartCSV} size='sm'>
                Exportar CSV
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className='flex items-center justify-center h-64'>
                  <p>Cargando...</p>
                </div>
              ) : barChartData.length === 0 ? (
                <div className='flex items-center justify-center h-64'>
                  <p>No hay datos para mostrar</p>
                </div>
              ) : (
                <ChartContainer config={barChartConfig} className='h-64'>
                  <BarChart data={barChartData}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='date' />
                    <YAxis />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value) => [`$${value}`, '']}
                        />
                      }
                    />
                    <Bar dataKey='total'>
                      {barChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between'>
              <CardTitle>Ingresos vs Egresos</CardTitle>
              <Button onClick={exportPieChartCSV} size='sm'>
                Exportar CSV
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className='flex items-center justify-center h-64'>
                  <p>Cargando...</p>
                </div>
              ) : pieChartData.every((d) => d.value === 0) ? (
                <div className='flex items-center justify-center h-64'>
                  <p>No hay datos para mostrar</p>
                </div>
              ) : (
                <ChartContainer config={pieChartConfig} className='h-64'>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx='50%'
                      cy='50%'
                      outerRadius={80}
                      dataKey='value'
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value) => [`$${value}`, '']}
                        />
                      }
                    />
                  </PieChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}

export default Reports;
