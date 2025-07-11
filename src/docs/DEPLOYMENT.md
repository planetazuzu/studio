
# Guía de Despliegue

Esta aplicación es un proyecto estándar de Next.js y puede ser desplegada en cualquier plataforma que soporte Node.js. A continuación, se detallan los pasos para desplegar en Vercel (la opción recomendada) y en un servidor Node.js genérico.

**Importante:** El archivo `apphosting.yaml` es específico para Firebase App Hosting y puede ser eliminado si despliegas en otra plataforma.

---

## 1. Configuración de Variables de Entorno

Antes de desplegar, necesitas configurar las variables de entorno. Estas son claves secretas y configuraciones que no deben guardarse en el código. En tu plataforma de hosting (Vercel, Netlify, etc.), busca una sección de "Environment Variables" en la configuración de tu proyecto y añade las siguientes:

### Proveedor de Autenticación (¡Elegir uno!)
La aplicación está preparada para usar diferentes sistemas de autenticación. Debes elegir uno y configurar sus variables.
-   `NEXT_PUBLIC_AUTH_PROVIDER`: Define qué sistema usar. Opciones: `dexie`, `firebase`, `auth0`, `supabase`.
    -   `dexie`: Usa el sistema de login local (solo para prototipos, no para producción).
    -   `firebase`: Usa Firebase Authentication.
    -   `auth0`: Usa Auth0.
    -   `supabase`: Usa Supabase Auth.

---

#### Opción A: Variables de Firebase (Recomendado para Producción)
Copia estas variables desde la configuración de tu proyecto en la consola de Firebase.

> **⚠️ Nota Importante sobre la Base de Datos:**
> La configuración de Firebase es **exclusivamente para la autenticación de usuarios**. La base de datos principal de la aplicación sigue siendo **Dexie.js** en el navegador, con sincronización a **Airtable**. Esta aplicación **no utiliza Firestore** ni Firebase Realtime Database.

-   `NEXT_PUBLIC_FIREBASE_API_KEY`: Tu clave de API.
-   `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`: Tu dominio de autenticación.
-   `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: El ID de tu proyecto.
-   `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`: Tu bucket de almacenamiento.
-   `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`: ID del remitente de mensajería.
-   `NEXT_PUBLIC_FIREBASE_APP_ID`: ID de tu aplicación.
-   `NEXT_PUBLIC_FIREBASE_VAPID_KEY`: La clave VAPID de Cloud Messaging para notificaciones push.
-   `FIREBASE_CLIENT_EMAIL`: Email de la cuenta de servicio (para notificaciones del servidor).
-   `FIREBASE_PRIVATE_KEY`: Clave privada de la cuenta de servicio (para notificaciones del servidor).

---

#### Opción B: Variables de Auth0
Copia estas variables desde la configuración de tu aplicación en el panel de Auth0.

-   `AUTH0_SECRET`: Una cadena larga y aleatoria para firmar cookies.
-   `AUTH0_BASE_URL`: La URL de tu aplicación desplegada (ej. `https://mi-app.vercel.app`).
-   `AUTH0_ISSUER_BASE_URL`: El dominio de tu tenant de Auth0 (ej. `https://tu-tenant.us.auth0.com`).
-   `AUTH0_CLIENT_ID`: El Client ID de tu aplicación.
-   `AUTH0_CLIENT_SECRET`: El Client Secret de tu aplicación.

---

#### Opción C: Variables de Supabase
Copia estas variables desde la configuración de API de tu proyecto en Supabase.

-   `NEXT_PUBLIC_SUPABASE_URL`: La URL de tu proyecto Supabase.
-   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: La clave anónima (public) de tu proyecto.

---

### Variables de Airtable (Obligatorio)
Tu aplicación necesita conectarse a tu base de Airtable para la sincronización de datos.

-   `AIRTABLE_API_KEY`: Tu clave de API personal de Airtable.
-   `AIRTABLE_BASE_ID`: El ID de tu base de Airtable (empieza con `app...`).

---

### Variables de IA (Obligatorio para funciones de IA)
Para que las funcionalidades de Inteligencia Artificial funcionen, debes proporcionar al menos una clave API.

-   `GOOGLE_API_KEY`: Tu clave API de Google AI Studio para usar Gemini.

---

### Variables de Notificaciones (Opcional)
Si deseas que el envío de notificaciones por email o WhatsApp funcione, configura estas variables.

-   `SENDGRID_API_KEY`: Tu clave API de SendGrid.
-   `SENDGRID_FROM_EMAIL`: La dirección de correo electrónico desde la que se enviarán los emails.
-   `TWILIO_ACCOUNT_SID`: El SID de tu cuenta de Twilio.
-   `TWILIO_AUTH_TOKEN`: El token de autenticación de tu cuenta de Twilio.
-   `TWILIO_WHATSAPP_FROM`: Tu número de teléfono de WhatsApp de Twilio (formato: `+14155238886`).
-   `TWILIO_WHATSAPP_TO_TEST`: Un número de teléfono para pruebas (formato: `+34123456789`).

---

## 2. Requisito de HTTPS (SSL) para PWA

Esta aplicación es una **Progressive Web App (PWA)**, lo que significa que los usuarios pueden "instalarla" en sus dispositivos para tener una experiencia similar a una app nativa.

Para que las funcionalidades de PWA (como el aviso de instalación o el funcionamiento offline) se activen, **es obligatorio que la aplicación se sirva a través de una conexión segura (HTTPS)**.

-   Plataformas como **Vercel** gestionan esto automáticamente.
-   Si despliegas en tu **propio servidor**, deberás configurar un certificado SSL (se recomienda usar Let's Encrypt).

---

## 3. Despliegue en Vercel (Recomendado)

Vercel son los creadores de Next.js, por lo que el despliegue es increíblemente sencillo.

1.  **Sube tu código a un repositorio Git** (GitHub, GitLab, Bitbucket).
2.  **Regístrate en Vercel** usando tu cuenta de Git.
3.  **Importa tu proyecto**: En el dashboard de Vercel, haz clic en "Add New... -> Project" y selecciona el repositorio de tu aplicación.
4.  **Configura el Proyecto**: Vercel detectará automáticamente que es un proyecto de Next.js y preconfigurará todo por ti.
    -   Ve a la sección "Environment Variables" y añade todas las variables mencionadas en el paso 1.
    -   Vercel proporciona automáticamente un certificado SSL, cumpliendo con el requisito de HTTPS para la PWA.
5.  **Despliega**: Haz clic en el botón "Deploy". Vercel construirá y desplegará tu aplicación.

Cada vez que hagas `git push` a tu rama principal, Vercel redesplegará automáticamente los cambios.
