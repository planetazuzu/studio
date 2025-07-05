# Esquema de Tablas para NocoDB

> **Nota sobre la Arquitectura:** Este archivo define el esquema para la base de datos remota en **NocoDB**, que actúa como el backend persistente. La aplicación utiliza **Dexie.js** (IndexedDB) como una base de datos local rápida en el navegador para una experiencia "offline-first". Los datos se sincronizan desde Dexie a estas tablas de NocoDB a través del "Gestor de Sincronización" en los ajustes de la aplicación.

Aquí tienes la estructura de las tablas principales que necesitas configurar en tu instancia de NocoDB para la aplicación AcademiaAI.

**Consejo:** Presta especial atención a los tipos de columna (`Column Type`) y a las relaciones (`Links`).

---

## 1. Tabla de Usuarios (`users`)

Almacena la información de cada persona en la plataforma.

| Nombre de Columna (`Column Name`) | Tipo de Columna (`Column Type`) | Notas |
| :--- | :--- | :--- |
| `id` | `SingleLineText` | **Clave Primaria (Primary Key)** |
| `name` | `SingleLineText` | |
| `email` | `Email` | Marcar como **Requerido** y **Único** |
| `avatar` | `URL` | |
| `role` | `SingleSelect` | Opciones: `Trabajador`, `Formador`, etc. |
| `department` | `SingleSelect` | Opciones: `Técnicos`, `Teleoperadores`, etc. |
| `password` | `SingleLineText` | (Opcional, para referencia. La autenticación se hace localmente) |
| `updatedAt` | `LastModifiedTime` | NocoDB lo puede gestionar automáticamente |

---

## 2. Tabla de Cursos (`courses`)

Contiene todos los detalles de las formaciones.

| Nombre de Columna | Tipo de Columna | Notas |
| :--- | :--- | :--- |
| `id` | `SingleLineText` | **Clave Primaria (Primary Key)** |
| `title` | `SingleLineText` | |
| `description` | `LongText` | |
| `longDescription` | `LongText` | |
| `instructor` | `SingleLineText` | |
| `duration` | `SingleLineText` | |
| `modality` | `SingleSelect` | Opciones: `Online`, `Presencial`, `Mixta` |
| `image` | `URL` | |
| `status` | `SingleSelect` | Opciones: `draft`, `published` |
| `modules` | `Json` | |
| `mandatoryForRoles` | `Json` | |
| `updatedAt` | `LastModifiedTime` | |

---

## 3. Tabla de Inscripciones (`enrollments`)

Registra qué usuario está inscrito en qué curso y el estado de la solicitud.

| Nombre de Columna | Tipo de Columna | Notas |
| :--- | :--- | :--- |
| `id` | `Id` | **Clave Primaria Autoincremental** |
| `student` | `LinkToAnotherRecord` | **Relación Muchos a Uno (ManyToOne)** a la tabla `users` |
| `course` | `LinkToAnotherRecord` | **Relación Muchos a Uno (ManyToOne)** a la tabla `courses` |
| `status` | `SingleSelect` | Opciones: `pending`, `approved`, `rejected`, etc. |
| `updatedAt` | `LastModifiedTime` | |

*Nota sobre relaciones: NocoDB creará las columnas `studentId` y `courseId` automáticamente al configurar el enlace.*

---

## 4. Tabla de Progreso (`userProgress`)

Guarda el progreso de cada usuario en cada curso.

| Nombre de Columna | Tipo de Columna | Notas |
| :--- | :--- | :--- |
| `id` | `Id` | **Clave Primaria Autoincremental** |
| `user` | `LinkToAnotherRecord` | **Relación Muchos a Uno (ManyToOne)** a la tabla `users` |
| `course` | `LinkToAnotherRecord` | **Relación Muchos a Uno (ManyToOne)** a la tabla `courses` |
| `completedModules` | `Json` | |
| `updatedAt` | `LastModifiedTime` | |

---

## 5. Tabla de Planes de Carrera (`learning_paths`)

Define las rutas de aprendizaje guiadas para los roles.

| Nombre de Columna (`Column Name`) | Tipo de Columna (`Column Type`) | Notas |
| :--- | :--- | :--- |
| `id` | `Id` | **Clave Primaria Autoincremental** |
| `title` | `SingleLineText` | |
| `description` | `LongText` | |
| `targetRole` | `SingleSelect` | Opciones: `Trabajador`, `Jefe de Formación`, etc. |
| `courseIds` | `Json` | Almacena el array ordenado de IDs de curso |
| `updatedAt` | `LastModifiedTime` | |

---

## 6. Tabla de Progreso en Planes de Carrera (`user_learning_path_progress`)

