# Despliegue en Ubuntu Server

Guía paso a paso para desplegar **IoT-proyect** (backend + frontend + Mosquitto MQTT) en un servidor Ubuntu.

## Requisitos previos

- Servidor con **Ubuntu Server 22.04 o 24.04** (VPS, EC2, máquina local, etc.)
- Acceso SSH con usuario con permisos `sudo`
- IP pública o IP local accesible desde tu red
- Repositorio en GitHub (o forma de copiar el código al servidor)

## Puertos a abrir

| Puerto | Servicio        | Uso                          |
|--------|-----------------|------------------------------|
| 22     | SSH             | Administración del servidor  |
| 3000   | Node.js/Express | API + interfaz web           |
| 1883   | Mosquitto MQTT  | Comunicación con el ESP32    |

---

## Paso 1 — Conectarse al servidor

Desde tu PC:

```bash
ssh usuario@IP_DEL_SERVIDOR
```

Sustituye `usuario` (ej. `ubuntu`) e `IP_DEL_SERVIDOR` por los valores reales.

---

## Paso 2 — Actualizar el sistema

```bash
sudo apt update
sudo apt upgrade -y
```

---

## Paso 3 — Instalar dependencias básicas

```bash
sudo apt install -y git curl build-essential
```

---

## Paso 4 — Instalar Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

Comprueba la instalación:

```bash
node -v   # debe mostrar v20.x
npm -v
```

---

## Paso 5 — Instalar y configurar Mosquitto (MQTT)

```bash
sudo apt install -y mosquitto mosquitto-clients
```

Crea el archivo de configuración del proyecto:

```bash
sudo nano /etc/mosquitto/conf.d/smarthome.conf
```

Pega este contenido:

```conf
listener 1883
allow_anonymous true
```

> **Nota de seguridad:** `allow_anonymous true` es válido para un proyecto de aprendizaje. En producción real conviene usar usuario/contraseña MQTT.

Reinicia Mosquitto:

```bash
sudo systemctl restart mosquitto
sudo systemctl enable mosquitto
sudo systemctl status mosquitto
```

Debe aparecer `active (running)`.

Prueba MQTT en el propio servidor:

```bash
# Terminal 1
mosquitto_sub -h localhost -t "test" -v

# Terminal 2 (otra sesión SSH)
mosquitto_pub -h localhost -t "test" -m "hola"
```

Si en la primera terminal ves `test hola`, Mosquitto funciona.

---

## Paso 6 — Configurar el firewall (UFW)

Si usas UFW:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 3000/tcp
sudo ufw allow 1883/tcp
sudo ufw enable
sudo ufw status
```

> En **AWS EC2** también debes abrir los puertos **3000** y **1883** en el *Security Group* de la instancia.

---

## Paso 7 — Clonar el proyecto

```bash
cd ~
git clone https://github.com/juan745Guevara/IoT-proyect.git
cd IoT-proyect
```

Si tu repo es otro, cambia la URL.

---

## Paso 8 — Configurar variables del frontend

Antes de compilar, edita la URL del API con la IP pública del servidor:

```bash
nano frontend/.env.production
```

Debe quedar así (sustituye la IP):

```env
VITE_API_URL=http://IP_DEL_SERVIDOR:3000
```

Ejemplo:

```env
VITE_API_URL=http://54.123.45.67:3000
```

> Esta variable se embebe en el build. Si cambias la IP, debes volver a compilar el frontend.

---

## Paso 9 — Instalar dependencias y compilar

Desde la raíz del proyecto:

```bash
npm run install:all
npm run build:frontend
```

Comprueba que existe la carpeta compilada:

```bash
ls frontend/dist
```

Deberías ver `index.html` y la carpeta `assets/`.

---

## Paso 10 — Probar el backend manualmente

```bash
npm start
```

Deberías ver algo como:

```text
[HTTP] Sirviendo frontend desde frontend/dist
[HTTP] Servidor escuchando en http://localhost:3000
[MQTT] Conectado al broker en mqtt://localhost:1883
```

En otra sesión SSH (o desde tu PC si el puerto está abierto):

```bash
curl http://IP_DEL_SERVIDOR:3000/api/estado
```

Respuesta esperada:

```json
{"rojo":"OFF","verde":"OFF","azul":"OFF"}
```

Abre en el navegador: `http://IP_DEL_SERVIDOR:3000`

