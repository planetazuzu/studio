# Esquema de Tablas para Supabase

> **Nota sobre la Arquitectura:** Este archivo define el esquema para la base de datos en **Supabase**, que actúa como el backend persistente.

Aquí tienes la estructura de las tablas principales que necesitas configurar en tu base de Supabase para la aplicación TalentOS.

**Consejo:** Los nombres de las tablas y los campos deben ser exactos (respetando mayúsculas y minúsculas) para que la aplicación funcione. Ve al "Table Editor" en tu proyecto de Supabase para crearlas.

---

### Activación de Políticas de Seguridad (RLS)

Por seguridad, es **crucial** que actives "Row Level Security" (RLS) para cada tabla que crees. Una vez activado, deberás crear políticas (policies) para permitir el acceso. Para empezar, puedes crear una política simple que permita el acceso a todos los usuarios autenticados.

**Ejemplo de Política "Permitir Acceso a Usuarios Autenticados":**
- **Policy Name:** `Allow authenticated read access`
- **Target Roles:** `authenticated`
- **USING expression:** `true`
- **WITH CHECK expression:** `true` (Para INSERT y UPDATE)

---

## 1. Tabla de Usuarios (`Users`)

Almacena la información de cada persona en la plataforma.

| Nombre de la Columna | Tipo de Dato | Notas |
| :--- | :--- | :--- |
| `id` | `uuid` | **Clave Primaria (Primary Key)**. Debe ser una referencia (Foreign Key) a `auth.users.id`. |
| `name` | `text` | |
| `email` | `text` | Debe ser único. |
| `avatar` | `text` | URL de la imagen. |
| `role` | `text` | |
| `department` | `text` | |
| `points` | `int4` | Valor por defecto: `0` |
| `status` | `text` | `approved`, `pending_approval`, `suspended` |
| `notificationSettings` | `jsonb` | |
| `fcmToken` | `text` | Puede ser nulo. |
| `updatedAt` | `timestamptz` | Valor por defecto: `now()` |

---

## 2. Tabla de Cursos (`Courses`)

Contiene todos los detalles de las formaciones.

| Nombre de la Columna | Tipo de Dato | Notas |
| :--- | :--- | :--- |
| `id` | `text` | **Clave Primaria (Primary Key)**. |
| `title` | `text` | |
| `description` | `text` | |
| `longDescription` | `text` | |
| `instructor` | `text` | |
| `duration` | `text` | |
| `modality` | `text` | `Online`, `Presencial`, `Mixta` |
| `image` | `text` | URL de la imagen. |
| `status` | `text` | `draft`, `published` |
| `capacity` | `int4` | Puede ser nulo. |
| `modules` | `jsonb` | |
| `mandatoryForRoles` | `jsonb` | |
| `updatedAt` | `timestamptz` | Valor por defecto: `now()` |
| `aiHint` | `text` | |
| `isScorm` | `boolean` | Valor por defecto: `false` |

---

## 3. Tabla de Inscripciones (`Enrollments`)

Registra qué usuario está inscrito en qué curso.

| Nombre de la Columna | Tipo de Dato | Notas |
| :--- | :--- | :--- |
| `id` | `bigint` | **Clave Primaria (Primary Key)**, autoincremental. |
| `studentId` | `uuid` | Foreign Key a `Users.id`. |
| `courseId` | `text` | Foreign Key a `Courses.id`. |
| `status` | `text` | `pending`, `approved`, `rejected`, etc. |
| `requestDate` | `timestamptz` | Valor por defecto: `now()` |
| `updatedAt` | `timestamptz` | Valor por defecto: `now()` |

---

## 4. Tabla de Progreso (`UserProgress`)

Guarda el progreso de cada usuario en cada curso.

| Nombre de la Columna | Tipo de Dato | Notas |
| :--- | :--- | :--- |
| `id` | `bigint` | **Clave Primaria (Primary Key)**, autoincremental. |
| `userId` | `uuid` | Foreign Key a `Users.id`. |
| `courseId` | `text` | Foreign Key a `Courses.id`. |
| `completedModules` | `jsonb` | |
| `updatedAt` | `timestamptz` | Valor por defecto: `now()` |

---

Con estas tablas configuradas en Supabase, tendrás una base de datos lista para funcionar con la aplicación. Asegúrate de que los nombres de las tablas y las columnas coincidan exactamente.