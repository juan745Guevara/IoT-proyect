# IoT-proyect — Invernadero Inteligente

Sistema de monitoreo y control para invernadero vía ESP32 + MQTT + Node.js (desplegable en AWS EC2 o servidor Ubuntu).

**Sensores:** DHT22 (temperatura y humedad del aire), humedad del suelo y luminosidad (LDR).  
**Actuadores:** ventilador y bomba de agua controlados por relé de 2 canales (lógica activa en LOW).

## Arquitectura

```
ESP32 ──MQTT publish──► Mosquitto :1883 ◄──MQTT subscribe── Backend (Express) :3000
   │                           ▲                                    │
   │ sensores cada 5s          │                                    │ HTTP
   │ actuadores ◄──────────────┘                                    ▼
   │                                                         Frontend (React)
   :5173 dev / :3000 prod
```

Flujo de datos:

1. El ESP32 lee sensores cada 5 s y publica en `invernadero/sensores`.
2. El backend se suscribe a ese topic y guarda el estado en memoria.
3. El frontend hace polling a `GET /api/sensores` y `GET /api/actuadores` cada 5 s.
4. Para controlar actuadores, el frontend llama `POST /api/actuador` → el backend publica en `invernadero/actuadores` → el ESP32 ejecuta el comando en el relé.

## Estructura del proyecto

```
IoT-proyect/
├── backend/                     # API Node.js + MQTT
│   ├── server.js
│   ├── app.js
│   ├── config.js
│   ├── static.js                # Sirve frontend/dist en producción
│   ├── middleware/cors.js
│   ├── mqtt/client.js
│   ├── routes/api.js
│   ├── state/invernadero.js
│   └── package.json
├── frontend/                    # React + Vite + React Router
│   ├── public/
│   │   └── greenhouse.jpg       # Ilustración del invernadero (dashboard)
│   ├── src/
│   │   ├── App.jsx              # Rutas
│   │   ├── api/client.js        # Cliente HTTP (reutilizable en React Native)
│   │   ├── constants/invernadero.js
│   │   ├── hooks/
│   │   │   ├── useSensores.js
│   │   │   ├── useActuadores.js
│   │   │   └── useConexion.js
│   │   ├── components/
│   │   │   ├── layout/          # AppLayout, Sidebar, BottomNav
│   │   │   ├── common/          # StatusBar, AlertBar, SensorCard, ActuadorCard, Toggle
│   │   │   └── pages/
│   │   │       ├── Dashboard.jsx
│   │   │       ├── GreenhouseView.jsx   # Vista isométrica + globos + líneas
│   │   │       ├── greenhouseHotspots.js
│   │   │       ├── SensorBubble.jsx / ActuadorBubble.jsx
│   │   │       ├── Historial.jsx
│   │   │       ├── Alertas.jsx
│   │   │       ├── Configuracion.jsx
│   │   │       └── EstadoESP32.jsx
│   │   └── styles/              # variables.css, global.css, layout.css, components.css
│   ├── .env.example
│   └── package.json
├── esp32/
│   └── smarthome.ino
├── sensor.json                  # Payload de prueba para mosquitto_pub
├── despliegue.md                # Guía detallada de despliegue en Ubuntu/EC2
├── package.json
└── README.md
```

## Frontend — vistas y rutas

| Ruta | Página | Descripción |
|------|--------|-------------|
| `/` | Dashboard | Vista principal: invernadero interactivo, tarjetas de sensores y control de actuadores |
| `/historial` | Historial | Placeholder — histórico de lecturas |
| `/alertas` | Alertas | Placeholder — alertas del sistema |
| `/configuracion` | Umbrales | Placeholder — configuración de umbrales |
| `/estado` | Estado ESP32 | Placeholder — estado de conexión del dispositivo |

El **Dashboard** muestra una ilustración del invernadero con seis globos (3 izquierda / 3 derecha) conectados por líneas en ángulo a cada elemento de la imagen (sol, plantas, tanque de agua, ventiladores, etc.). Debajo hay lecturas detalladas y toggles para ventilador y bomba.

Layout responsive: sidebar en escritorio, barra inferior en móvil.

## Pines ESP32

| Componente | GPIO | Tipo |
|------------|------|------|
| DHT22 (data) | 4 | Digital |
| Soil Moisture Sensor | 34 | ADC (solo entrada) |
| LDR (fotoresistencia) | 35 | ADC (solo entrada) |
| Relé IN1 (ventilador) | 26 | Digital OUTPUT |
| Relé IN2 (bomba) | 27 | Digital OUTPUT |

