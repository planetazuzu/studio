# Guía de Configuración de NocoDB

Esta guía te ayudará a configurar tu instancia de NocoDB para que funcione correctamente con la aplicación TalentOS.

---

### ¿Qué es NocoDB y por qué lo usamos?

**NocoDB** es una plataforma de código abierto que transforma cualquier base de datos en una "base de datos inteligente" con una interfaz similar a una hoja de cálculo (como Airtable) y, lo más importante, una **API REST que se genera automáticamente**.

En este proyecto, la aplicación utiliza una base de datos local en el navegador (Dexie/IndexedDB) para ser increíblemente rápida y funcionar sin conexión. NocoDB actúa como nuestro **backend persistente en la nube**. La función de "Sincronización" en los ajustes de la aplicación se encarga de enviar los datos desde el navegador a tu instancia de NocoDB para tener una copia de seguridad y centralizada.

---

## Paso 1: Obtener tus Credenciales de NocoDB

Antes de que la aplicación pueda conectarse, necesitas dos piezas de información de tu proyecto en NocoDB:

1.  **La URL de la API (API URL)**
2.  **El Token de Autenticación (Auth Token)**

**Cómo encontrarlos:**

*   **Si usas NocoDB Cloud:**
    1.  Ve a tu dashboard en [NocoDB](https://app.nocodb.com/).
    2.  Abre tu proyecto.
    3.  La **URL base de tu API** es `https://app.nocodb.com/api/v2`.
    4.  Para el **Token**, ve a `Project Settings` > `API Tokens`. Crea un nuevo token (dale un nombre como "TalentOS App") y copia la clave generada.

*   **Si tienes NocoDB auto-alojado (Self-Hosted):**
    1.  La **URL base de tu API** será la dirección de tu servidor seguida de `/api/v2`. Ejemplo: `http://tu-dominio.com/api/v2`.
    2.  Para el **Token**, dentro de tu proyecto, ve a la sección de `Equipo y Ajustes` > `Tokens de API`. Crea un nuevo token y copia la clave.

**¡Guarda estos dos valores! Los necesitarás en el Paso 3.**

---

## Paso 2: Crear las Tablas en tu Proyecto

Ahora, necesitas crear las tablas que la aplicación utilizará para almacenar los datos. La estructura exacta es muy importante.

1.  **Abre tu proyecto en NocoDB.**
2.  **Crea una nueva tabla** por cada una de las que se listan a continuación.
3.  Para cada tabla, **añade las columnas** exactamente como se especifica en nuestra guía del esquema.

> 🔗 **Guía de Referencia Obligatoria:**
>
> Para ver los nombres de las columnas, los tipos de datos (`SingleLineText`, `LinkToAnotherRecord`, etc.) y las relaciones, consulta el archivo: `docs/nocodb_schema.md`.

**Lista de Tablas a Crear:**
*   `users` (Usuarios)
*   `courses` (Cursos)
*   `enrollments` (Inscripciones)
*   `userProgress` (Progreso de Usuario)
*   `announcements` (Anuncios)
*   `calendar_events` (Eventos del Calendario)
*   `external_trainings` (Formación Externa)
*   `resources` (Recursos)
*   `costs` (Costes)

**Consejo:** Presta especial atención a las columnas de tipo `LinkToAnotherRecord`, ya que estas crean las relaciones entre las tablas (por ejemplo, qué usuario está inscrito en qué curso).

---

## Paso 3: Configurar la Aplicación

Con las credenciales obtenidas y las tablas creadas, el último paso es configurar la aplicación TalentOS.

1.  **Inicia la aplicación** y entra con una cuenta de administrador.
2.  Ve a la sección **Ajustes** en el menú lateral.
3.  Selecciona la pestaña **APIs & Sincronización**.
4.  Busca la sección "NocoDB (Base de Datos Remota)".
5.  **Pega la URL de la API** y el **Token de Autenticación** que obtuviste en el Paso 1 en sus respectivos campos.
6.  Haz clic en **"Guardar Configuración de NocoDB"**.

¡Y listo! Si todo ha ido bien, la aplicación ya está conectada a tu backend. Ahora puedes ir a la sección "Sincronización con NocoDB" y probar a enviar los datos.
