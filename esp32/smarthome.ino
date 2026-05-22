#include <WiFi.h>
#include <WebServer.h>
#include <Preferences.h>
#include <ArduinoJson.h>
#include <PubSubClient.h>

// ── Constantes ──────────────────────────────────────────────────────────────
const char* AP_SSID = "SmartHome-Config";
const char* AP_PASSWORD = "";
const IPAddress AP_IP(192, 168, 4, 1);

// Cambiar por la IP pública de tu instancia EC2
const char* MQTT_SERVER = "0.0.0.0";
const int MQTT_PORT = 1883;
const char* MQTT_CLIENT_ID = "esp32-smarthome";

const char* TOPIC_ROJO = "smarthome/led/rojo";
const char* TOPIC_VERDE = "smarthome/led/verde";
const char* TOPIC_AZUL = "smarthome/led/azul";

const int PIN_LED_ROJO = 25;
const int PIN_LED_VERDE = 26;
const int PIN_LED_AZUL = 27;
const int RESET_PIN = 0;

const unsigned long WIFI_TIMEOUT_MS = 10000;
const unsigned long MQTT_RECONNECT_MS = 5000;
const unsigned long WIFI_RECONNECT_MS = 5000;

// ── Objetos globales ────────────────────────────────────────────────────────
Preferences preferences;
WebServer server(80);
WiFiClient espClient;
PubSubClient mqtt(espClient);

String wifiSSID = "";
String wifiPassword = "";
bool modoAP = false;

unsigned long lastMqttReconnectAttempt = 0;
unsigned long lastWifiReconnectAttempt = 0;

// ── LEDs y MQTT ─────────────────────────────────────────────────────────────

void aplicarEstadoLed(int pin, const char* estado) {
  if (strcmp(estado, "ON") == 0) {
    digitalWrite(pin, HIGH);
    Serial.printf("[LED] Pin %d → ON\n", pin);
  } else if (strcmp(estado, "OFF") == 0) {
    digitalWrite(pin, LOW);
    Serial.printf("[LED] Pin %d → OFF\n", pin);
  } else {
    Serial.printf("[LED] Estado desconocido: %s\n", estado);
  }
}

void callbackMQTT(char* topic, byte* payload, unsigned int length) {
  StaticJsonDocument<64> doc;
  DeserializationError error = deserializeJson(doc, payload, length);

  if (error) {
    Serial.print("[MQTT] JSON inválido: ");
    Serial.println(error.c_str());
    return;
  }

  const char* estado = doc["estado"];
  if (!estado) {
    Serial.println("[MQTT] Campo 'estado' no encontrado");
    return;
  }

  Serial.printf("[MQTT] Topic: %s | estado: %s\n", topic, estado);

  if (strcmp(topic, TOPIC_ROJO) == 0) {
    aplicarEstadoLed(PIN_LED_ROJO, estado);
  } else if (strcmp(topic, TOPIC_VERDE) == 0) {
    aplicarEstadoLed(PIN_LED_VERDE, estado);
  } else if (strcmp(topic, TOPIC_AZUL) == 0) {
    aplicarEstadoLed(PIN_LED_AZUL, estado);
  }
}

void conectarMQTT() {
  if (mqtt.connected()) {
    return;
  }

  unsigned long now = millis();
  if (now - lastMqttReconnectAttempt < MQTT_RECONNECT_MS) {
    return;
  }
  lastMqttReconnectAttempt = now;

  Serial.print("[MQTT] Conectando a ");
  Serial.print(MQTT_SERVER);
  Serial.print(":");
  Serial.println(MQTT_PORT);

  if (mqtt.connect(MQTT_CLIENT_ID)) {
    Serial.println("[MQTT] Conectado y suscrito a smarthome/led/*");
    mqtt.subscribe(TOPIC_ROJO);
    mqtt.subscribe(TOPIC_VERDE);
    mqtt.subscribe(TOPIC_AZUL);
    return;
  }

  Serial.print("[MQTT] Falló, rc=");
  Serial.println(mqtt.state());
}

// ── NVS (credenciales WiFi) ─────────────────────────────────────────────────

void leerCredenciales() {
  preferences.begin("wifi", false);
  wifiSSID = preferences.getString("ssid", "");
  wifiPassword = preferences.getString("password", "");
  preferences.end();

  Serial.print("[WiFi] SSID guardado: ");
  Serial.println(wifiSSID.length() > 0 ? wifiSSID : "(ninguno)");
}

void borrarCredenciales() {
  preferences.begin("wifi", false);
  preferences.clear();
  preferences.end();
  wifiSSID = "";
  wifiPassword = "";
  Serial.println("[WiFi] Credenciales borradas de NVS");
}

