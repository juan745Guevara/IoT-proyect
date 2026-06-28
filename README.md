# IoT-proyect — Invernadero Inteligente

Sistema de monitoreo y control para invernadero vía ESP32 + MQTT + Node.js en AWS EC2.

Sensores: DHT22 (temperatura y humedad del aire), humedad del suelo y luminosidad (LDR).  
Actuadores: ventilador y bomba de agua controlados por relé de 2 canales (lógica activa en LOW).

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
3. El frontend hace polling a `GET /api/sensores` cada 5 s.
4. Para controlar actuadores, el frontend llama `POST /api/actuador` → el backend publica en `invernadero/actuadores` → el ESP32 ejecuta el comando en el relé.

## Estructura

```
IoT-proyect/
├── backend/                     # API Node.js + MQTT
│   ├── server.js                # Punto de entrada
│   ├── app.js                   # Express: middleware + rutas + estáticos
│   ├── config.js                # Puerto, MQTT, actuadores válidos, topics
│   ├── static.js                # Sirve frontend/dist en producción
│   ├── middleware/cors.js
│   ├── mqtt/client.js           # Cliente MQTT: suscripción sensores, publicación actuadores
│   ├── routes/api.js            # GET /api/sensores, GET /api/actuadores, POST /api/actuador
│   ├── state/invernadero.js     # Estado en memoria de sensores y actuadores
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
│   │   ├── constants/invernadero.js
│   │   ├── hooks/               # useSensores.js, useActuadores.js, useConexion.js
│   │   ├── components/          # Dashboard, SensorCard, ActuadorCard, StatusBar
│   │   └── styles/              # CSS modular
│   └── package.json
├── esp32/
│   └── smarthome.ino            # Firmware ESP32 (WiFi + MQTT + sensores + relés)
├── package.json                 # Scripts de orquestación (raíz)
└── README.md
```

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

**2. Terminal 1 — Backend:**

```bash
npm start
```

**3. Terminal 2 — Frontend:**

```bash
npm run dev:frontend
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
# o: pm2 start backend/server.js --name invernadero
```

Abre `http://IP_EC2:3000`.

## ESP32

1. Edita `MQTT_SERVER` en `esp32/smarthome.ino` con la IP pública de tu EC2.
2. Instala desde Arduino Library Manager:
   - **PubSubClient**
   - **ArduinoJson**
   - **DHT sensor library** (Adafruit)
3. Primera vez: red `Invernadero-Config` → `http://192.168.4.1` para configurar WiFi.
4. Mantén BOOT 3 s al encender para borrar WiFi guardado.

### Calibración de sensores analógicos

- **Humedad del suelo**: valor ADC invertido (4095 = seco = 0%, 0 = húmedo = 100%).
- **Luminosidad LDR**: mapeo directo (0 = oscuro = 0%, 4095 = máxima luz = 100%).

## App móvil (futuro)

Copiar sin cambios: `frontend/src/api/`, `frontend/src/constants/` y `frontend/src/hooks/`. Recrear `components/` con componentes nativos de React Native.

## AWS EC2

Puertos abiertos: **22**, **3000**, **1883**. Stack: Mosquitto + Node.js 20 + PM2.

```bash
sudo apt install -y mosquitto mosquitto-clients
# /etc/mosquitto/conf.d/invernadero.conf → listener 1883, allow_anonymous true
pm2 start backend/server.js --name invernadero
```

Prueba MQTT desde EC2:

```bash
# Simular lectura de sensores
mosquitto_pub -h localhost -t "invernadero/sensores" \
  -m '{"temperatura":24.5,"humedad_aire":65,"humedad_suelo":50,"luminosidad":80}'

# Simular comando de actuador
mosquitto_pub -h localhost -t "invernadero/actuadores" \
  -m '{"actuador":"ventilador","estado":"ON"}'
```
