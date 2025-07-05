
# AcademiaAI: Plataforma de Formación Corporativa con IA

AcademiaAI es una plataforma de aprendizaje (LMS) moderna, diseñada para empresas que buscan potenciar el talento de sus equipos a través de una experiencia formativa inteligente, personalizada y eficiente. Construida con Next.js y Dexie.js, opera bajo una filosofía "offline-first" y utiliza la IA de Genkit como núcleo para automatizar y enriquecer el proceso educativo.

## Funcionalidades Clave

-   **Gestión Integral de Cursos:** Creación manual, importación de paquetes SCORM y un potente generador de cursos basado en IA.
-   **Experiencia de Aprendizaje Personalizada:** Tutor virtual con IA, foros de discusión por curso, y un calendario de eventos formativos.
-   **Gamificación:** Sistema de puntos, insignias por logros y una clasificación general para fomentar la participación.
-   **Gestión de Usuarios Avanzada:** Roles y permisos personalizables, flujo de aprobación para nuevos usuarios e importación masiva desde CSV.
-   **Planes de Carrera:** Define rutas de aprendizaje guiadas y secuenciales para roles específicos.
-   **Análisis y Reportes:** Dashboards visuales para analizar el progreso de la formación, los costes asociados y el cumplimiento de los cursos obligatorios.
-   **Administración Centralizada:** Sincronización con bases de datos externas (NocoDB), gestión de APIs y configuración granular de las funcionalidades de IA.
-   **Comunicación Integrada:** Chat interno entre usuarios, sistema de anuncios y notificaciones multicanal (Email, WhatsApp, Push).

## Documentación del Proyecto

Para entender completamente la aplicación, su arquitectura y cómo ponerla en marcha, consulta las siguientes guías:

| Documento                                   | Descripción                                                                                              |
| :------------------------------------------ | :------------------------------------------------------------------------------------------------------- |
| 📄 **[Resumen de la Aplicación](./docs/APP_OVERVIEW.md)** | Detalla la arquitectura, la filosofía y el desglose completo de todas las funcionalidades. **¡Empieza aquí!** |
| 🚀 **[Guía de Configuración](./docs/SETUP_GUIDE.md)**     | Pasos para clonar, instalar y configurar el entorno de desarrollo local.                         |
| ☁️ **[Guía de Despliegue](./docs/DEPLOYMENT.md)**         | Instrucciones para desplegar la aplicación en producción y configurar las variables de entorno.    |
| 🗃️ **[Esquema de NocoDB](./docs/nocodb_schema.md)**       | Define la estructura de las tablas necesarias en tu instancia de NocoDB para la sincronización.   |

## Tech Stack

-   **Framework:** [Next.js](https://nextjs.org/) (App Router)
-   **Lenguaje:** [TypeScript](https://www.typescriptlang.org/)
-   **Estilos:** [Tailwind CSS](https://tailwindcss.com/)
-   **Componentes UI:** [Shadcn/ui](https://ui.shadcn.com/)
-   **Base de Datos Local:** [Dexie.js](https://dexie.org/) (wrapper de IndexedDB)
-   **Inteligencia Artificial:** [Genkit](https://firebase.google.com/docs/genkit) (con modelos de Google Gemini)
-   **Autenticación:** Sistema local basado en Dexie.js (modularizado para soportar otros proveedores).
-   **Backend Externo (Opcional):** [NocoDB](https://www.nocodb.com/)
