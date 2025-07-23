
'use client';

import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '../ui/skeleton';
import { Loader2 } from 'lucide-react';
import * as db from '@/lib/db';
import type { AIConfig, CertificateTemplateType } from '@/lib/types';
import { certificateTemplates } from '@/lib/types';

export function GeneralSettings() {
    const { toast } = useToast();
    const currentConfig = useLiveQuery(() => db.getAIConfig());
    const [localConfig, setLocalConfig] = useState<AIConfig | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (currentConfig) {
            setLocalConfig(currentConfig);
        }
    }, [currentConfig]);

    const handleSave = async () => {
        if (!localConfig) return;
        setIsSaving(true);
        try {
            await db.saveAIConfig(localConfig);
            toast({
                title: 'Ajustes Guardados',
                description: 'La configuración general ha sido guardada.'
            });
        } catch (error) {
             toast({
                title: 'Error',
                description: 'No se pudieron guardar los ajustes.',
                variant: 'destructive',
            });
        } finally {
            setIsSaving(false);
        }
    }

    if (!localConfig) {
        return <Skeleton className="h-64 w-full" />
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Personalización</CardTitle>
                    <CardDescription>Ajusta las opciones de personalización visual de la plataforma.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="max-w-xs space-y-2">
                        <Label htmlFor="default-certificate">Plantilla de Certificado por Defecto</Label>
                        <Select
                            value={localConfig.defaultCertificateTemplate}
                            onValueChange={(value: CertificateTemplateType) => setLocalConfig(prev => ({...prev!, defaultCertificateTemplate: value}))}
                        >
                            <SelectTrigger id="default-certificate">
                                <SelectValue placeholder="Selecciona una plantilla..." />
                            </SelectTrigger>
                            <SelectContent>
                                {certificateTemplates.map(template => (
                                    <SelectItem key={template} value={template}>{template}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                         <p className="text-xs text-muted-foreground">
                            Esta será la plantilla usada por defecto al generar certificados.
                        </p>
                    </div>
                </CardContent>
            </Card>
            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Guardar Ajustes Generales
                </Button>
            </div>
        </div>
    );
}

    
