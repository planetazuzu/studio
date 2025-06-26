# Esquema de Tablas para NocoDB

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
| `status` | `SingleSelect` | Opciones: `pending`, `approved`, `rejected` |
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

Con estas cuatro tablas configuradas en NocoDB, tendrás la base de datos remota lista para la sincronización.
