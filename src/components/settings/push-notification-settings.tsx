
'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BellRing, Loader2, CheckCircle } from 'lucide-react';
import { saveFcmTokenAction, sendTestPushNotificationAction } from '@/app/dashboard/settings/actions';
import { getFirebaseMessagingToken } from '@/lib/firebase-client';

export function PushNotificationSettings() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(typeof window !== 'undefined' && Notification.permission === 'granted');

    const handleSubscribe = async () => {
        setIsLoading(true);
        try {
            const fcmToken = await getFirebaseMessagingToken();

            if (fcmToken) {
                const saveResult = await saveFcmTokenAction(fcmToken);
                if (saveResult.success) {
                    setIsSubscribed(true);
                    toast({
                        title: '¡Suscripción Exitosa!',
                        description: 'Ahora recibirás notificaciones push. Enviando una prueba...',
                    });
                    // Send a test push notification
                    await sendTestPushNotificationAction();
                } else {
                    throw new Error(saveResult.message);
                }
            } else {
                 toast({
                    title: 'Suscripción Fallida',
                    description: 'No se pudo obtener el token de notificación. Asegúrate de haber concedido los permisos.',
                    variant: 'destructive',
                });
            }
        } catch (error: any) {
            console.error('Failed to subscribe to push notifications', error);
            toast({
                title: 'Error de Suscripción',
                description: error.message || 'No se pudieron activar las notificaciones push.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Notificaciones Push</CardTitle>
                <CardDescription>Recibe alertas instantáneas en tu dispositivo sobre anuncios y eventos importantes.</CardDescription>
            </CardHeader>
            <CardContent>
                {isSubscribed ? (
                    <div className="flex items-center gap-2 text-green-600 font-semibold">
                        <CheckCircle className="h-5 w-5" />
                        <p>Las notificaciones push están activadas en este dispositivo.</p>
                    </div>
                ) : (
                    <Button onClick={handleSubscribe} disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BellRing className="mr-2 h-4 w-4" />}
                        {isLoading ? 'Activando...' : 'Activar Notificaciones'}
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
