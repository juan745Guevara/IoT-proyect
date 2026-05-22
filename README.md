# IoT-proyect — SmartHome LEDs

Control de 3 LEDs (rojo, verde, azul) vía ESP32 + MQTT + Node.js en AWS EC2.

## Estructura

```
IoT-proyect/
├── server.js                 # Backend Node.js + Express + MQTT
├── package.json
├── smarthome-frontend/       # Frontend React + Vite (reutilizable en app móvil)
│   ├── src/
│   │   ├── api/client.js     # Lógica HTTP (copiar a React Native)
│   │   ├── hooks/            # useLeds, useConexion (copiar a React Native)
│   │   └── components/       # Solo UI web
│   └── package.json
└── esp32/
    └── smarthome.ino
```

## Desarrollo local

**Terminal 1 — Backend:**

```bash
npm install
node server.js
```

**Terminal 2 — Frontend (React + Vite):**

```bash
cd smarthome-frontend
npm install
npm run dev
```

Abre `http://localhost:5173`. El frontend llama al API en `http://localhost:3000` (configurable en `smarthome-frontend/.env`).

## Producción (EC2)

```bash
# 1. Compilar frontend
cd smarthome-frontend
# Editar .env.production con VITE_API_URL=http://TU_IP_EC2:3000
npm install
npm run build

# 2. Arrancar backend (sirve API + carpeta dist/)
cd ..
node server.js
# o: pm2 start server.js --name smarthome
```

Abre `http://IP_EC2:3000`.

## ESP32

1. Edita `MQTT_SERVER` en `esp32/smarthome.ino` con la IP pública de tu EC2.
2. Instala **PubSubClient** y **ArduinoJson** desde Arduino Library Manager.
3. Primera vez: red `SmartHome-Config` → `http://192.168.4.1` para configurar WiFi.
4. BOOT 3 s al encender para borrar WiFi guardado.

## App móvil (futuro)

Copiar sin cambios: `src/api/` y `src/hooks/`. Recrear `components/` con componentes nativos de React Native.

## AWS EC2

Puertos: **22**, **3000**, **1883**. Mosquitto + Node.js 20 + PM2.

```bash
sudo apt install -y mosquitto mosquitto-clients
# /etc/mosquitto/conf.d/smarthome.conf → listener 1883, allow_anonymous true
pm2 start server.js --name smarthome
```
