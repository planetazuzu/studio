
'use client';

import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, CheckCircle, ArrowLeft } from 'lucide-react';
import * as db from '@/lib/db';
import type { AIConfig, CertificateTemplateType } from '@/lib/types';
import { certificateTemplates } from '@/lib/types';
import { CertificateTemplate } from '@/components/certificate-template';
import { CertificateTemplateModern } from '@/components/certificate-template-modern';
import { CertificateTemplateProfessional } from '@/components/certificate-template-professional';
import Link from 'next/link';

export default function CertificatesSettingsPage() {
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
                description: 'La plantilla de certificado por defecto ha sido guardada.'
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

    const sampleCertificateProps = {
        userName: "Elena Vargas",
        courseName: "Soporte Vital Básico (SVB) y DEA",
        completionDate: "23/07/2024",
        instructorName: "Dr. Alejandro Torres",
        qrCodeDataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", // 1x1 black pixel
    };

    if (!localConfig) {
        return <Skeleton className="h-[80vh] w-full" />
    }

    return (
        <div className="space-y-8">
            <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/settings">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver a Ajustes
                </Link>
            </Button>
            <div>
                <h1 className="text-3xl font-bold">Gestión de Certificados</h1>
                <p className="text-muted-foreground">Previsualiza las plantillas de certificados y elige la que se usará por defecto.</p>
            </div>

             <Card>
                <CardHeader>
                    <CardTitle>Plantilla por Defecto</CardTitle>
                    <CardDescription>Selecciona el diseño que se usará para todos los certificados generados en la plataforma.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="w-full md:w-auto md:max-w-xs space-y-2 flex-grow">
                        <Select
                            value={localConfig.defaultCertificateTemplate}
                            onValueChange={(value: CertificateTemplateType) => setLocalConfig(prev => ({...prev!, defaultCertificateTemplate: value}))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona una plantilla..." />
                            </SelectTrigger>
                            <SelectContent>
                                {certificateTemplates.map(template => (
                                    <SelectItem key={template} value={template}>Diseño {template}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                     <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                        Guardar Plantilla
                    </Button>
                </CardContent>
            </Card>

            <div className="space-y-8">
                <h2 className="text-2xl font-semibold">Vistas Previas de las Plantillas</h2>
                
                {/* Modern Template Preview */}
                <Card>
                    <CardHeader>
                        <CardTitle>Diseño Moderno</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-lg overflow-hidden">
                            <div className="bg-muted p-4 scale-[0.6] origin-top-left" style={{ width: '166.66%', height: 'calc(794px * 0.6)'}}>
                                <CertificateTemplateModern {...sampleCertificateProps} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Professional Template Preview */}
                <Card>
                    <CardHeader>
                        <CardTitle>Diseño Profesional</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-lg overflow-hidden">
                           <div className="bg-muted p-4 scale-[0.6] origin-top-left" style={{ width: '166.66%', height: 'calc(794px * 0.6)'}}>
                                <CertificateTemplateProfessional {...sampleCertificateProps} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Classic Template Preview */}
                <Card>
                    <CardHeader>
                        <CardTitle>Diseño Clásico</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-lg overflow-hidden">
                           <div className="bg-muted p-4 scale-[0.6] origin-top-left" style={{ width: '166.66%', height: 'calc(794px * 0.6)'}}>
                                <CertificateTemplate {...sampleCertificateProps} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
