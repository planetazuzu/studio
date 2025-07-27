
# Guía de Configuración del Entorno de Desarrollo

Esta guía te llevará paso a paso a través del proceso de configuración de TalentOS en tu máquina local para el desarrollo.

---

### Requisitos Previos

Antes de comenzar, asegúrate de tener instalado lo siguiente:
-   **Node.js:** Versión 20.x o superior.
-   **npm:** Generalmente se instala junto con Node.js.
-   **Git:** Para clonar el repositorio.

---

## Paso 1: Clonar el Repositorio

Abre tu terminal y clona el código fuente del proyecto en una carpeta de tu elección.

```bash
git clone <URL_DEL_REPOSITORIO> talent-os
cd talent-os
```

---

## Paso 2: Instalar Dependencias

Una vez dentro de la carpeta del proyecto, instala todas las dependencias necesarias utilizando `npm`.

```bash
npm install
```
Este comando leerá el archivo `package.json` y descargará todas las librerías requeridas.

---

## Paso 3: Configurar Supabase (Base de Datos Remota)

TalentOS utiliza una base de datos local (Dexie.js) para funcionar, pero para la sincronización de datos y la persistencia a largo plazo, se conecta a **Supabase**.

1.  **Configura tu proyecto de Supabase:** Si aún no lo has hecho, necesitarás una cuenta de Supabase y crear un nuevo proyecto.
2.  **Crea las Tablas:** Dentro de tu proyecto en Supabase, crea todas las tablas y campos exactamente como se especifica en nuestra guía del esquema.
    -   🔗 **Referencia Obligatoria:** [**Guía del Esquema de Supabase**](./supabase_schema.md)
3.  **Obtén tus Credenciales:** Necesitarás tres credenciales de la sección `Project Settings > API` de tu proyecto de Supabase.
    -   **Project URL**
    -   **Project API Keys -> `anon` `public`**
    -   **Project API Keys -> `service_role` `secret`**

Guarda estas tres credenciales, las usarás en el siguiente paso.

---

## Paso 4: Configurar Variables de Entorno

La aplicación necesita claves secretas para conectarse a servicios externos. Estas se gestionan a través de un archivo `.env.local` que no se sube a Git.

1.  **Crea el archivo:** En la raíz de tu proyecto, crea un nuevo archivo llamado `.env.local`.

2.  **Añade las variables:** Abre el archivo y pega las siguientes variables, reemplazando los valores de ejemplo con tus propias credenciales.

    ```env
    # --- Configuración de Supabase (Obligatorio para la sincronización) ---
    # Obtenidas en el paso 3 de la sección de Project Settings > API en Supabase
    NEXT_PUBLIC_SUPABASE_URL="URL_DE_TU_PROYECTO_SUPABASE"
    NEXT_PUBLIC_SUPABASE_ANON_KEY="TU_CLAVE_ANON_PUBLICA"
    SUPABASE_SERVICE_ROLE_KEY="TU_CLAVE_SERVICE_ROLE_SECRETA"

    # --- Configuración de IA (Opcional pero Recomendado) ---
    # Clave de API para Google Gemini (para las funciones de IA)
    # Obtenla desde Google AI Studio
    GOOGLE_API_KEY="TU_CLAVE_API_DE_GOOGLE_AI"

    # --- Variables Opcionales (para notificaciones) ---
    # SENDGRID_API_KEY="TU_CLAVE_DE_SENDGRID"
    # SENDGRID_FROM_EMAIL="notificaciones@tu-empresa.com"
    # TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
    # TWILIO_AUTH_TOKEN="TU_TOKEN_DE_TWILIO"
    # TWILIO_WHATSAPP_FROM="+14155238886"
    # TWILIO_WHATSAPP_TO_TEST="+34123456789" # Un número para tus pruebas
    ```

> 📚 Para una explicación detallada de todas las variables posibles (incluidas las de Firebase, Auth0, etc.), consulta la [**Guía de Despliegue**](./DEPLOYMENT.md).

---

## Paso 5: Arrancar la Aplicación

Con todo configurado, ya puedes iniciar el servidor de desarrollo.

```bash
npm run dev
```

La aplicación debería estar disponible en `http://localhost:3000` (o el puerto que indique la terminal).

---

## Paso 6: Población de Datos Inicial

La primera vez que ejecutes la aplicación, la base de datos local (Dexie.js) estará vacía. Para facilitar el desarrollo, el sistema la poblará automáticamente con datos de ejemplo.

-   **¿Cómo funciona?:** El archivo `src/lib/db-providers/dexie.ts` contiene una función `populateDatabase()` que se ejecuta al inicio. Si no detecta un usuario administrador (`user_1`), borra todas las tablas y las llena con los datos definidos en `src/lib/data.ts`.
-   **Inicio de Sesión:** Puedes usar cualquiera de las cuentas de prueba definidas en `src/app/login/page.tsx` para acceder. Por ejemplo, el usuario administrador:
    -   **Email:** `elena.vargas@example.com`
    -   **Contraseña:** `password123`
-   **Sincronización:** Recuerda que estos datos iniciales solo existen en tu navegador. Para subirlos a Supabase, ve a `Ajustes > Sincronización` y ejecuta el proceso de sincronización manual.

¡Y eso es todo! Ahora tienes un entorno de desarrollo de TalentOS completamente funcional.