void guardarCredenciales(const String& ssid, const String& password) {
  preferences.begin("wifi", false);
  preferences.putString("ssid", ssid);
  preferences.putString("password", password);
  preferences.end();
  wifiSSID = ssid;
  wifiPassword = password;
  Serial.println("[WiFi] Credenciales guardadas en NVS");
}

// ── Portal web (modo AP) ─────────────────────────────────────────────────────

String escaparHtml(const String& texto) {
  String salida = texto;
  salida.replace("&", "&amp;");
  salida.replace("<", "&lt;");
  salida.replace(">", "&gt;");
  salida.replace("\"", "&quot;");
  return salida;
}

void manejarRutaRaiz() {
  Serial.println("[Portal] GET / — escaneando redes WiFi...");

  int redes = WiFi.scanNetworks();
  String opciones = "";

  if (redes == 0) {
    opciones = "<option value=\"\">No se encontraron redes</option>";
  } else {
    for (int i = 0; i < redes; i++) {
      String ssidRed = WiFi.SSID(i);
      String valor = escaparHtml(ssidRed);
      opciones += "<option value=\"" + valor + "\">" + valor;
      opciones += " (" + String(WiFi.RSSI(i)) + " dBm)</option>";
    }
  }

  String html = R"rawliteral(
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>SmartHome Config</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, sans-serif;
      background: #0f1419;
      color: #e7ecf3;
      padding: 1.25rem;
      line-height: 1.5;
    }
    .card {
      max-width: 420px;
      margin: 0 auto;
      background: #1a2332;
      border: 1px solid #2d3a4f;
      border-radius: 12px;
      padding: 1.5rem;
    }
    h2 { font-size: 1.25rem; margin-bottom: 0.25rem; }
    p.sub { color: #8b9cb3; font-size: 0.9rem; margin-bottom: 1.25rem; }
    label { display: block; margin-top: 1rem; margin-bottom: 0.35rem; font-size: 0.9rem; }
    select, input {
      width: 100%;
      padding: 0.65rem;
      border-radius: 8px;
      border: 1px solid #2d3a4f;
      background: #0f1419;
      color: #e7ecf3;
      font-size: 1rem;
    }
    button {
      width: 100%;
      margin-top: 1.25rem;
      padding: 0.75rem;
      border: none;
      border-radius: 8px;
      background: #3b82f6;
      color: #fff;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
    }
    button:active { background: #2563eb; }
  </style>
</head>
<body>
  <div class="card">
    <h2>Configuración WiFi — SmartHome</h2>
    <p class="sub">Conéctate a la red <strong>SmartHome-Config</strong> y elige tu WiFi.</p>
    <form action="/conectar" method="POST">
      <label for="ssid">Red WiFi disponible:</label>
      <select name="ssid" id="ssid" required>
)rawliteral";

  html += opciones;
  html += R"rawliteral(
      </select>
      <label for="password">Contraseña:</label>
      <input type="password" name="password" id="password" placeholder="Contraseña">
      <button type="submit">Conectar</button>
    </form>
  </div>
</body>
</html>
)rawliteral";

  server.send(200, "text/html; charset=utf-8", html);
}

void manejarConectar() {
  if (!server.hasArg("ssid") || server.arg("ssid").length() == 0) {
    server.send(400, "text/plain", "SSID requerido");
    return;
  }

  String ssidRecibido = server.arg("ssid");
  String passwordRecibida = server.hasArg("password") ? server.arg("password") : "";

  Serial.print("[Portal] POST /conectar — SSID: ");
  Serial.println(ssidRecibido);

  guardarCredenciales(ssidRecibido, passwordRecibida);

  String html = "<!DOCTYPE html><html lang=\"es\"><head><meta charset=\"UTF-8\">";
  html += "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">";
  html += "<title>SmartHome</title><style>body{font-family:system-ui;background:#0f1419;";
  html += "color:#e7ecf3;padding:2rem;text-align:center;}p{max-width:360px;margin:0 auto;}";
  html += "</style></head><body><p>✅ Credenciales guardadas. El dispositivo se reiniciará ";
  html += "y se conectará a <strong>" + escaparHtml(ssidRecibido) + "</strong>.</p></body></html>";

  server.send(200, "text/html; charset=utf-8", html);

  Serial.println("[Portal] Reiniciando en 2 segundos...");
  delay(2000);
  ESP.restart();
}

void manejarEstado() {
  StaticJsonDocument<192> doc;

  if (modoAP) {
    doc["modo"] = "AP";
    doc["ip"] = WiFi.softAPIP().toString();
  } else {
    doc["modo"] = "Station";
    doc["ip"] = WiFi.localIP().toString();
  }
  doc["ssid_guardado"] = wifiSSID;

  String json;
  serializeJson(doc, json);
  server.send(200, "application/json", json);

  Serial.println("[Portal] GET /estado → " + json);
}