Detén la prueba con `Ctrl+C` en la terminal donde corre `npm start`.

---

## Paso 11 — Instalar PM2 (proceso en segundo plano)

PM2 mantiene el backend activo aunque cierres la sesión SSH.

```bash
sudo npm install -g pm2
```

Arranca la aplicación:

```bash
cd ~/IoT-proyect
pm2 start backend/server.js --name smarthome
```

Comandos útiles:

```bash
pm2 status              # ver estado
pm2 logs smarthome      # ver logs en vivo
pm2 restart smarthome   # reiniciar
pm2 stop smarthome      # detener
```

Haz que PM2 arranque al reiniciar el servidor:

```bash
pm2 startup
# Copia y ejecuta el comando que te muestre PM2 (con sudo)
pm2 save
```

---

## Paso 12 — Configurar el ESP32

En tu PC, edita `esp32/smarthome.ino`:

```cpp
const char* MQTT_SERVER = "IP_DEL_SERVIDOR";  // IP pública del Ubuntu
const int MQTT_PORT = 1883;
```

Sube el sketch al ESP32 con Arduino IDE.

**Primera configuración WiFi del ESP32:**

1. Enciende el ESP32.
2. Conéctate a la red WiFi `SmartHome-Config`.
3. Abre `http://192.168.4.1` en el navegador.
4. Introduce el SSID y contraseña de tu WiFi doméstico.
5. El ESP32 se reiniciará y se conectará al broker MQTT del servidor.

**Borrar WiFi guardado:** mantén pulsado el botón BOOT 3 segundos al encender.

---

## Paso 13 — Verificar el flujo completo

1. Abre `http://IP_DEL_SERVIDOR:3000` en el navegador.
2. Pulsa un LED en la interfaz.
3. Comprueba los logs del backend:

   ```bash
   pm2 logs smarthome
   ```

   Deberías ver publicaciones MQTT como `smarthome/led/rojo`.

4. En el Monitor Serie del ESP32 deberías ver mensajes MQTT recibidos y el LED físico cambiar.

Prueba MQTT desde el servidor:

```bash
mosquitto_pub -h localhost -t "smarthome/led/rojo" -m '{"estado":"ON"}'
```

---

## Variables de entorno del backend (opcional)

Por defecto el backend usa:

- `PORT=3000`
- `MQTT_URL=mqtt://localhost:1883`

Si necesitas cambiarlas, crea `backend/.env` o pásalas al arrancar con PM2:

```bash
pm2 delete smarthome
PORT=3000 MQTT_URL=mqtt://localhost:1883 pm2 start backend/server.js --name smarthome
pm2 save
```

---

## Actualizar el proyecto en el servidor

Cuando subas cambios a GitHub:

```bash
cd ~/IoT-proyect
git pull
npm run install:all
npm run build:frontend
pm2 restart smarthome
```

---

## Solución de problemas

### No carga la web en el puerto 3000

- Comprueba que PM2 está activo: `pm2 status`
- Comprueba el firewall: `sudo ufw status`
- En cloud (AWS, etc.), revisa reglas de seguridad del puerto 3000

### Error MQTT en el backend

```bash
sudo systemctl status mosquitto
```

Si no está activo:

```bash
sudo systemctl restart mosquitto
```

### El frontend carga pero los botones no funcionan

- Revisa que `frontend/.env.production` tiene la IP correcta **antes** del build
- Vuelve a compilar: `npm run build:frontend` y `pm2 restart smarthome`

### El ESP32 no se conecta a MQTT

- Verifica que el puerto **1883** está abierto en firewall y security group
- Confirma que `MQTT_SERVER` en el `.ino` es la IP pública del servidor
- El ESP32 debe tener internet (WiFi configurado correctamente)

### Ver logs

```bash
pm2 logs smarthome          # backend
sudo journalctl -u mosquitto -f   # broker MQTT
```

---

## Resumen rápido

```bash
# En el servidor Ubuntu
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl build-essential mosquitto mosquitto-clients
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2

git clone https://github.com/juan745Guevara/IoT-proyect.git
cd IoT-proyect
# Editar frontend/.env.production con la IP del servidor
npm run install:all
npm run build:frontend
pm2 start backend/server.js --name smarthome
pm2 startup && pm2 save
```

Acceso final: **http://IP_DEL_SERVIDOR:3000**
