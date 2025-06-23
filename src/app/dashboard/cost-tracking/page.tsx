'use client';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Download, File, ListFilter } from 'lucide-react';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip as ChartTooltipProvider,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { costs } from '@/lib/data';
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
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

const monthlySpending = costs.reduce((acc, cost) => {
    const month = new Date(cost.date).toLocaleString('default', { month: 'short' });
    if (!acc[month]) {
        acc[month] = 0;
    }
    acc[month] += cost.amount;
    return acc;
}, {} as Record<string, number>);

const lineChartData = Object.keys(monthlySpending)
    .sort((a,b) => new Date(`1 ${a} 2024`) > new Date(`1 ${b} 2024`) ? 1 : -1)
    .map(month => ({
        month,
        amount: monthlySpending[month]
    }));

const lineChartConfig = {
    amount: {
        label: "Importe (€)",
        color: "hsl(var(--accent))"
    }
} satisfies ChartConfig;


export default function CostTrackingPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Control de Costes</h1>
          <p className="text-muted-foreground">Analiza y gestiona el presupuesto de formación.</p>
        </div>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Exportar Informe
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Presupuesto Anual" value="15,000€" icon={File} className="bg-green-500/10 border-green-500" />
        <StatCard title="Gasto Total" value="8,950€" icon={File} className="bg-red-500/10 border-red-500" />
        <StatCard title="Gasto (Últ. 30 días)" value="3,400€" icon={File} className="bg-yellow-500/10 border-yellow-500" />
        <StatCard title="Presupuesto Restante" value="6,050€" icon={File} className="bg-blue-500/10 border-blue-500" />
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
                  <YAxis />
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
                    <YAxis />
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
                        <DropdownMenuCheckboxItem checked>Instructor</DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem>Platform</DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem>Materials</DropdownMenuCheckboxItem>
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
    </div>
  );
}