Relé activo en LOW: `ON` → `digitalWrite(LOW)`, `OFF` → `digitalWrite(HIGH)`.

## Topics MQTT

| Topic | Dirección | Formato JSON |
|-------|-----------|--------------|
| `invernadero/sensores` | ESP32 → Broker → Backend | `{ "temperatura": 25.4, "humedad_aire": 68.2, "humedad_suelo": 45, "luminosidad": 78 }` |
| `invernadero/actuadores` | Backend → Broker → ESP32 | `{ "actuador": "ventilador", "estado": "ON" }` |

Actuadores válidos: `ventilador`, `bomba`. Estados: `ON`, `OFF`.

## API

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/sensores` | Últimas lecturas de sensores + `ultima_lectura` (ISO timestamp) |
| `GET` | `/api/actuadores` | Estado actual de ventilador y bomba (`ON`/`OFF`) |
| `POST` | `/api/actuador` | Controlar un actuador. Body: `{ "actuador": "ventilador", "estado": "ON" }` |

Errores de validación en POST:

- Actuador inválido → `400 { "error": "Actuador inválido" }`
- Estado inválido → `400 { "error": "Estado inválido" }`

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

**2. Terminal 1 — Mosquitto** (si no está corriendo como servicio):

```bash
mosquitto -v
```

**3. Terminal 2 — Backend:**

```bash
npm start
```

**4. Terminal 3 — Frontend:**

```bash
npm run dev:frontend
```

Abre `http://localhost:5173`. El frontend llama al API en `http://localhost:3000`.

Copia `frontend/.env.example` a `frontend/.env` si aún no existe:

```bash
VITE_API_URL=http://localhost:3000
```

### Probar sin ESP32 (Windows / Linux)

Publica lecturas de prueba con el archivo `sensor.json` en la raíz del proyecto:

```bash
mosquitto_pub -h 127.0.0.1 -t "invernadero/sensores" -f sensor.json
```

En PowerShell, si `-m` con JSON inline falla por comillas, usa siempre `-f sensor.json`.

Simular actuador:

```bash
mosquitto_pub -h 127.0.0.1 -t "invernadero/actuadores" -m "{\"actuador\":\"ventilador\",\"estado\":\"ON\"}"
```

## Producción

```bash
# 1. Compilar frontend
cd frontend
# Editar .env.production → VITE_API_URL=http://TU_IP:3000
npm run build

# 2. Arrancar backend (sirve API + frontend/dist/)
cd ..
npm start
# o: pm2 start backend/server.js --name invernadero
```

Abre `http://IP_SERVIDOR:3000`.

Para una guía paso a paso en Ubuntu Server (Mosquitto, Node.js, PM2, firewall), ver **[despliegue.md](despliegue.md)**.

## ESP32

1. Edita `MQTT_SERVER` en `esp32/smarthome.ino` con la IP de tu servidor.
2. Instala desde Arduino Library Manager:
   - **PubSubClient**
   - **ArduinoJson**
   - **DHT sensor library** (Adafruit)
3. Primera vez: red `Invernadero-Config` → `http://192.168.4.1` para configurar WiFi.
4. Mantén BOOT 3 s al encender para borrar WiFi guardado.

### Calibración de sensores analógicos

- **Humedad del suelo:** valor ADC invertido (4095 = seco = 0%, 0 = húmedo = 100%).
- **Luminosidad LDR:** mapeo directo (0 = oscuro = 0%, 4095 = máxima luz = 100%).

## App móvil (futuro)

Copiar sin cambios: `frontend/src/api/`, `frontend/src/constants/` y `frontend/src/hooks/`. Recrear `components/` con componentes nativos de React Native.

## AWS EC2 / servidor

Puertos abiertos: **22**, **3000**, **1883**. Stack: Mosquitto + Node.js 20 + PM2.

```bash
sudo apt install -y mosquitto mosquitto-clients
# /etc/mosquitto/conf.d/invernadero.conf → listener 1883, allow_anonymous true
pm2 start backend/server.js --name invernadero
```

Prueba MQTT en el servidor:

```bash
mosquitto_pub -h localhost -t "invernadero/sensores" \
  -m '{"temperatura":24.5,"humedad_aire":65,"humedad_suelo":50,"luminosidad":80}'

mosquitto_pub -h localhost -t "invernadero/actuadores" \
  -m '{"actuador":"ventilador","estado":"ON"}'
```
