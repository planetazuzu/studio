
'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { PlusCircle, Trash2, FilePenLine, Loader2, List, Download } from 'lucide-react';
import * as db from '@/lib/db';
import type { Cost, Course, CustomCostCategory } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';


const costSchema = z.object({
    item: z.string().min(3, "El concepto debe tener al menos 3 caracteres."),
    category: z.string().min(1, "Debes seleccionar una categoría."),
    amount: z.coerce.number().positive("El importe debe ser un número positivo."),
    date: z.string().refine(val => !isNaN(Date.parse(val)), { message: "La fecha es obligatoria."}),
    courseId: z.string().optional(),
});

type CostFormValues = z.infer<typeof costSchema>;

function CostDialog({
    open,
    onOpenChange,
    cost,
    courses,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    cost: Cost | null;
    courses: Course[];
}) {
    const { toast } = useToast();
    const costCategories = useLiveQuery(() => db.getAllCostCategories(), []);

    const form = useForm<CostFormValues>({
        resolver: zodResolver(costSchema),
        defaultValues: {
            item: cost?.item || '',
            category: cost?.category,
            amount: cost?.amount || 0,
            date: cost ? format(new Date(cost.date), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
            courseId: cost?.courseId || '',
        }
    });

    const onSubmit = async (data: CostFormValues) => {
        try {
            const payload: Omit<Cost, 'id'> = {
                ...data,
                courseId: data.courseId || undefined,
            };

            if (cost?.id) {
                await db.updateCost(cost.id, payload);
                toast({ title: "Gasto actualizado" });
            } else {
                await db.addCost(payload);
                toast({ title: "Gasto añadido" });
            }
            onOpenChange(false);
            form.reset();
        } catch (error) {
            console.error("Failed to save cost", error);
            toast({ title: "Error", description: "No se pudo guardar el gasto.", variant: "destructive" });
        }
    };
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader><DialogTitle>{cost ? 'Editar' : 'Añadir'} Gasto</DialogTitle></DialogHeader>
                <Form {...form}>
                    <form id="cost-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField control={form.control} name="item" render={({ field }) => (<FormItem><FormLabel>Concepto</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <div className="grid grid-cols-2 gap-4">
                             <FormField control={form.control} name="category" render={({ field }) => (<FormItem><FormLabel>Categoría</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{costCategories?.map(c => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                             <FormField control={form.control} name="amount" render={({ field }) => (<FormItem><FormLabel>Importe (€)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="date" render={({ field }) => (<FormItem><FormLabel>Fecha</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                             <FormField control={form.control} name="courseId" render={({ field }) => (<FormItem><FormLabel>Curso Asociado (Opcional)</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Ninguno"/></SelectTrigger></FormControl><SelectContent>{courses.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                        </div>
                    </form>
                </Form>
                 <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                    <Button type="submit" form="cost-form" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Guardar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function CategoryManager() {
    const { toast } = useToast();
    const categories = useLiveQuery(() => db.getAllCostCategories(), []);
    const [newCategory, setNewCategory] = useState('');
    const [categoryToDelete, setCategoryToDelete] = useState<CustomCostCategory | null>(null);

    const handleAddCategory = async () => {
        if (!newCategory.trim()) return;
        try {
            await db.addCostCategory({ name: newCategory.trim() });
            toast({ title: 'Categoría añadida' });
            setNewCategory('');
        } catch (error: any) {
            if (error.name === 'ConstraintError') {
                toast({ title: 'Error', description: 'Esa categoría ya existe.', variant: 'destructive' });
            } else {
                console.error(error);
                toast({ title: 'Error', description: 'No se pudo añadir la categoría.', variant: 'destructive' });
            }
        }
    };
    
    const handleDeleteCategory = async () => {
        if (!categoryToDelete?.id) return;
        try {
            await db.deleteCostCategory(categoryToDelete.id);
            toast({ title: 'Categoría eliminada' });
        } catch (error) {
             toast({ title: 'Error', description: 'No se pudo eliminar la categoría.', variant: 'destructive' });
        } finally {
            setCategoryToDelete(null);
        }
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><List /> Gestionar Categorías</CardTitle>
                <CardDescription>Añade o elimina categorías de costes para toda la aplicación.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex gap-2">
                        <Input 
                            placeholder="Nombre de la nueva categoría"
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                        />
                        <Button onClick={handleAddCategory}>Añadir</Button>
                    </div>
                    <div className="border rounded-lg p-2 space-y-1 max-h-48 overflow-y-auto">
                        {categories?.map(cat => (
                            <div key={cat.id} className="flex items-center justify-between p-1.5 hover:bg-muted/50 rounded-md">
                                <span className="text-sm">{cat.name}</span>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setCategoryToDelete(cat)}>
                                        <Trash2 className="h-4 w-4"/>
                                    </Button>
                                </AlertDialogTrigger>
                            </div>
                        ))}
                    </div>
                </div>
                 <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Se eliminará la categoría "{categoryToDelete?.name}". Esto no afectará a los gastos ya existentes con esta categoría.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setCategoryToDelete(null)}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteCategory} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </CardContent>
        </Card>
    );
}

export default function CostsPage() {
    const { toast } = useToast();
    const costs = useLiveQuery(() => db.getAllCosts(), []);
    const courses = useLiveQuery(() => db.getAllCourses(), []);
    
    const [itemToEdit, setItemToEdit] = useState<Cost | null>(null);
    const [itemToDelete, setItemToDelete] = useState<Cost | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const courseMap = courses ? new Map(courses.map(c => [c.id, c.title])) : new Map();

    const handleEdit = (cost: Cost) => {
        setItemToEdit(cost);
        setIsDialogOpen(true);
    };

    const handleDelete = async () => {
        if (!itemToDelete?.id) return;
        try {
            await db.deleteCost(itemToDelete.id);
            toast({ title: 'Gasto eliminado' });
        } catch (error) {
            console.error(error);
            toast({ title: 'Error', description: 'No se pudo eliminar el gasto.', variant: 'destructive' });
        } finally {
            setItemToDelete(null);
        }
    };
    
    const downloadCsv = (data: any[], filename: string) => {
        if (!data || data.length === 0) return;
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row =>
                headers.map(header => {
                    let cell = row[header] === null || row[header] === undefined ? '' : String(row[header]);
                    cell = cell.replace(/"/g, '""');
                    if (cell.search(/("|,|\n)/g) >= 0) cell = `"${cell}"`;
                    return cell;
                }).join(',')
            )
        ].join('\n');

        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportCsv = () => {
        if (!costs) return;
        const dataToExport = costs.map(cost => ({
            Concepto: cost.item,
            Categoria: cost.category,
            Importe: cost.amount,
            Fecha: format(new Date(cost.date), 'dd/MM/yyyy'),
            Curso_Asociado: cost.courseId ? courseMap.get(cost.courseId) || 'N/A' : '-',
        }));
        downloadCsv(dataToExport, 'historial_de_gastos.csv');
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Gestión de Costes</h1>
                    <p className="text-muted-foreground">Registra y supervisa todos los gastos relacionados con la formación.</p>
                </div>
                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Exportar</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={handleExportCsv}>
                                Exportar a CSV
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button onClick={() => { setItemToEdit(null); setIsDialogOpen(true); }}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Añadir Gasto
                    </Button>
                </div>
            </div>

            <AlertDialog>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Historial de Gastos</CardTitle>
                                <CardDescription>Lista de todas las transacciones de costes registradas.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {!costs ? (
                                    <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                                ) : costs.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground"><p>No hay gastos registrados todavía.</p></div>
                                ) : (
                                <div className="border rounded-lg">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                            <TableHead>Concepto</TableHead>
                                            <TableHead>Categoría</TableHead>
                                            <TableHead>Curso Asociado</TableHead>
                                            <TableHead>Fecha</TableHead>
                                            <TableHead className="text-right">Importe</TableHead>
                                            <TableHead className="w-[100px] text-right">Acciones</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {costs.map((item) => (
                                                <TableRow key={item.id}>
                                                    <TableCell className="font-medium">{item.item}</TableCell>
                                                    <TableCell>{item.category}</TableCell>
                                                    <TableCell className="text-muted-foreground">{item.courseId ? courseMap.get(item.courseId) || 'N/A' : '-'}</TableCell>
                                                    <TableCell>{format(new Date(item.date), 'dd/MM/yyyy')}</TableCell>
                                                    <TableCell className="text-right font-mono">{item.amount.toFixed(2)}€</TableCell>
                                                    <TableCell className="text-right space-x-1">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(item)}><FilePenLine className="h-4 w-4" /></Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setItemToDelete(item)}><Trash2 className="h-4 w-4" /></Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                    <div className="lg:col-span-1">
                        <CategoryManager />
                    </div>
                </div>

                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
                        <AlertDialogDescription>Esta acción no se puede deshacer. El gasto "{itemToDelete?.item}" se eliminará permanentemente.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setItemToDelete(null)}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
            <CostDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                cost={itemToEdit}
                courses={courses || []}
            />
        </div>
    );
}