void registrarRutasPortal() {
  static bool rutasRegistradas = false;
  if (rutasRegistradas) {
    return;
  }
  rutasRegistradas = true;

  server.on("/", HTTP_GET, manejarRutaRaiz);
  server.on("/conectar", HTTP_POST, manejarConectar);
  server.on("/estado", HTTP_GET, manejarEstado);
}

void iniciarModoAP() {
  modoAP = true;

  Serial.println("[WiFi] Entrando en modo AP (portal de configuración)");

  WiFi.disconnect(true);
  delay(100);
  WiFi.mode(WIFI_AP);
  WiFi.softAPConfig(AP_IP, AP_IP, IPAddress(255, 255, 255, 0));
  WiFi.softAP(AP_SSID, AP_PASSWORD);

  Serial.print("[WiFi] Red creada: ");
  Serial.println(AP_SSID);
  Serial.print("[WiFi] Portal en http://");
  Serial.println(WiFi.softAPIP());

  registrarRutasPortal();
  server.begin();
  Serial.println("[Portal] Servidor web activo en puerto 80");
}

// ── Modo Station ──────────────────────────────────────────────────────────────

bool conectarWiFi() {
  if (wifiSSID.length() == 0) {
    Serial.println("[WiFi] No hay SSID guardado");
    return false;
  }

  Serial.println("[WiFi] Modo Station — intentando conexión...");
  Serial.print("[WiFi] SSID: ");
  Serial.println(wifiSSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(wifiSSID.c_str(), wifiPassword.c_str());

  unsigned long inicio = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - inicio < WIFI_TIMEOUT_MS) {
    delay(250);
    Serial.print(".");
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("[WiFi] Conectado. IP: ");
    Serial.println(WiFi.localIP());
    return true;
  }

  Serial.println("[WiFi] No se pudo conectar en 10 segundos");
  return false;
}

bool botonResetPresionado() {
  pinMode(RESET_PIN, INPUT_PULLUP);

  if (digitalRead(RESET_PIN) != LOW) {
    return false;
  }

  Serial.println("[Reset] Botón BOOT presionado, esperando 3 segundos...");
  unsigned long inicio = millis();

  while (millis() - inicio < 3000) {
    if (digitalRead(RESET_PIN) != LOW) {
      Serial.println("[Reset] Botón soltado antes de 3 s");
      return false;
    }
    delay(50);
  }

  Serial.println("[Reset] BOOT mantenido 3 s — borrando WiFi y abriendo portal");
  return true;
}

void iniciarModoStation() {
  modoAP = false;
  mqtt.setServer(MQTT_SERVER, MQTT_PORT);
  mqtt.setCallback(callbackMQTT);
  mqtt.setBufferSize(256);
  conectarMQTT();
}

// ── Setup y loop ──────────────────────────────────────────────────────────────

void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\n[SmartHome] Iniciando ESP32...");

  pinMode(PIN_LED_ROJO, OUTPUT);
  pinMode(PIN_LED_VERDE, OUTPUT);
  pinMode(PIN_LED_AZUL, OUTPUT);
  digitalWrite(PIN_LED_ROJO, LOW);
  digitalWrite(PIN_LED_VERDE, LOW);
  digitalWrite(PIN_LED_AZUL, LOW);

  // Reset WiFi: mantener BOOT 3 s al encender
  if (botonResetPresionado()) {
    borrarCredenciales();
    iniciarModoAP();
    return;
  }

  leerCredenciales();

  // Sin credenciales → portal
  if (wifiSSID.length() == 0) {
    iniciarModoAP();
    return;
  }

  // Con credenciales → intentar Station; si falla, borrar y portal
  if (conectarWiFi()) {
    iniciarModoStation();
    return;
  }

  Serial.println("[WiFi] Conexión fallida — borrando credenciales y abriendo portal");
  borrarCredenciales();
  iniciarModoAP();
}

void loop() {
  if (modoAP) {
    server.handleClient();
    return;
  }

  // Modo Station: reconectar WiFi si se pierde
  if (WiFi.status() != WL_CONNECTED) {
    unsigned long now = millis();
    if (now - lastWifiReconnectAttempt >= WIFI_RECONNECT_MS) {
      lastWifiReconnectAttempt = now;
      Serial.println("[WiFi] Conexión perdida, reintentando...");

      if (!conectarWiFi()) {
        Serial.println("[WiFi] Reconexión fallida — entrando en modo AP");
        borrarCredenciales();
        iniciarModoAP();
      }
    }
    return;
  }

  if (!mqtt.connected()) {
    conectarMQTT();
  }
  mqtt.loop();
}