Registra el avance de un usuario en un plan de carrera específico.

| Nombre de Columna | Tipo de Columna | Notas |
| :--- | :--- | :--- |
| `id` | `Id` | **Clave Primaria Autoincremental** |
| `user` | `LinkToAnotherRecord` | **Relación Muchos a Uno (ManyToOne)** a la tabla `users` |
| `learningPath` | `LinkToAnotherRecord` | **Relación Muchos a Uno (ManyToOne)** a la tabla `learning_paths` |
| `completedCourseIds` | `Json` | Almacena el array de IDs de cursos completados |
| `updatedAt` | `LastModifiedTime` | |

---

## 7. Tabla de Anuncios (`announcements`)

Almacena todas las comunicaciones y avisos enviados a los usuarios.

| Nombre de Columna | Tipo de Columna | Notas |
| :--- | :--- | :--- |
| `id` | `Id` | **Clave Primaria Autoincremental** |
| `title` | `SingleLineText` | |
| `content` | `LongText` | |
| `type` | `SingleSelect` | Opciones: `Urgente`, `Informativo`, `Mantenimiento` |
| `channels` | `Json` | Almacena los roles/departamentos de destino |
| `timestamp` | `DateTime` | |
| `updatedAt` | `LastModifiedTime` | |

---

## 8. Tabla de Eventos del Calendario (`calendar_events`)

Registra todos los eventos formativos como clases, exámenes o entregas.

| Nombre de Columna | Tipo de Columna | Notas |
| :--- | :--- | :--- |
| `id` | `Id` | **Clave Primaria Autoincremental** |
| `title` | `SingleLineText` | |
| `description` | `LongText` | |
| `start` | `DateTime` | Fecha y hora de inicio |
| `end` | `DateTime` | Fecha y hora de fin |
| `allDay` | `Checkbox` | |
| `course` | `LinkToAnotherRecord` | **Relación Muchos a Uno (ManyToOne)** a la tabla `courses` |
| `type` | `SingleSelect` | Opciones: `clase`, `examen`, `entrega`, `taller`, `otro` |
| `createdBy` | `LinkToAnotherRecord` | **Relación Muchos a Uno (ManyToOne)** a la tabla `users` |
| `updatedAt` | `LastModifiedTime` | |

---

## 9. Tabla de Formación Externa (`external_trainings`)

Permite a los usuarios registrar sus logros formativos obtenidos fuera de la plataforma.

| Nombre de Columna | Tipo de Columna | Notas |
| :--- | :--- | :--- |
| `id` | `Id` | **Clave Primaria Autoincremental** |
| `user` | `LinkToAnotherRecord` | **Relación Muchos a Uno (ManyToOne)** a la tabla `users` |
| `title` | `SingleLineText` | |
| `type` | `SingleSelect` | Opciones: `Curso`, `Certificación`, `Máster`, etc. |
| `institution` | `SingleLineText` | |
| `endDate` | `Date` | Fecha de finalización |
| `fileUrl` | `URL` | Enlace al certificado |
| `comments` | `LongText` | |
| `updatedAt` | `LastModifiedTime` | |

---

## 10. Tabla de Recursos (`resources`)

Biblioteca central de materiales de estudio (PDF, vídeos, etc.).

| Nombre de Columna | Tipo de Columna | Notas |
| :--- | :--- | :--- |
| `id` | `Id` | **Clave Primaria Autoincremental** |
| `name` | `SingleLineText` | |
| `type` | `SingleSelect` | Opciones: `pdf`, `video`, `link`, `document` |
| `url` | `URL` | Enlace al recurso |
| `uploadedAt` | `DateTime` | |
| `courses` | `LinkToAnotherRecord` | **Relación Muchos a Muchos (ManyToMany)** a la tabla `courses` |
| `updatedAt` | `LastModifiedTime` | |

---

## 11. Tabla de Costes (`costs`)

Almacena los gastos asociados a la formación.

| Nombre de Columna | Tipo de Columna | Notas |
|:--- |:--- |:--- |
| `id` | `Id` | **Clave Primaria Autoincremental** |
| `item` | `SingleLineText` | Concepto del gasto |
| `category` | `SingleSelect` | Opciones: `Honorarios Formador`, `Licencias`, etc. |
| `amount` | `Decimal` | Importe del gasto |
| `date` | `Date` | Fecha del gasto |
| `course` | `LinkToAnotherRecord` | **Relación Muchos a Uno (ManyToOne)** a la tabla `courses` |
| `updatedAt` | `LastModifiedTime` | |


---

Con estas tablas configuradas en NocoDB, tendrás una base de datos remota más completa y lista para la sincronización.
