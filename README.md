# IoT-proyect — SmartHome LEDs

Control de 3 LEDs (rojo, verde, azul) vía ESP32 + MQTT + Node.js en AWS EC2.

## Arquitectura

```
Frontend (React)  ──HTTP──►  Backend (Express)  ──MQTT──►  ESP32
   :5173 dev                    :3000                      Mosquitto :1883
   :3000 prod (dist servido por backend)
```

## Estructura

```
IoT-proyect/
├── backend/                     # API Node.js + MQTT
│   ├── server.js                # Punto de entrada
│   ├── app.js                   # Express: middleware + rutas + estáticos
│   ├── config.js                # Puerto, MQTT, LEDs válidos
│   ├── static.js                # Sirve frontend/dist en producción
│   ├── middleware/cors.js
│   ├── mqtt/client.js           # Cliente MQTT y publicación
│   ├── routes/api.js            # GET /api/estado, POST /api/led
│   ├── state/leds.js            # Estado en memoria de los LEDs
│   └── package.json
├── frontend/                    # React + Vite
│   ├── index.html
│   ├── vite.config.js
│   ├── .env                     # VITE_API_URL (desarrollo, no se sube a git)
│   ├── .env.example
│   ├── .env.production          # VITE_API_URL para el build de EC2
│   ├── src/
│   │   ├── main.jsx, App.jsx
│   │   ├── api/client.js        # Lógica HTTP (copiar a React Native)
│   │   ├── constants/leds.js    # Nombres, etiquetas y estados
│   │   ├── hooks/               # useLeds.js, useConexion.js
│   │   ├── components/          # Dashboard, LedCard, StatusBar
│   │   └── styles/              # CSS modular
│   └── package.json
├── esp32/
│   └── smarthome.ino            # Firmware ESP32 (WiFi + MQTT)
├── package.json                 # Scripts de orquestación (raíz)
└── README.md
```

## Scripts (desde la raíz)

| Comando | Descripción |
|---------|-------------|
| `npm run install:all` | Instala dependencias de backend y frontend |
| `npm start` | Arranca el backend en el puerto 3000 |
| `npm run dev:frontend` | Arranca Vite en el puerto 5173 |
| `npm run build:frontend` | Compila el frontend en `frontend/dist/` |

## Desarrollo local

**1. Instalar dependencias (solo la primera vez):**

```bash
npm run install:all
```

**2. Terminal 1 — Backend:**

```bash
npm start
```

**3. Terminal 2 — Frontend:**

```bash
npm run dev:frontend
# o: cd frontend && npm run dev
```

Abre `http://localhost:5173`. El frontend llama al API en `http://localhost:3000`.

Copia `frontend/.env.example` a `frontend/.env` si aún no existe:

```bash
VITE_API_URL=http://localhost:3000
```

## Producción (EC2)

```bash
# 1. Compilar frontend
cd frontend
# Editar .env.production → VITE_API_URL=http://TU_IP_EC2:3000
npm install
npm run build

# 2. Arrancar backend (sirve API + frontend/dist/)
cd ..
npm start
# o: pm2 start backend/server.js --name smarthome
```

Abre `http://IP_EC2:3000`.

## API

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/estado` | Estado actual de los LEDs (`ON`/`OFF`) |
| `POST` | `/api/led` | Cambiar un LED. Body: `{ "led": "rojo", "estado": "ON" }` |

Topics MQTT publicados: `smarthome/led/rojo`, `smarthome/led/verde`, `smarthome/led/azul`.

## ESP32

1. Edita `MQTT_SERVER` en `esp32/smarthome.ino` con la IP pública de tu EC2.
2. Instala **PubSubClient** y **ArduinoJson** desde Arduino Library Manager.
3. Primera vez: red `SmartHome-Config` → `http://192.168.4.1` para configurar WiFi.
4. Mantén BOOT 3 s al encender para borrar WiFi guardado.

## App móvil (futuro)

Copiar sin cambios: `frontend/src/api/`, `frontend/src/constants/` y `frontend/src/hooks/`. Recrear `components/` con componentes nativos de React Native.

## AWS EC2

Puertos abiertos: **22**, **3000**, **1883**. Stack: Mosquitto + Node.js 20 + PM2.

```bash
sudo apt install -y mosquitto mosquitto-clients
# /etc/mosquitto/conf.d/smarthome.conf → listener 1883, allow_anonymous true
pm2 start backend/server.js --name smarthome
```
