
'use client';

import { useState, useEffect, useActionState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useToast } from '@/hooks/use-toast';
import * as db from '@/lib/db';
import type { AIConfig, AIModel, AIFeature } from '@/lib/types';
import { aiModels, aiFeatures } from '@/lib/types';
import { saveAIConfigAction } from '@/app/dashboard/settings/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Server, BrainCircuit } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

export function AISettings() {
    const { toast } = useToast();
    const formRef = useRef<HTMLFormElement>(null);
    const [state, formAction] = useActionState(saveAIConfigAction, { success: false, message: '' });

    const currentConfig = useLiveQuery(() => db.getAIConfig());
    const [localConfig, setLocalConfig] = useState<AIConfig | null>(null);

    useEffect(() => {
        if (currentConfig) {
            setLocalConfig(currentConfig);
        }
    }, [currentConfig]);

    useEffect(() => {
        if (state.message) {
            toast({
                title: state.success ? 'Éxito' : 'Error',
                description: state.message,
                variant: state.success ? 'default' : 'destructive',
            });
        }
    }, [state, toast]);

    const handleFeatureToggle = (feature: AIFeature, checked: boolean) => {
        if (!localConfig) return;
        setLocalConfig(prev => ({
            ...prev!,
            enabledFeatures: {
                ...prev!.enabledFeatures,
                [feature]: checked,
            },
        }));
    };
    
    const handleSaveChanges = async (formData: FormData) => {
        if (!localConfig) return;
        
        // First, trigger the server action to save API keys
        formAction(formData);

        // Then, save the rest of the config to Dexie
        try {
            await db.saveAIConfig(localConfig);
            toast({
                title: 'Configuración guardada',
                description: 'La configuración local de la IA ha sido actualizada.'
            });
        } catch (error) {
             toast({
                title: 'Error',
                description: 'No se pudo guardar la configuración local.',
                variant: 'destructive',
            });
        }
    }
    
    if (!localConfig) {
        return <Skeleton className="h-96 w-full" />
    }

    return (
        <form ref={formRef} action={handleSaveChanges} className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Proveedor de IA Activo</CardTitle>
                    <CardDescription>Selecciona el modelo de IA que se utilizará en toda la plataforma.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="max-w-xs">
                        <Label htmlFor="active-model">Modelo de IA</Label>
                        <Select
                            value={localConfig.activeModel}
                            onValueChange={(value: AIModel) => setLocalConfig({ ...localConfig, activeModel: value })}
                        >
                            <SelectTrigger id="active-model"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {aiModels.map(model => (
                                    <SelectItem key={model} value={model}>{model}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    
                    <div className="space-y-2">
                        <Label>Claves API de los Proveedores</Label>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-lg border p-4">
                            <div className="space-y-1">
                                <Label htmlFor="gemini_api_key">Google (Gemini)</Label>
                                <Input id="gemini_api_key" name="gemini_api_key" type="password" placeholder="Clave no establecida" />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="openai_api_key">OpenAI (GPT)</Label>
                                <Input id="openai_api_key" name="openai_api_key" type="password" placeholder="Clave no establecida" />
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Las claves se guardan de forma segura y no son visibles. Deja un campo en blanco y guarda para eliminar la clave actual.
                        </p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Funcionalidades de IA</CardTitle>
                    <CardDescription>Activa o desactiva las distintas herramientas de IA en la plataforma.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {aiFeatures.map(feature => (
                        <div key={feature.id} className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <Label htmlFor={`feature-${feature.id}`} className="font-semibold">{feature.label}</Label>
                                <p className="text-sm text-muted-foreground">{feature.description}</p>
                            </div>
                             <Switch
                                id={`feature-${feature.id}`}
                                checked={localConfig.enabledFeatures[feature.id] ?? false}
                                onCheckedChange={(checked) => handleFeatureToggle(feature.id, checked)}
                            />
                        </div>
                    ))}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Historial de Uso</CardTitle>
                    <CardDescription>Registro de las llamadas a la API de IA (funcionalidad en desarrollo).</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Usuario</TableHead>
                                    <TableHead>Función Utilizada</TableHead>
                                    <TableHead>Proveedor</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                        No hay registros de uso todavía.
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button type="submit">Guardar Configuración de IA</Button>
            </div>
        </form>
    );
}
