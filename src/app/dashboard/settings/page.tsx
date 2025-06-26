
'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth';
import * as db from '@/lib/db';
import type { NotificationChannel, User } from '@/lib/types';
import { Loader2 } from 'lucide-react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ProfileSettings } from '@/components/settings/profile-settings';
import { ExternalTrainingSettings } from '@/components/settings/external-training-settings';
import { ContactPreferences } from '@/components/settings/contact-preferences';
import { GeneralSettings } from '@/components/settings/general-settings';
import { ApiSettings } from '@/components/settings/api-settings';
import { SyncManager } from '@/components/settings/sync-manager';
import { PermissionSettings } from '@/components/settings/permission-settings';


// Helper function to convert HEX to HSL components (string "H S% L%")
function hexToHsl(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return '0 0% 0%';

    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;

    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    h = Math.round(h * 360);
    s = Math.round(s * 100);
    l = Math.round(l * 100);

    return `${h} ${s}% ${l}%`;
}

// Convert HSL string from CSS to HEX for color input
function hslToHex(h: number, s: number, l: number): string {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = (n: number) => {
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}


export default function SettingsPage() {
    const { toast } = useToast();
    const { user, login } = useAuth();
    
    const [profile, setProfile] = useState<any>(null);
    const [general, setGeneral] = useState({
        orgName: 'AmbuVital S.L.',
        primaryColor: '#2E9AFE',
        accentColor: '#82E0AA',
    });
    
    const [preferences, setPreferences] = useState({
        consent: false,
        channels: [] as NotificationChannel[],
    });
    
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (user) {
            setProfile({
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                role: user.role,
            });
            setPreferences(user.notificationSettings || {
                consent: false,
                channels: [],
            });
        }
    }, [user]);

    useEffect(() => {
        // This effect needs to run on the client after mount.
        if (typeof window !== 'undefined') {
            const root = document.documentElement;
            // Set initial colors from CSS variables to sync state with theme
            const initialPrimary = hslToHex(
                parseFloat(getComputedStyle(root).getPropertyValue('--primary').split(' ')[0]),
                parseFloat(getComputedStyle(root).getPropertyValue('--primary').split(' ')[1]),
                parseFloat(getComputedStyle(root).getPropertyValue('--primary').split(' ')[2])
            );
            const initialAccent = hslToHex(
                 parseFloat(getComputedStyle(root).getPropertyValue('--accent').split(' ')[0]),
                 parseFloat(getComputedStyle(root).getPropertyValue('--accent').split(' ')[1]),
                 parseFloat(getComputedStyle(root).getPropertyValue('--accent').split(' ')[2])
            );
            setGeneral(g => ({...g, primaryColor: initialPrimary, accentColor: initialAccent }));
        }
    }, []);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            document.documentElement.style.setProperty('--primary', hexToHsl(general.primaryColor));
            document.documentElement.style.setProperty('--accent', hexToHsl(general.accentColor));
        }
    }, [general.primaryColor, general.accentColor]);

    if (!user) return <p>Cargando...</p>;

    const isAdmin = user.role === 'Administrador General';

    const handleSaveChanges = async () => {
        if (!user || !profile) return;

        setIsSaving(true);
        try {
            const updatedData = {
                name: profile.name,
                email: profile.email,
                avatar: profile.avatar,
                role: profile.role,
                notificationSettings: preferences,
            };

            await db.updateUser(user.id, updatedData);
            
            // Re-authenticate to fetch fresh user data and update the auth context
            if (user.password) {
              await login(profile.email, user.password);
            }

            toast({
                title: "Ajustes Guardados",
                description: "Tus cambios han sido guardados correctamente.",
            });
        } catch (error: any) {
             if (error.name === 'ConstraintError') {
                 toast({
                    title: "Error al Guardar",
                    description: "Ese correo electrónico ya está en uso por otro usuario.",
                    variant: "destructive",
                });
             } else {
                console.error("Saving settings failed", error);
                toast({
                    title: "Error",
                    description: "No se pudieron guardar los cambios.",
                    variant: "destructive",
                });
            }
        } finally {
            setIsSaving(false);
        }
    };
    
    const userTabs = [
        { value: 'profile', label: 'Información Personal' },
        { value: 'external-training', label: 'Formación Externa' },
        { value: 'preferences', label: 'Preferencias' },
    ];
    
    const adminTabs = [
        ...userTabs,
        { value: 'general', label: 'General' },
        { value: 'api', label: 'APIs' },
        { value: 'sync', label: 'Sincronización' },
        { value: 'permissions', label: 'Permisos' },
    ];

    const visibleTabs = isAdmin ? adminTabs : userTabs;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Ajustes</h1>
                <p className="text-muted-foreground">Gestiona la configuración de la aplicación y tu perfil.</p>
            </div>
            <div className="grid grid-cols-1 gap-8">
                 <Tabs defaultValue="profile" className="w-full">
                    <TabsList className={`grid w-full max-w-4xl`} style={{ gridTemplateColumns: `repeat(${visibleTabs.length}, 1fr)` }}>
                        {visibleTabs.map(tab => (
                             <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
                        ))}
                    </TabsList>
                    <TabsContent value="profile" className="mt-4">
                        <ProfileSettings profile={profile} setProfile={setProfile} />
                    </TabsContent>
                    <TabsContent value="external-training" className="mt-4">
                        <ExternalTrainingSettings user={user} />
                    </TabsContent>
                    <TabsContent value="preferences" className="mt-4">
                        <ContactPreferences preferences={preferences} setPreferences={setPreferences} />
                    </TabsContent>
                    {isAdmin && (
                        <>
                            <TabsContent value="general" className="mt-4">
                                <GeneralSettings general={general} setGeneral={setGeneral} />
                            </TabsContent>
                            <TabsContent value="api" className="mt-4">
                                <ApiSettings />
                            </TabsContent>
                            <TabsContent value="sync" className="mt-4">
                                <SyncManager />
                            </TabsContent>
                             <TabsContent value="permissions" className="mt-4">
                                <PermissionSettings />
                            </TabsContent>
                        </>
                    )}
                </Tabs>
            </div>
            <div className="flex justify-end">
                <Button size="lg" onClick={handleSaveChanges} disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Guardar Cambios
                </Button>
            </div>
        </div>
    );
}
