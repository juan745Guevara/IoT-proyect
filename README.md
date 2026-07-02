# IoT-proyect — Invernadero Inteligente

Sistema de monitoreo y control para invernadero vía ESP32 + MQTT + Node.js. Soporta **multi-zona**, **autenticación JWT**, modo automático, riegos programados, detección de anomalías y panel de administración.

**Producción:** [iotinvernadero.com](https://iotinvernadero.com) — AWS EC2 + Nginx + PM2 + Mosquitto + PostgreSQL

**Sensores:** DHT22 (temperatura y humedad del aire), humedad del suelo y luminosidad (LDR).  
**Actuadores:** ventilación y riego (relé de 2 canales, lógica activa en LOW).  
En la interfaz se muestran como **Ventilación** y **Riego**; los IDs técnicos en MQTT/API siguen siendo `ventilador` y `bomba`.

**Stack:** Node.js/Express + React/Vite + PostgreSQL + Mosquitto MQTT + Socket.io

## Arquitectura

```
ESP32 (zona1, zona2…) ──MQTT──► Mosquitto :1883 ◄──MQTT── Backend (Express + Socket.io) :3000
   │  sensores /5s              │                              │
   │  heartbeat /30s            │                    ┌─────────┴─────────┐
   │  actuadores ◄──────────────┘                    │ memoria + PostgreSQL│
   │                                                 │ (historial, log,   │
   │                                                 │  alertas, usuarios)│
   │                                                 └─────────┬─────────┘
   │                                                           │ JWT + WebSocket
   │                                                           ▼
   │                                                      Frontend (React)
   :5173 dev / Nginx + :3000 prod
```

Flujo de datos:

1. El ESP32 publica sensores cada 5 s en `invernadero/{zona_id}/sensores` y heartbeat cada 30 s.
2. El backend guarda en memoria, evalúa umbrales, motor automático y anomalías; emite eventos por Socket.io.
3. Cada **5 minutos** (configurable) persiste una lectura en PostgreSQL.
4. El frontend carga datos con REST (JWT) y recibe actualizaciones en tiempo real por WebSocket autenticado.
5. `POST /api/actuador` publica en MQTT; si la zona está desconectada, el comando se encola y se ejecuta al reconectar.

## Características principales

| Área | Funcionalidad |
|------|----------------|
| **Multi-zona** | Selector de zona en UI; topics y estado independientes por `zona_id` |
| **Seguridad** | JWT, roles `admin` / `lectura`, rate limiting, Socket.io autenticado |
| **Automático** | Umbrales y reglas ON/OFF por actuador y zona |
| **Riegos** | Scheduler de riegos programados por día y hora |
| **Confiabilidad** | Cola de comandos, heartbeat ESP32, watchdog, backoff MQTT |
| **Análisis** | Detección de anomalías, estadísticas semanales, predicción horaria |
| **Operaciones** | Health check, backups automáticos, panel admin |

## Estructura del proyecto

```
IoT-proyect/
├── backend/
│   ├── server.js                # HTTP + Socket.io + jobs
│   ├── app.js                   # Rutas, /health, rate limit
│   ├── socket.js                # Socket.io con JWT
│   ├── config.js
│   ├── auth/
│   │   └── tokenBlacklist.js    # Logout con invalidación de token
│   ├── middleware/
│   │   ├── auth.js              # JWT: requireAuth, requireAdmin, requireWrite
│   │   ├── cors.js
│   │   └── rateLimit.js
│   ├── routes/
│   │   ├── api.js               # API principal (protegida)
│   │   ├── auth.js              # Login, logout, /me, cambiar-password
│   │   └── admin.js             # Stats, usuarios, backups, logs
│   ├── db/
│   │   ├── index.js, schema.sql, schema-auth.sql, migrations.sql
│   │   ├── historial.js, log.js, alertas.js, anomalias.js
│   │   ├── estadisticas.js, prediccion.js, users.js, zonas.js, riegos.js
│   │   └── comandos.js          # Cola persistente de comandos
│   ├── mqtt/client.js
│   ├── socket.js
│   ├── state/                   # invernadero, umbrales, automatico
│   ├── automatico/              # motor, acciones, validar
│   ├── analisis/anomalias.js
│   ├── queue/comandos.js
│   ├── jobs/                    # backup, limpieza, conexion, scheduler
│   ├── scripts/crear-admin.js
│   ├── backups/                 # Dumps SQL (gitignored en prod)
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/client.js        # REST + Bearer JWT
│   │   ├── socket.js            # Socket.io con token
│   │   ├── context/             # AuthContext, ZonaContext, TemaContext
│   │   ├── hooks/               # sensores, actuadores, alertas, estadísticas…
│   │   └── components/
│   │       ├── common/          # RequireAuth, AnomalyBanner, ZonaSelector…
│   │       ├── layout/          # AppLayout, Sidebar, BottomNav
│   │       └── pages/
│   │           ├── Login.jsx, Dashboard.jsx, Historial.jsx
│   │           ├── Alertas.jsx, Configuracion.jsx, Admin.jsx
│   │           └── GreenhouseView.jsx, RiegosSection.jsx…
│   └── .env.example
├── esp32/smarthome.ino
├── sensor.json
├── despliegue.md
└── README.md
```

## Frontend — vistas y rutas

| Ruta | Página | Acceso | Descripción |
|------|--------|--------|-------------|
| `/login` | Login | Público | Inicio de sesión |
| `/` | Dashboard | Autenticado | Invernadero interactivo, sensores, actuadores, alertas |
| `/historial` | Historial | Autenticado | Gráficas, estadísticas semanales, log de acciones |
| `/alertas` | Alertas | Autenticado | Alertas y anomalías del sistema |
| `/configuracion` | Configuración | Solo admin | Umbrales, modo automático, riegos programados |
| `/estado` | Estado ESP32 | Autenticado | Estado de conexión por zona |
| `/admin` | Administración | Solo admin | Usuarios, backups, logs, comandos pendientes |

**Roles:**
- **`admin`** — control total (actuadores, configuración, administración).
- **`lectura`** — solo visualización; actuadores deshabilitados y sin acceso a Configuración/Admin.

Layout responsive con **modo oscuro**, sidebar en escritorio y barra inferior en móvil.

## Pines ESP32

| Componente | GPIO | Tipo |
|------------|------|------|
| DHT22 (data) | 4 | Digital |
| Soil Moisture Sensor | 34 | ADC (solo entrada) |
| LDR (fotoresistencia) | 35 | ADC (solo entrada) |
| Relé IN1 (ventilación) | 26 | Digital OUTPUT |
| Relé IN2 (riego) | 27 | Digital OUTPUT |

Relé activo en LOW: `ON` → `digitalWrite(LOW)`, `OFF` → `digitalWrite(HIGH)`.

Antes de flashear, edita en `smarthome.ino`:
- `ZONA_ID` — identificador de la zona (ej. `zona1`)
- `MQTT_SERVER` — IP o dominio del broker

**Firmware:** watchdog (30 s), heartbeat MQTT cada 30 s, reconexión MQTT con backoff exponencial (5 s → 60 s).

## Topics MQTT

Patrón multi-zona: `invernadero/{zona_id}/…`

| Topic | Dirección | Formato JSON |
|-------|-----------|--------------|
| `invernadero/{zona}/sensores` | ESP32 → Backend | `{ "temperatura", "humedad_aire", "humedad_suelo", "luminosidad" }` |
| `invernadero/{zona}/heartbeat` | ESP32 → Backend | `{ "zona", "uptime_ms" }` |
| `invernadero/{zona}/actuadores` | Backend → ESP32 | `{ "actuador": "ventilador", "estado": "ON" }` |

Actuadores válidos: `ventilador`, `bomba`. Estados: `ON`, `OFF`.

## Autenticación

Todas las rutas `/api/*` (excepto login) requieren header:

```
Authorization: Bearer <token>
```

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `POST` | `/api/auth/login` | Pública | Body: `{ "usuario", "password" }` → `{ token, usuario, rol }` |
| `POST` | `/api/auth/logout` | JWT | Invalida el token actual |
| `GET` | `/api/auth/me` | JWT | Datos del usuario en sesión |
| `PUT` | `/api/auth/cambiar-password` | JWT | Body: `{ "password_actual", "password_nuevo" }` (mín. 8 chars) |

**Primer despliegue — crear admin:**

```bash
node backend/scripts/crear-admin.js
```

O define `ADMIN_USER` y `ADMIN_PASSWORD` en `.env`; se crea al arrancar si no existe.

## API principal

Rutas de **lectura** → cualquier usuario autenticado.  
Rutas de **escritura** → solo rol `admin`.

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/health` | Health check público (DB, MQTT, zonas) |
| `GET` | `/api/sensores?zona_id=zona1` | Lecturas actuales |
| `GET` | `/api/actuadores?zona_id=zona1` | Estado ventilación / riego |
| `POST` | `/api/actuador` | Control manual (admin). Body: `{ actuador, estado, zona_id }` |
| `GET` | `/api/historial?zona_id&sensor&rango` | Series temporales (`24h`, `7d`, `30d`) |
| `GET` | `/api/log?zona_id&limite&pagina` | Log de acciones sobre actuadores |
| `GET` | `/api/umbrales?zona_id` | Umbrales de alerta |
| `PUT` | `/api/umbrales` | Actualizar umbrales (admin) |
| `GET` | `/api/automatico?zona_id` | Config modo automático |
| `PUT` | `/api/automatico/:actuador` | Reglas automáticas (admin) |
| `GET` | `/api/riegos?zona_id` | Riegos programados |
| `POST` | `/api/riegos` | Crear riego (admin) |
| `GET` | `/api/alertas?zona_id` | Alertas paginadas |
| `GET` | `/api/anomalias?zona_id&limite=20` | Historial de anomalías |
| `GET` | `/api/estadisticas?zona_id` | Estadísticas por semana (8 semanas) |
| `GET` | `/api/estadisticas/semana?zona_id` | Resumen últimos 7 días por sensor |
| `GET` | `/api/prediccion?zona_id&sensor` | Valor esperado por hora (histórico 30 días) |
| `GET` | `/api/zonas` | Listado de zonas |

### API Admin (`/api/admin/*`, solo admin)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/admin/stats` | Estado del sistema |
| `GET` | `/api/admin/usuarios` | Listar usuarios |
| `POST` | `/api/admin/usuarios` | Crear usuario |
| `DELETE` | `/api/admin/usuarios/:id` | Desactivar usuario |
| `GET` | `/api/admin/backups` | Listar backups SQL |
| `POST` | `/api/admin/backup` | Backup manual inmediato |
| `GET` | `/api/admin/logs` | Logs del sistema |
| `GET` | `/api/admin/comandos-pendientes` | Cola de comandos MQTT |

### Eventos Socket.io

Conexión con token: `io(url, { auth: { token } })`

| Evento | Dirección | Payload |
|--------|-----------|---------|
| `sensores` | servidor → cliente | `{ zona_id, datos }` |
| `actuadores` | servidor → cliente | `{ zona_id, datos }` |
| `umbrales` | servidor → cliente | `{ zona_id, datos }` |
| `automatico` | servidor → cliente | `{ zona_id, config }` |
| `estado_zonas` | servidor → cliente | Array de zonas y conexión |
| `alerta` | servidor → cliente | Nueva alerta / anomalía |
| `anomalia` | servidor → cliente | Spike detectado (banner en Dashboard) |
| `log_accion` | servidor → cliente | Entrada en log de actuadores |

## Variables de entorno (backend)

Copia `backend/.env.example` a `backend/.env`:

```env
PORT=3000
MQTT_HOST=localhost
MQTT_PORT=1883
MQTT_URL=mqtt://127.0.0.1:1883

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_password
DB_NAME=invernadero

HISTORIAL_INTERVALO_MIN=5
RETENCION_DIAS=30

FRONTEND_URL=http://localhost:5173
SERVE_FRONTEND=false

# JWT
JWT_SECRET=cambia_esto_por_una_cadena_aleatoria_larga
JWT_EXPIRES_IN=24h
BCRYPT_ROUNDS=10
ADMIN_USER=admin
ADMIN_PASSWORD=admin123

# Rate limiting (15 min)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
RATE_LIMIT_LOGIN_MAX=5
RATE_LIMIT_ACTUADOR_MAX=30

# Backups (diario 2:00, retiene 7 archivos)
BACKUP_DIR=./backups
BACKUP_RETENTION=7

# Anomalías
ANOMALIA_TEMP_DELTA=5
ANOMALIA_HAIRE_DELTA=20
ANOMALIA_HSUELO_DELTA=30
ANOMALIA_VENTANA_MS=120000
ANOMALIA_COOLDOWN_MS=300000
```

Generar `JWT_SECRET` seguro:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Si PostgreSQL no está disponible, el backend **sigue funcionando** sin historial ni auth en DB.

### Crear base de datos

```bash
createdb invernadero
# El esquema se aplica automáticamente al arrancar el backend (schema.sql + schema-auth.sql)
```

## Scripts (desde la raíz)

| Comando | Descripción |
|---------|-------------|
| `npm run install:all` | Instala dependencias de backend y frontend |
| `npm start` | Arranca el backend en el puerto 3000 |
| `npm run dev:frontend` | Arranca Vite en el puerto 5173 |
| `npm run build:frontend` | Compila el frontend en `frontend/dist/` |

## Desarrollo local

**1. Instalar dependencias:**

```bash
npm run install:all
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

**2. Mosquitto** (si no corre como servicio):

```bash
mosquitto -v
```

**3. Backend:**

```bash
npm start
```

**4. Frontend:**

```bash
npm run dev:frontend
```

Abre `http://localhost:5173`. Login por defecto (si usas `.env.example`): `admin` / `admin123`.

Frontend `.env`:

```env
VITE_API_URL=http://localhost:3000
```

### Probar sin ESP32

Publicar lecturas de prueba (`sensor.json` en la raíz):

```bash
mosquitto_pub -h 127.0.0.1 -t "invernadero/zona1/sensores" -f sensor.json
```

Simular actuador:

```bash
mosquitto_pub -h 127.0.0.1 -t "invernadero/zona1/actuadores" \
  -m "{\"actuador\":\"ventilador\",\"estado\":\"ON\"}"
```

En PowerShell, si `-m` con JSON inline falla, usa `-f` con un archivo.

## Producción

```bash
cd frontend
# .env.production → VITE_API_URL=https://iotinvernadero.com
npm run build

cd ..
# backend/.env → SERVE_FRONTEND=true o servir dist/ con Nginx
npm start
# pm2 start backend/server.js --name invernadero
```

Guía detallada: **[despliegue.md](despliegue.md)** — Ubuntu/EC2, Mosquitto, Node.js, PM2, Nginx, PostgreSQL, `pg_dump` para backups.

## ESP32

1. Edita `ZONA_ID` y `MQTT_SERVER` en `esp32/smarthome.ino`.
2. Librerías (Arduino Library Manager): **PubSubClient**, **ArduinoJson**, **DHT sensor library** (Adafruit).
3. Primera vez: red `Invernadero-Config` → `http://192.168.4.1` para WiFi.
4. Mantén BOOT 3 s al encender para borrar credenciales WiFi.

### Calibración analógica

- **Humedad del suelo:** ADC invertido (4095 = seco = 0%, 0 = húmedo = 100%).
- **Luminosidad LDR:** mapeo directo (0 = oscuro, 4095 = máxima luz).

## AWS EC2 / servidor

Puertos: **22**, **80/443**, **1883** (MQTT interno o restringido).  
Stack: Mosquitto + PostgreSQL + Node.js 20 + PM2 + Nginx.

```bash
sudo apt install -y mosquitto mosquitto-clients postgresql-client
pm2 start backend/server.js --name invernadero
```

Health check: `GET https://tu-dominio/health`

## App móvil (futuro)

Reutilizable sin cambios: `frontend/src/api/`, `frontend/src/constants/`, `frontend/src/hooks/`. Recrear UI con React Native.
