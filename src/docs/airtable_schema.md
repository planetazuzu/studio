# Esquema de Tablas para Airtable

> **Nota sobre la Arquitectura:** Este archivo define el esquema para la base de datos remota en **Airtable**, que actúa como el backend persistente. La aplicación utiliza **Dexie.js** (IndexedDB) como una base de datos local rápida en el navegador para una experiencia "offline-first". Los datos se sincronizan desde Dexie a estas tablas de Airtable a través del "Gestor de Sincronización" en los ajustes de la aplicación.

Aquí tienes la estructura de las tablas principales que necesitas configurar en tu base de Airtable para la aplicación TalentOS.

**Consejo:** Los nombres de las tablas y los campos deben ser exactos (respetando mayúsculas y minúsculas) para que la sincronización funcione.

---

## 1. Tabla de Usuarios (`Users`)

Almacena la información de cada persona en la plataforma.

| Nombre del Campo (`Field Name`) | Tipo de Campo (`Field Type`) | Notas |
| :--- | :--- | :--- |
| `id` | `Single line text` | **Clave Primaria (Primary Field)** |
| `name` | `Single line text` | |
| `email` | `Email` | |
| `avatar` | `URL` | |
| `role` | `Single select` | Opciones: `Trabajador`, `Formador`, `Gestor de RRHH`, etc. |
| `department` | `Single select` | Opciones: `Técnicos`, `Teleoperadores`, etc. |
| `updatedAt` | `Last modified time` | Airtable lo gestiona automáticamente. |

---

## 2. Tabla de Cursos (`Courses`)

Contiene todos los detalles de las formaciones.

| Nombre del Campo | Tipo de Campo | Notas |
| :--- | :--- | :--- |
| `id` | `Single line text` | **Clave Primaria (Primary Field)** |
| `title` | `Single line text` | |
| `description` | `Long text` | |
| `longDescription` | `Long text` | Activar "Enable rich text formatting". |
| `instructor` | `Single line text` | |
| `duration` | `Single line text` | |
| `modality` | `Single select` | Opciones: `Online`, `Presencial`, `Mixta` |
| `image` | `URL` | |
| `status` | `Single select` | Opciones: `draft`, `published` |
| `capacity` | `Number` | Formato: Integer |
| `modules` | `Long text` | Se guardará como una cadena JSON. |
| `mandatoryForRoles` | `Long text` | Se guardará como una cadena JSON. |
| `updatedAt` | `Last modified time` | |

---

## 3. Tabla de Inscripciones (`Enrollments`)

Registra qué usuario está inscrito en qué curso y el estado de la solicitud.

| Nombre del Campo | Tipo de Campo | Notas |
| :--- | :--- | :--- |
| `id` | `Autonumber` | **Clave Primaria (Primary Field)** |
| `student` | `Link to another record` | Enlazar a la tabla `Users`. |
| `course` | `Link to another record` | Enlazar a la tabla `Courses`. |
| `status` | `Single select` | Opciones: `pending`, `approved`, `rejected`, etc. |
| `updatedAt` | `Last modified time` | |

---

## 4. Tabla de Progreso (`UserProgress`)

Guarda el progreso de cada usuario en cada curso.

| Nombre del Campo | Tipo de Campo | Notas |
| :--- | :--- | :--- |
| `id` | `Autonumber` | **Clave Primaria (Primary Field)** |
| `user` | `Link to another record` | Enlazar a la tabla `Users`. |
| `course` | `Link to another record` | Enlazar a la tabla `Courses`. |
| `completedModules` | `Long text` | Se guardará como una cadena JSON. |
| `updatedAt` | `Last modified time` | |

---

Con estas tablas configuradas en Airtable, tendrás una base de datos remota lista para la sincronización. Asegúrate de que los nombres de las tablas y los campos coincidan exactamente.
