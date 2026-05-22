# IoT-proyect — SmartHome LEDs

Control de 3 LEDs (rojo, verde, azul) vía ESP32 + MQTT + Node.js en AWS EC2.

## Estructura

```
IoT-proyect/
├── server.js           # Backend Node.js + Express
├── package.json
├── public/
│   └── index.html      # Interfaz web
└── esp32/
    └── smarthome.ino   # Firmware ESP32
```

## Inicio rápido (local o EC2)

```bash
npm install
node server.js
```

Abre `http://localhost:3000` (o `http://IP_EC2:3000` en producción).

## ESP32

1. Edita `MQTT_SERVER` en `esp32/smarthome.ino` con la IP pública de tu EC2.
2. Instala desde Arduino Library Manager: **PubSubClient**, **ArduinoJson** (WiFi, WebServer y Preferences vienen con el core ESP32).
3. Primera vez: conéctate a la red `SmartHome-Config` y abre `http://192.168.4.1` para configurar tu WiFi.
4. Mantén el botón BOOT 3 s al encender para borrar el WiFi guardado y reconfigurar.
5. Sube el sketch al ESP32.

## AWS EC2

Ver requisitos completos en la documentación del proyecto (Mosquitto, puertos 22/3000/1883, PM2).

```bash
# Mosquitto
sudo apt install -y mosquitto mosquitto-clients
# Crear /etc/mosquitto/conf.d/smarthome.conf con listener 1883 y allow_anonymous true

# Producción
pm2 start server.js --name smarthome
pm2 save
pm2 startup
```
