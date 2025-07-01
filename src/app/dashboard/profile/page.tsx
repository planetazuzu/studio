'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth';
import * as db from '@/lib/db';
import type { User } from '@/lib/types';
import { Loader2 } from 'lucide-react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ProfileSettings } from '@/components/settings/profile-settings';
import { TrainingHistory } from '@/components/settings/training-history';
import { AchievementsSettings } from '@/components/settings/achievements-settings';

export default function ProfilePage() {
    const { toast } = useToast();
    const { user, login } = useAuth();
    
    const [profile, setProfile] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (user) {
            setProfile({
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                role: user.role,
                points: user.points,
            });
        }
    }, [user]);

    if (!user) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
            </div>
        );
    }

    const handleSaveChanges = async () => {
        if (!user || !profile) return;

        setIsSaving(true);
        try {
            const updatedData = {
                name: profile.name,
                email: profile.email,
                avatar: profile.avatar,
                role: profile.role,
            };

            await db.updateUser(user.id, updatedData);
            
            if (user.password) {
              await login(profile.email, user.password);
            }

            toast({
                title: "Perfil Guardado",
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
        { value: 'achievements', label: 'Logros' },
        { value: 'training-history', label: 'Historial Formativo' },
    ];
    
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold">Mi Perfil</h1>
                <p className="text-muted-foreground">Gestiona tu información personal, logros y formación.</p>
            </div>
            <div className="grid grid-cols-1 gap-8">
                 <Tabs defaultValue="profile" className="w-full">
                    <TabsList className={`grid w-full max-w-2xl`} style={{ gridTemplateColumns: `repeat(${userTabs.length}, minmax(0, 1fr))` }}>
                        {userTabs.map(tab => (
                             <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
                        ))}
                    </TabsList>
                    <TabsContent value="profile" className="mt-4">
                        <ProfileSettings profile={profile} setProfile={setProfile} />
                    </TabsContent>
                    <TabsContent value="achievements" className="mt-4">
                        <AchievementsSettings user={user} />
                    </TabsContent>
                    <TabsContent value="training-history" className="mt-4">
                        <TrainingHistory user={user} />
                    </TabsContent>
                </Tabs>
            </div>
            <div className="flex justify-end">
                <Button size="lg" onClick={handleSaveChanges} disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Guardar Cambios de Perfil
                </Button>
            </div>
        </div>
    );
}
