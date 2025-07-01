'use client';

import { useAuth } from '@/contexts/auth';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ApiSettings } from '@/components/settings/api-settings';
import { SyncManager } from '@/components/settings/sync-manager';
import { PermissionSettings } from '@/components/settings/permission-settings';
import { AISettings } from '@/components/settings/ai-settings';


export default function SettingsPage() {
    const { user } = useAuth();
    const router = useRouter();

    if (!user) return (
        <div className="flex h-full items-center justify-center">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
    );

    const isManager = ['Gestor de RRHH', 'Jefe de Formación', 'Administrador General'].includes(user.role);
    
    if (!isManager) {
        router.push('/dashboard');
        return null;
    }

    const adminTabs = [
        { value: 'permissions', label: 'Permisos' },
        { value: 'ai', label: 'Inteligencia Artificial' },
        { value: 'api', label: 'APIs & Sincronización' },
    ];
    
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Ajustes de la Plataforma</h1>
                <p className="text-muted-foreground">Configuración global para administradores.</p>
            </div>
            <div className="grid grid-cols-1 gap-8">
                <Tabs defaultValue="permissions" className="w-full">
                    <TabsList className={`grid w-full max-w-2xl`} style={{ gridTemplateColumns: `repeat(${adminTabs.length}, minmax(0, 1fr))` }}>
                        {adminTabs.map(tab => (
                            <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
                        ))}
                    </TabsList>
                    <TabsContent value="permissions" className="mt-4">
                        <PermissionSettings />
                    </TabsContent>
                    <TabsContent value="ai" className="mt-4">
                        <AISettings />
                    </TabsContent>
                    <TabsContent value="api" className="mt-4">
                        <div className="space-y-6">
                            <ApiSettings />
                            <SyncManager />
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
