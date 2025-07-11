
# Guía de Configuración de Airtable

Esta guía te ayudará a configurar tu base de Airtable para que funcione correctamente con la aplicación TalentOS.

---

### ¿Qué es Airtable y por qué lo usamos?

**Airtable** es una plataforma que combina la simplicidad de una hoja de cálculo con la potencia de una base de datos. Permite crear bases de datos relacionales con una interfaz de usuario amigable y una potente API.

En este proyecto, la aplicación utiliza una base de datos local en el navegador (Dexie/IndexedDB) para ser increíblemente rápida y funcionar sin conexión. Airtable actúa como nuestro **backend persistente en la nube**. La función de "Sincronización" en los ajustes de la aplicación se encarga de enviar los datos desde el navegador a tu base de Airtable.

---

## Paso 1: Crear la Base en Airtable

1.  **Regístrate o inicia sesión** en [Airtable](https://airtable.com/).
2.  **Crea una nueva base (Base)** desde cero. Puedes llamarla "TalentOS" o como prefieras.

---

## Paso 2: Crear las Tablas en tu Base

Ahora, necesitas crear las tablas que la aplicación utilizará para almacenar los datos. La estructura exacta (nombres de tablas y campos) es muy importante.

1.  **Abre tu nueva base en Airtable.**
2.  **Crea una nueva tabla** por cada una de las que se listan a continuación, asegurándote de que el nombre sea exacto.
3.  Para cada tabla, **añade los campos (columnas)** exactamente como se especifica en nuestra guía del esquema.

> 🔗 **Guía de Referencia Obligatoria:**
>
> Para ver los nombres de las tablas, los nombres de los campos y los tipos de datos (`Single line text`, `Link to another record`, etc.), consulta el archivo: `docs/airtable_schema.md`.

**Lista de Tablas a Crear:**
*   `Users` (Usuarios)
*   `Courses` (Cursos)
*   `Enrollments` (Inscripciones)
*   `UserProgress` (Progreso de Usuario)
*   *... y las demás tablas definidas en el esquema.*

**Consejo:** Presta especial atención a los campos de tipo `Link to another record`, ya que estos crean las relaciones entre las tablas (por ejemplo, qué usuario está inscrito en qué curso).

---

## Paso 3: Obtener tus Credenciales de Airtable

Antes de que la aplicación pueda conectarse, necesitas dos piezas de información de tu cuenta y base de Airtable:

1.  **La Clave de API (API Key)**
2.  **El ID de la Base (Base ID)**

**Cómo encontrarlos:**

1.  **Clave de API:**
    *   Ve a la página de tu cuenta de Airtable: [airtable.com/account](https://airtable.com/account).
    *   En la sección `API`, genera una nueva clave de API si no tienes una.
    *   **Copia esta clave.** Es secreta y no debes compartirla públicamente.

2.  **ID de la Base:**
    *   Abre tu base de "TalentOS".
    *   Ve a la página de ayuda de la API: [airtable.com/api](https://airtable.com/api).
    *   Selecciona tu base de "TalentOS" de la lista.
    *   La página de documentación de la API se abrirá. La URL tendrá un formato como `https://airtable.com/appXXXXXXXXXXXXXX/api/docs`.
    *   El **ID de la Base** es la parte que empieza por `app` (ej. `appXXXXXXXXXXXXXX`).
    *   **Copia este ID.**

**¡Guarda estos dos valores! Los necesitarás en el siguiente paso.**

---

## Paso 4: Configurar la Aplicación

Con las credenciales obtenidas y las tablas creadas, el último paso es configurar la aplicación TalentOS.

1.  **Inicia la aplicación** y entra con una cuenta de administrador.
2.  Ve a la sección **Ajustes** en el menú lateral.
3.  Selecciona la pestaña **APIs & Sincronización**.
4.  Busca la sección "Airtable (Base de Datos Remota)".
5.  **Pega la Clave de API** y el **ID de la Base** que obtuviste en el Paso 3 en sus respectivos campos.
6.  Haz clic en **"Guardar Todas las Configuraciones"**.

¡Y listo! Si todo ha ido bien, la aplicación ya está conectada a tu backend de Airtable. Ahora puedes ir a la sección "Sincronización con Airtable" y probar a enviar los datos.
