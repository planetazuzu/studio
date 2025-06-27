'use client' // Error components must be Client Components

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter();

  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="flex h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md shadow-2xl">
             <CardHeader className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                    <AlertTriangle className="h-8 w-8" />
                </div>
                <CardTitle className="mt-4 text-3xl font-bold">¡Ups! Algo salió mal</CardTitle>
                <CardDescription>
                    Hemos encontrado un error inesperado. Por favor, intenta recargar la página.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="rounded-md bg-muted p-4 text-left text-xs text-muted-foreground">
                    <p className="font-mono"><strong>Error:</strong> {error.message}</p>
                </div>
                 <div className="flex w-full gap-4">
                     <Button
                        onClick={() => reset()}
                        className="w-full"
                        variant="outline"
                    >
                        Intentar de Nuevo
                    </Button>
                    <Button
                        onClick={() => router.push('/dashboard')}
                        className="w-full"
                    >
                        Volver al Dashboard
                    </Button>
                 </div>
            </CardContent>
        </Card>
    </div>
  )
}
