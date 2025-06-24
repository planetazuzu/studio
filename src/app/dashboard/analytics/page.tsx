
'use client';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { Download, ListFilter, CircleDollarSign, CreditCard, CalendarClock, Scale, CheckSquare, Users, Clock } from 'lucide-react';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip as ChartTooltipProvider,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { costs, courses, users as allUsers, departments, roles } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatCard } from '@/components/stat-card';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/auth';

// --- Cost Data Calculations ---
const spendingByCategory = costs.reduce((acc, cost) => {
  if (!acc[cost.category]) {
    acc[cost.category] = 0;
  }
  acc[cost.category] += cost.amount;
  return acc;
}, {} as Record<string, number>);

const barChartData = Object.keys(spendingByCategory).map(category => ({
  category,
  amount: spendingByCategory[category],
}));

const barChartConfig = {
  amount: {
    label: 'Importe (€)',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

const monthlySpending = costs.reduce((acc, cost) => {
    const date = new Date(cost.date);
    const monthKey = format(date, 'yyyy-MM');
    if (!acc[monthKey]) {
        acc[monthKey] = { amount: 0, month: format(date, 'MMM', { locale: es }) };
    }
    acc[monthKey].amount += cost.amount;
    return acc;
}, {} as Record<string, { amount: number, month: string }>);

const lineChartData = Object.keys(monthlySpending)
    .sort()
    .map(key => ({
        month: monthlySpending[key].month,
        amount: monthlySpending[key].amount
    }));

const lineChartConfig = {
    amount: {
        label: "Importe (€)",
        color: "hsl(var(--chart-2))"
    }
} satisfies ChartConfig;


// --- Training Data Calculations ---
const averageCompletionRate = courses.reduce((acc, course) => acc + course.progress, 0) / courses.length;
const totalTrainingHours = courses.reduce((acc, course) => {
    const hours = parseInt(course.duration);
    return acc + (isNaN(hours) ? 0 : hours);
}, 0);
const activeUsers = allUsers.length;

const departmentProgress = departments.map(dept => ({
    department: dept,
    progress: Math.floor(Math.random() * (95 - 40 + 1) + 40)
}));

const departmentChartConfig = {
  progress: {
    label: 'Progreso (%)',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

const roleProgress = roles
    .filter(r => r !== 'Personal Externo')
    .map(role => ({
        role: role.replace(' ', '\n'),
        progress: Math.floor(Math.random() * (90 - 35 + 1) + 35)
    }));

const roleChartConfig = {
  progress: {
    label: 'Progreso (%)',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig;


const monthlyActivity = courses.reduce((acc, course) => {
    if (!course.startDate) return acc;
    const date = parseISO(course.startDate);
    const monthKey = format(date, 'yyyy-MM');
    if (!acc[monthKey]) {
        acc[monthKey] = { month: format(date, 'MMM', { locale: es }), iniciados: 0, completados: 0 };
    }
    acc[monthKey].iniciados += 1;
    if (course.progress > 99) {
      acc[monthKey].completados += 1;
    }
    return acc;
}, {} as Record<string, { month: string, iniciados: number, completados: number }>);

const activityChartData = Object.keys(monthlyActivity)
  .sort()
  .map(key => monthlyActivity[key]);

const activityChartConfig = {
  iniciados: {
    label: 'Iniciados',
    color: 'hsl(var(--chart-1))',
  },
  completados: {
    label: 'Completados',
    color: 'hsl(var(--chart-3))',
  },
} satisfies ChartConfig;


export default function AnalyticsPage() {
  const { user } = useAuth();
  const router = useRouter();

  if (!user) return null;

  if (!['Gestor de RRHH', 'Jefe de Formación', 'Administrador General'].includes(user.role)) {
    router.push('/dashboard');
    return null;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Análisis y Reportes</h1>
          <p className="text-muted-foreground">Visualiza métricas clave de formación, costes y rendimiento.</p>
        </div>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Exportar Informe
        </Button>
      </div>

      <Tabs defaultValue="training" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-sm">
            <TabsTrigger value="training">Resumen de Formación</TabsTrigger>
            <TabsTrigger value="costs">Análisis de Costes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="training" className="mt-6 space-y-8">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <StatCard title="Tasa de Finalización Media" value={`${averageCompletionRate.toFixed(0)}%`} icon={CheckSquare} description="En todos los cursos" />
                <StatCard title="Horas de Formación Totales" value={`${totalTrainingHours}`} icon={Clock} description="Programadas en el catálogo" />
                <StatCard title="Usuarios Activos" value={activeUsers.toString()} icon={Users} description="En la plataforma" />
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle>Ranking de Progreso por Departamento</CardTitle>
                        <CardDescription>Tasa de finalización media por departamento.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={departmentChartConfig} className="h-96 w-full">
                            <ResponsiveContainer>
                                <BarChart data={departmentProgress} layout="vertical" margin={{ left: 20 }}>
                                    <CartesianGrid horizontal={false} />
                                    <YAxis dataKey="department" type="category" tickLine={false} axisLine={false} tickMargin={10} width={150} />
                                    <XAxis type="number" dataKey="progress" domain={[0, 100]} unit="%"/>
                                    <ChartTooltipProvider cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                                    <Bar dataKey="progress" fill="var(--color-progress)" radius={4} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </CardContent>
                </Card>
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle>Ranking de Progreso por Rol</CardTitle>
                        <CardDescription>Tasa de finalización media de los usuarios por rol.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={roleChartConfig} className="h-96 w-full">
                            <ResponsiveContainer>
                                <BarChart data={roleProgress} margin={{ left: 0, right: 20, bottom: 60 }}>
                                    <CartesianGrid vertical={false} />
                                    <XAxis dataKey="role" type="category" tickLine={false} axisLine={false} tickMargin={10} angle={-45} textAnchor="end" interval={0} />
                                    <YAxis type="number" domain={[0, 100]} unit="%"/>
                                    <ChartTooltipProvider cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                                    <Bar dataKey="progress" fill="var(--color-progress)" radius={4} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>

            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Histograma de Actividad Formativa</CardTitle>
                    <CardDescription>Cursos iniciados y completados mensualmente.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={activityChartConfig} className="h-80 w-full">
                        <ResponsiveContainer>
                            <LineChart data={activityChartData} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                                <CartesianGrid vertical={false} />
                                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                                <YAxis />
                                <ChartTooltipProvider content={<ChartTooltipContent />} />
                                <Line name="Iniciados" dataKey="iniciados" type="monotone" stroke="var(--color-iniciados)" strokeWidth={2} dot={{ fill: "var(--color-iniciados)" }} activeDot={{ r: 8 }} />
                                <Line name="Completados" dataKey="completados" type="monotone" stroke="var(--color-completados)" strokeWidth={2} dot={{ fill: "var(--color-completados)" }} activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </CardContent>
            </Card>

        </TabsContent>

        <TabsContent value="costs" className="mt-6 space-y-8">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Presupuesto Anual" value="25,000€" icon={CircleDollarSign} className="bg-green-500/10 border-green-500" />
                <StatCard title="Gasto Total" value="8,950€" icon={CreditCard} className="bg-red-500/10 border-red-500" />
                <StatCard title="Gasto (Últ. 30 días)" value="1,550€" icon={CalendarClock} className="bg-yellow-500/10 border-yellow-500" />
                <StatCard title="Presupuesto Restante" value="16,050€" icon={Scale} className="bg-blue-500/10 border-blue-500" />
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
                <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Gasto por Categoría</CardTitle>
                    <CardDescription>Distribución de los costes de formación.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={barChartConfig} className="h-64 w-full">
                    <ResponsiveContainer>
                        <BarChart data={barChartData} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="category" tickLine={false} tickMargin={10} axisLine={false} />
                        <YAxis unit="€" />
                        <ChartTooltipProvider content={<ChartTooltipContent />} />
                        <Bar dataKey="amount" fill="var(--color-amount)" radius={4} />
                        </BarChart>
                    </ResponsiveContainer>
                    </ChartContainer>
                </CardContent>
                </Card>
                <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Gasto Mensual</CardTitle>
                    <CardDescription>Evolución de los costes a lo largo del tiempo.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={lineChartConfig} className="h-64 w-full">
                    <ResponsiveContainer>
                        <LineChart data={lineChartData} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                            <CartesianGrid vertical={false} />
                            <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                            <YAxis unit="€" />
                            <ChartTooltipProvider cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                            <Line dataKey="amount" type="monotone" stroke="var(--color-amount)" strokeWidth={2} dot={{ fill: "var(--color-amount)"}} activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                    </ChartContainer>
                </CardContent>
                </Card>
            </div>

            <Card className="shadow-lg">
                <CardHeader className="flex flex-row items-center">
                    <div className="grid gap-2">
                        <CardTitle>Transacciones Recientes</CardTitle>
                        <CardDescription>Listado de los últimos gastos registrados.</CardDescription>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-7 gap-1 text-sm">
                                    <ListFilter className="h-3.5 w-3.5" />
                                    <span className="sr-only sm:not-sr-only">Filtrar</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Filtrar por categoría</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuCheckboxItem checked>Formadores</DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem>Plataforma</DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem>Equipamiento</DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem>Logística</DropdownMenuCheckboxItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardHeader>
                <CardContent>
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Concepto</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead className="text-right">Importe</TableHead>
                        <TableHead>Fecha</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {costs.map((cost) => (
                        <TableRow key={cost.id}>
                        <TableCell className="font-medium">{cost.item}</TableCell>
                        <TableCell>{cost.category}</TableCell>
                        <TableCell className="text-right">{cost.amount.toFixed(2)}€</TableCell>
                        <TableCell>{new Date(cost.date).toLocaleDateString()}</TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
