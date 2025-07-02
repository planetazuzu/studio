# Guía de Despliegue en Servidor Ubuntu

Esta guía detalla los pasos para desplegar la aplicación TalentOS en un servidor Ubuntu (20.04 o superior). Se recomienda tener conocimientos básicos de administración de sistemas Linux.

---

### Requisitos Previos

-   Un servidor Ubuntu (VPS, EC2, etc.) con acceso SSH.
-   Un nombre de dominio apuntando a la IP de tu servidor (recomendado para producción).
-   Acceso `sudo` en el servidor.

---

## Paso 1: Conectar al Servidor

Conéctate a tu servidor a través de SSH.

```bash
ssh tu_usuario@IP_DEL_SERVIDOR
```

---

## Paso 2: Instalar Dependencias del Sistema

Necesitamos instalar `git`, `Node.js` y `pm2` (un gestor de procesos para Node.js).

**1. Actualizar el sistema:**
```bash
sudo apt update
sudo apt upgrade
```

**2. Instalar Git:**
```bash
sudo apt install git
```

**3. Instalar Node.js (usando nvm, recomendado):**
`nvm` (Node Version Manager) facilita la gestión de versiones de Node.

```bash
# Instalar nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Cargar nvm en la sesión actual
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

# Instalar Node.js v20 (LTS)
nvm install 20

# Usar la versión instalada
nvm use 20
```

**4. Instalar PM2 globalmente:**
`pm2` mantendrá nuestra aplicación corriendo continuamente.

```bash
npm install pm2 -g
```

---

## Paso 3: Clonar y Configurar la Aplicación

**1. Clona el repositorio:**
```bash
git clone https://URL_DE_TU_REPOSITORIO.git talentos
cd talentos
```

**2. Instala las dependencias del proyecto:**
```bash
npm install
```

**3. Configura las variables de entorno:**
Crea un archivo `.env.local` y añade las claves necesarias. **Nunca subas este archivo a Git.**

```bash
nano .env.local
```

Pega tus variables dentro del editor. Consulta el archivo `docs/DEPLOYMENT.md` para ver la lista completa de variables (`NOCODB_API_URL`, `GOOGLE_API_KEY`, etc.).

```
NOCODB_API_URL=https://app.nocodb.com/api/v2
NOCODB_AUTH_TOKEN=tu_token_aqui
GOOGLE_API_KEY=tu_clave_de_google_aqui
# ...y las demás variables que necesites
```

Guarda el archivo (`Ctrl+X`, luego `Y`, y `Enter`).

**4. Construye la aplicación para producción:**
```bash
npm run build
```

---

## Paso 4: Iniciar la Aplicación con PM2

Ahora, iniciaremos la aplicación con `pm2` para que se ejecute en segundo plano.

```bash
pm2 start npm --name "talentos" -- start
```

-   `--name "talentos"`: Asigna un nombre al proceso.
-   `-- start`: Ejecuta el comando `npm start`.

**Comandos útiles de PM2:**
-   `pm2 list`: Muestra todos los procesos.
-   `pm2 logs talentos`: Muestra los logs de la aplicación.
-   `pm2 restart talentos`: Reinicia la aplicación.
-   `pm2 stop talentos`: Detiene la aplicación.

**Guardar la lista de procesos de PM2:**
Para que la aplicación se reinicie automáticamente si el servidor se reinicia, ejecuta:

```bash
pm2 startup
# Sigue las instrucciones que te dará el comando anterior
pm2 save
```

---

## Paso 5: (Recomendado) Configurar Nginx como Reverse Proxy

Por defecto, la aplicación corre en el puerto 3000. Para exponerla de forma segura en un puerto público (como el 8077 que has solicitado), usamos Nginx.

**1. Instalar Nginx:**
```bash
sudo apt install nginx
```

**2. Crear un archivo de configuración para tu sitio:**
Reemplaza `tu_dominio.com` con tu dominio real.

```bash
sudo nano /etc/nginx/sites-available/tu_dominio.com
```

**3. Pega la siguiente configuración:**
Esta configuración básica redirige el tráfico del puerto 8077 al puerto 3000 donde corre tu app.

```nginx
server {
    listen 8077;
    server_name tu_dominio.com www.tu_dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Guarda y cierra el archivo (`Ctrl+X`, `Y`, `Enter`).

**4. Habilita la configuración y reinicia Nginx:**

```bash
# Crea un enlace simbólico al directorio sites-enabled
sudo ln -s /etc/nginx/sites-available/tu_dominio.com /etc/nginx/sites-enabled/

# Comprueba que no haya errores de sintaxis
sudo nginx -t

# Reinicia Nginx para aplicar los cambios
sudo systemctl restart nginx
```

**5. Configurar Firewall (si está activo):**
Si usas `ufw` (Uncomplicated Firewall), necesitas permitir el tráfico al nuevo puerto.
```bash
sudo ufw allow 8077/tcp
```

¡Listo! Tu aplicación debería estar accesible en `http://tu_dominio.com:8077`.

---

### Paso Adicional: Configurar HTTPS con Let's Encrypt (Certbot)

Para producción, es crucial usar HTTPS. Certbot lo hace muy fácil, pero **generalmente requiere que tu sitio esté accesible en el puerto 80 estándar** para la verificación.

Si deseas usar Certbot, lo más sencillo es configurar temporalmente Nginx para que escuche en el puerto 80, ejecutar Certbot, y luego volver a cambiarlo al puerto 8077 (Certbot modificará tu archivo de configuración para añadir SSL, escuchando en el puerto 443).

```bash
# Instala Certbot y su plugin para Nginx
sudo apt install certbot python3-certbot-nginx

# (Opcional, recomendado) Configura Nginx en el puerto 80, ejecuta el comando de abajo, y luego vuelve a tu puerto personalizado.
sudo certbot --nginx -d tu_dominio.com -d www.tu_dominio.com
```

Sigue las instrucciones en pantalla. Certbot modificará tu archivo de Nginx para configurar SSL y renovará los certificados automáticamente.
