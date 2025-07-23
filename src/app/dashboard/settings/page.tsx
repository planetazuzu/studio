
'use client';

import { useAuth } from '@/contexts/auth';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ApiSettings } from '@/components/settings/api-settings';
import { SyncManager } from '@/components/settings/sync-manager';
import { PermissionSettings } from '@/components/settings/permission-settings';
import { AISettings } from '@/components/settings/ai-settings';
import { GeneralSettings } from '@/components/settings/general-settings';


export default function SettingsPage() {
    const { user } = useAuth();
    const router = useRouter();

    if (!user) return (
        <div className="flex h-full items-center justify-center">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </div>
    );
    
    if (user.role !== 'Administrador General') {
        router.push('/dashboard');
        return null;
    }

    const adminTabs = [
        { value: 'general', label: 'General' },
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
                <Tabs defaultValue="general" className="w-full" orientation="vertical">
                    <TabsList className="grid w-full max-w-xs grid-cols-1 h-auto">
                        {adminTabs.map(tab => (
                            <TabsTrigger key={tab.value} value={tab.value} className="justify-start">{tab.label}</TabsTrigger>
                        ))}
                    </TabsList>
                    <TabsContent value="general" className="mt-4 md:mt-0">
                        <GeneralSettings />
                    </TabsContent>
                    <TabsContent value="permissions" className="mt-4 md:mt-0">
                        <PermissionSettings />
                    </TabsContent>
                    <TabsContent value="ai" className="mt-4 md:mt-0">
                        <AISettings />
                    </TabsContent>
                    <TabsContent value="api" className="mt-4 md:mt-0">
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
