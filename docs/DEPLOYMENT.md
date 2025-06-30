# Guía de Despliegue

Esta aplicación es un proyecto estándar de Next.js y puede ser desplegada en cualquier plataforma que soporte Node.js. A continuación, se detallan los pasos para desplegar en Vercel (la opción recomendada) y en un servidor Node.js genérico.

**Importante:** El archivo `apphosting.yaml` es específico para Firebase App Hosting y puede ser eliminado si despliegas en otra plataforma.

---

## 1. Configuración de Variables de Entorno

Antes de desplegar, necesitas configurar las variables de entorno. Estas son claves secretas y configuraciones que no deben guardarse en el código. En tu plataforma de hosting (Vercel, Netlify, etc.), busca una sección de "Environment Variables" en la configuración de tu proyecto y añade las siguientes:

### Variables de NocoDB (Obligatorio)
Tu aplicación necesita conectarse a tu instancia de NocoDB para la sincronización de datos.

-   `NOCODB_API_URL`: La URL completa de tu API de NocoDB. Ejemplo: `https://app.nocodb.com/api/v2`
-   `NOCODB_AUTH_TOKEN`: Tu token de autenticación de NocoDB (lo encuentras en "API Tokens" dentro de tu proyecto en NocoDB).

### Variables de IA (Obligatorio para funciones de IA)
Para que las funcionalidades de Inteligencia Artificial funcionen, debes proporcionar al menos una clave API.

-   `GOOGLE_API_KEY`: Tu clave API de Google AI Studio para usar Gemini.

### Variables de Notificaciones (Opcional)
Si deseas que el envío de notificaciones por email o WhatsApp funcione, configura estas variables.

-   `SENDGRID_API_KEY`: Tu clave API de SendGrid.
-   `SENDGRID_FROM_EMAIL`: La dirección de correo electrónico desde la que se enviarán los emails.
-   `TWILIO_ACCOUNT_SID`: El SID de tu cuenta de Twilio.
-   `TWILIO_AUTH_TOKEN`: El token de autenticación de tu cuenta de Twilio.
-   `TWILIO_WHATSAPP_FROM`: Tu número de teléfono de WhatsApp de Twilio (formato: `+14155238886`).
-   `TWILIO_WHATSAPP_TO_TEST`: Un número de teléfono para pruebas (formato: `+34123456789`).

---

## 2. Despliegue en Vercel (Recomendado)

Vercel son los creadores de Next.js, por lo que el despliegue es increíblemente sencillo.

1.  **Sube tu código a un repositorio Git** (GitHub, GitLab, Bitbucket).
2.  **Regístrate en Vercel** usando tu cuenta de Git.
3.  **Importa tu proyecto**: En el dashboard de Vercel, haz clic en "Add New... -> Project" y selecciona el repositorio de tu aplicación.
4.  **Configura el Proyecto**: Vercel detectará automáticamente que es un proyecto de Next.js y preconfigurará todo por ti.
    -   Ve a la sección "Environment Variables" y añade todas las variables mencionadas en el paso 1.
5.  **Despliega**: Haz clic en el botón "Deploy". Vercel construirá y desplegará tu aplicación.

Cada vez que hagas `git push` a tu rama principal, Vercel redesplegará automáticamente los cambios.

---

## 3. Despliegue en un Servidor Node.js (Avanzado)

Si prefieres tener control total, puedes desplegar la aplicación en tu propio servidor (VPS, EC2, etc.).

1.  **Prepara tu servidor**: Asegúrate de que tienes Node.js (versión 20 o superior) y `npm` o `yarn` instalados.
2.  **Clona tu repositorio**: `git clone [URL_DE_TU_REPO]`
3.  **Instala las dependencias**: `cd [NOMBRE_DEL_PROYECTO]` y luego `npm install`.
4.  **Configura las variables de entorno**: Crea un archivo `.env.local` en la raíz del proyecto y añade todas las variables de entorno del paso 1.
    ```
    NOCODB_API_URL=...
    NOCODB_AUTH_TOKEN=...
    GOOGLE_API_KEY=...
    ```
5.  **Construye la aplicación**: `npm run build`. Este comando compila tu aplicación para producción y la optimiza.
6.  **Inicia la aplicación**: `npm start`. Esto iniciará el servidor de Next.js en el puerto 3000 por defecto.
7.  **(Recomendado) Usa un gestor de procesos**: Para mantener la aplicación corriendo de forma continua y reiniciarla si falla, usa un gestor como `pm2`.
    -   Instala pm2: `npm install pm2 -g`
    -   Inicia tu app con pm2: `pm2 start npm --name "talent-os" -- start`

Ahora tu aplicación estará corriendo en tu servidor. Probablemente necesitarás configurar un proxy inverso (como Nginx o Apache) para exponerla al público a través del puerto 80/443 y configurar un dominio.
