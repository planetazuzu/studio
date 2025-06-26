
'use client';
import { useRouter } from 'next/navigation';
import { useMemo, useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import { Download, ListFilter, CircleDollarSign, CreditCard, CalendarClock, Scale, CheckSquare, Users, Clock, Loader2, FilePenLine, UserCheck, ShieldCheck } from 'lucide-react';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip as ChartTooltipProvider,
  ChartTooltipContent,
} from '@/components/ui/chart';
import * as db from '@/lib/db';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/auth';
import type { ComplianceReportData } from '@/lib/types';
import { Progress } from '@/components/ui/progress';


function ComplianceReportTable({ data }: { data: ComplianceReportData[] }) {
    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>Informe de Cumplimiento de Formación Obligatoria</CardTitle>
                <CardDescription>Estado de la formación obligatoria para cada usuario según su rol.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Usuario</TableHead>
                            <TableHead>Rol</TableHead>
                            <TableHead>Cursos Obligatorios</TableHead>
                            <TableHead>Cursos Completados</TableHead>
                            <TableHead className="w-[200px]">Tasa de Cumplimiento</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map(item => (
                            <TableRow key={item.userId}>
                                <TableCell className="font-medium">{item.userName}</TableCell>
                                <TableCell>{item.userRole}</TableCell>
                                <TableCell className="text-center">{item.mandatoryCoursesCount}</TableCell>
                                <TableCell className="text-center">{item.completedCoursesCount}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Progress value={item.complianceRate} className="h-2" />
                                        <span className="text-xs font-semibold">{item.complianceRate.toFixed(0)}%</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}


export default function AnalyticsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  // --- Data Fetching ---
  const allCourses = useLiveQuery(() => db.getAllCourses(), []);
  const allUsers = useLiveQuery(() => db.getAllUsers(), []);
  const allProgress = useLiveQuery(() => db.db.userProgress.toArray(), []);
  const allEnrollments = useLiveQuery(() => db.db.enrollments.toArray(), []);
  const complianceData = useLiveQuery(() => db.getComplianceReportData(), []);


  // --- Cost Data Calculations ---
  const allCostCategories = [...new Set(costs.map((cost) => cost.category))];
  const [categoryFilters, setCategoryFilters] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(allCostCategories.map((cat) => [cat, true]))
  );

  const handleCategoryFilterChange = (category: string, checked: boolean) => {
    setCategoryFilters((prev) => ({ ...prev, [category]: checked }));
  };
  
  const filteredCosts = costs.filter((cost) => categoryFilters[cost.category]);

  const spendingByCategory = useMemo(() => costs.reduce((acc, cost) => {
    if (!acc[cost.category]) {
      acc[cost.category] = 0;
    }
    acc[cost.category] += cost.amount;
    return acc;
  }, {} as Record<string, number>), [costs]);

  const barChartData = useMemo(() => Object.keys(spendingByCategory).map(category => ({
    category,
    amount: spendingByCategory[category],
  })), [spendingByCategory]);

  const barChartConfig = {
    amount: { label: 'Importe (€)', color: 'hsl(var(--chart-1))' },
  } satisfies ChartConfig;

  const monthlySpending = useMemo(() => costs.reduce((acc, cost) => {
      const date = new Date(cost.date);
      const monthKey = format(date, 'yyyy-MM');
      if (!acc[monthKey]) {
          acc[monthKey] = { amount: 0, month: format(date, 'MMM', { locale: es }) };
      }
      acc[monthKey].amount += cost.amount;
      return acc;
  }, {} as Record<string, { amount: number, month: string }>), [costs]);

  const lineChartData = useMemo(() => Object.keys(monthlySpending)
      .sort()
      .map(key => ({
          month: monthlySpending[key].month,
          amount: monthlySpending[key].amount
      })), [monthlySpending]);

  const lineChartConfig = {
      amount: { label: "Importe (€)", color: "hsl(var(--chart-2))" },
  } satisfies ChartConfig;
  
  const costByCourse = useMemo(() => {
    if (!allCourses) return [];

    const courseMap = new Map(allCourses.map(c => [c.id, c.title]));
    
    const costsGroupedByCourse = costs.reduce((acc, cost) => {
        if (cost.courseId) {
            if (!acc[cost.courseId]) {
                acc[cost.courseId] = 0;
            }
            acc[cost.courseId] += cost.amount;
        }
        return acc;
    }, {} as Record<string, number>);

    return Object.entries(costsGroupedByCourse).map(([courseId, totalCost]) => ({
        courseId,
        courseTitle: courseMap.get(courseId) || 'Curso Desconocido',
        totalCost,
    })).sort((a,b) => b.totalCost - a.totalCost);

  }, [allCourses]);


  // --- Training Data Calculations ---
  const trainingData = useMemo(() => {
    if (!allCourses || !allUsers || !allProgress || !allEnrollments) {
        return null;
    }

    const courseModuleCounts = new Map(allCourses.map(c => [c.id, c.modules?.length || 0]));

    // --- Stat Cards Data ---
    const individualProgressPercentages = allProgress.map(p => {
        const totalModules = courseModuleCounts.get(p.courseId) || 0;
        return totalModules > 0 ? (p.completedModules.length / totalModules) * 100 : 0;
    });
    const averageCompletionRate = individualProgressPercentages.length > 0
        ? individualProgressPercentages.reduce((a, b) => a + b, 0) / individualProgressPercentages.length
        : 0;
    
    const totalTrainingHours = allCourses.reduce((acc, course) => {
        const hours = parseInt(course.duration) || 0;
        return acc + hours;
    }, 0);
    
    const activeUsers = allUsers.length;

    // --- Department Progress ---
    const progressByDepartment: Record<string, { totalProgress: number; count: number; }> = {};
    const allDepartments = [...new Set(allUsers.map(u => u.department))];
    allDepartments.forEach(dept => {
        progressByDepartment[dept] = { totalProgress: 0, count: 0 };
    });

    for (const progress of allProgress) {
        const user = allUsers.find(u => u.id === progress.userId);
        if (user) {
            const totalModules = courseModuleCounts.get(progress.courseId) || 0;
            if (totalModules > 0) {
                const percentage = (progress.completedModules.length / totalModules) * 100;
                 if (progressByDepartment[user.department]) {
                    progressByDepartment[user.department].totalProgress += percentage;
                    progressByDepartment[user.department].count += 1;
                }
            }
        }
    }
    const departmentProgress = Object.entries(progressByDepartment).map(([department, data]) => ({
        department,
        progress: data.count > 0 ? Math.round(data.totalProgress / data.count) : 0,
    })).sort((a, b) => b.progress - a.progress);


    // --- Role Progress ---
    const progressByRole: Record<string, { totalProgress: number; count: number; }> = {};
    const allRoles = [...new Set(allUsers.map(u => u.role))];
    allRoles.forEach(role => {
        progressByRole[role] = { totalProgress: 0, count: 0 };
    });

    for (const progress of allProgress) {
        const user = allUsers.find(u => u.id === progress.userId);
        if (user) {
            const totalModules = courseModuleCounts.get(progress.courseId) || 0;
            if (totalModules > 0) {
                const percentage = (progress.completedModules.length / totalModules) * 100;
                 if (progressByRole[user.role]) {
                    progressByRole[user.role].totalProgress += percentage;
                    progressByRole[user.role].count += 1;
                }
            }
        }
    }
    const roleProgress = Object.entries(progressByRole)
        .filter(([role, data]) => role !== 'Personal Externo')
        .map(([role, data]) => ({
            role: role.replace(' ', '\n'),
            progress: data.count > 0 ? Math.round(data.totalProgress / data.count) : 0,
    })).sort((a, b) => b.progress - a.progress);


    // --- Monthly Activity ---
    const monthlyActivity: Record<string, { month: string; iniciados: number; completados: number }> = {};
    
    // Process enrollments for "iniciados"
    allEnrollments.filter(e => e.status === 'approved').forEach(enrollment => {
        const date = enrollment.updatedAt ? parseISO(enrollment.updatedAt) : new Date();
        const monthKey = format(date, 'yyyy-MM');
        if (!monthlyActivity[monthKey]) {
            monthlyActivity[monthKey] = { month: format(date, 'MMM', { locale: es }), iniciados: 0, completados: 0 };
        }
        monthlyActivity[monthKey].iniciados += 1;
    });

    // Process progress for "completados"
    allProgress.forEach(progress => {
        const totalModules = courseModuleCounts.get(progress.courseId) || 0;
        if (totalModules > 0 && progress.completedModules.length === totalModules) {
            const date = progress.updatedAt ? parseISO(progress.updatedAt) : new Date();
            const monthKey = format(date, 'yyyy-MM');
             if (!monthlyActivity[monthKey]) {
                monthlyActivity[monthKey] = { month: format(date, 'MMM', { locale: es }), iniciados: 0, completados: 0 };
            }
            monthlyActivity[monthKey].completados += 1;
        }
    });
    
    const activityChartData = Object.keys(monthlyActivity)
      .sort()
      .map(key => monthlyActivity[key]);

    return {
        averageCompletionRate,
        totalTrainingHours,
        activeUsers,
        departmentProgress,
        roleProgress,
        activityChartData,
    };
  }, [allCourses, allUsers, allProgress, allEnrollments]);
  
  const handleExport = async () => {
    if (!reportRef.current) return;
    
    setIsExporting(true);
    try {
      // Temporarily set a specific background color for the capture
      const originalBg = reportRef.current.style.backgroundColor;
      reportRef.current.style.backgroundColor = 'white';
      
      const canvas = await html2canvas(reportRef.current, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
      });

      // Restore original background
      reportRef.current.style.backgroundColor = originalBg;
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'px',
        format: [canvas.width, canvas.height],
        hotfixes: ['px_scaling'],
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save('Informe_Analiticas.pdf');

    } catch (error) {
      console.error("Error generating PDF", error);
    } finally {
      setIsExporting(false);
    }
  };


  if (!user) return null;

  if (!['Gestor de RRHH', 'Jefe de Formación', 'Administrador General'].includes(user.role)) {
    router.push('/dashboard');
    return null;
  }

  if (!trainingData || complianceData === undefined) {
      return (
        <div className="flex h-[80vh] items-center justify-center">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
      );
  }

  const departmentChartConfig = {
    progress: { label: 'Progreso (%)', color: 'hsl(var(--chart-1))' },
  } satisfies ChartConfig;

  const roleChartConfig = {
    progress: { label: 'Progreso (%)', color: 'hsl(var(--chart-2))' },
  } satisfies ChartConfig;
  
  const activityChartConfig = {
    iniciados: { label: 'Iniciados', color: 'hsl(var(--chart-1))' },
    completados: { label: 'Completados', color: 'hsl(var(--chart-3))' },
  } satisfies ChartConfig;


  return (
    <div className="space-y-8" ref={reportRef}>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Análisis y Reportes</h1>
          <p className="text-muted-foreground">Visualiza métricas clave de formación, costes y rendimiento.</p>
        </div>
        <Button onClick={handleExport} disabled={isExporting}>
           {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
           {isExporting ? 'Exportando...' : 'Exportar Informe'}
        </Button>
      </div>

      <Tabs defaultValue="training" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-lg">
            <TabsTrigger value="training">Resumen de Formación</TabsTrigger>
            <TabsTrigger value="compliance"><ShieldCheck className="mr-2 h-4 w-4" />Cumplimiento</TabsTrigger>
            <TabsTrigger value="costs">Análisis de Costes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="training" className="mt-6 space-y-8">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <StatCard title="Tasa de Finalización Media" value={`${trainingData.averageCompletionRate.toFixed(0)}%`} icon={CheckSquare} description="En todos los cursos" />
                <StatCard title="Horas de Formación Totales" value={`${trainingData.totalTrainingHours}`} icon={Clock} description="Programadas en el catálogo" />
                <StatCard title="Usuarios Activos" value={trainingData.activeUsers.toString()} icon={Users} description="En la plataforma" />
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
                                <BarChart data={trainingData.departmentProgress} layout="vertical" margin={{ left: 20 }}>
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
                                <BarChart data={trainingData.roleProgress} margin={{ left: 0, right: 20, bottom: 60 }}>
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
                            <LineChart data={trainingData.activityChartData} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
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

        <TabsContent value="compliance" className="mt-6 space-y-8">
            <ComplianceReportTable data={complianceData} />
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
                <CardHeader>
                    <CardTitle>Desglose de Costes por Curso</CardTitle>
                    <CardDescription>Costes directos asociados a cada formación.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Curso</TableHead>
                                <TableHead className="text-right">Coste Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {costByCourse.map(item => (
                                <TableRow key={item.courseId}>
                                    <TableCell className="font-medium">{item.courseTitle}</TableCell>
                                    <TableCell className="text-right">{item.totalCost.toFixed(2)}€</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>


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
                                {allCostCategories.map((category) => (
                                    <DropdownMenuCheckboxItem
                                        key={category}
                                        checked={categoryFilters[category] ?? true}
                                        onCheckedChange={(checked) => handleCategoryFilterChange(category, !!checked)}
                                    >
                                        {category}
                                    </DropdownMenuCheckboxItem>
                                ))}
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
                    {filteredCosts.map((cost) => (
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
