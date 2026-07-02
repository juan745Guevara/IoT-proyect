#include <WiFi.h>
#include <WebServer.h>
#include <Preferences.h>
#include <ArduinoJson.h>
#include <PubSubClient.h>
#include <DHT.h>

#include <esp_task_wdt.h>

// ── Constantes ──────────────────────────────────────────────────────────────
const char* AP_SSID = "Invernadero-Config";
const char* AP_PASSWORD = "";
const IPAddress AP_IP(192, 168, 4, 1);

const char* ZONA_ID = "zona1";  // Cambiar por zona antes de flashear

const char* MQTT_SERVER = "TU_IP_EC2"; // editar antes de flashear
const int MQTT_PORT = 1883;
const char* MQTT_CLIENT_ID = "esp32-invernadero";

char TOPIC_SENSORES[48];
char TOPIC_ACTUADORES[52];
char TOPIC_HEARTBEAT[52];

void initTopics() {
  snprintf(TOPIC_SENSORES, sizeof(TOPIC_SENSORES), "invernadero/%s/sensores", ZONA_ID);
  snprintf(TOPIC_ACTUADORES, sizeof(TOPIC_ACTUADORES), "invernadero/%s/actuadores", ZONA_ID);
  snprintf(TOPIC_HEARTBEAT, sizeof(TOPIC_HEARTBEAT), "invernadero/%s/heartbeat", ZONA_ID);
}

const int DHTPIN = 4;
const int SOIL_PIN = 34;
const int LDR_PIN = 35;
const int RELAY_VENTILADOR = 26;
const int RELAY_BOMBA = 27;
const int RESET_PIN = 0;

#define DHTTYPE DHT22
const unsigned long INTERVALO_LECTURA = 5000;
const unsigned long INTERVALO_HEARTBEAT = 30000;
const unsigned long WIFI_TIMEOUT_MS = 10000;
const unsigned long WIFI_RECONNECT_MS = 5000;
const unsigned long MQTT_RETRY_INICIAL_MS = 5000;
const unsigned long MQTT_RETRY_MAX_MS = 60000;
const int WDT_TIMEOUT_SEG = 30;

// ── Objetos globales ────────────────────────────────────────────────────────
Preferences preferences;
WebServer server(80);
WiFiClient espClient;
PubSubClient mqtt(espClient);
DHT dht(DHTPIN, DHTTYPE);

String wifiSSID = "";
String wifiPassword = "";
bool modoAP = false;

unsigned long lastMqttReconnectAttempt = 0;
unsigned long mqttRetryDelay = MQTT_RETRY_INICIAL_MS;
unsigned long lastWifiReconnectAttempt = 0;
unsigned long lastSensorRead = 0;
unsigned long lastHeartbeat = 0;

// ── Sensores y actuadores ─────────────────────────────────────────────────────

int leerHumedadSuelo() {
  int raw = analogRead(SOIL_PIN);
  return map(raw, 4095, 0, 0, 100);
}

int leerLuminosidad() {
  int raw = analogRead(LDR_PIN);
  return map(raw, 0, 4095, 0, 100);
}

void aplicarActuador(int pin, const char* estado) {
  if (strcmp(estado, "ON") == 0) {
    digitalWrite(pin, LOW);
    Serial.printf("[Actuador] Pin %d → ON (LOW)\n", pin);
  } else if (strcmp(estado, "OFF") == 0) {
    digitalWrite(pin, HIGH);
    Serial.printf("[Actuador] Pin %d → OFF (HIGH)\n", pin);
  } else {
    Serial.printf("[Actuador] Estado desconocido: %s\n", estado);
  }
}

void publicarSensores() {
  float temperatura = dht.readTemperature();
  float humedadAire = dht.readHumidity();
  int humedadSuelo = leerHumedadSuelo();
  int luminosidad = leerLuminosidad();

  if (isnan(temperatura) || isnan(humedadAire)) {
    Serial.println("[DHT] Error de lectura, reintentando en el próximo ciclo");
    return;
  }

  StaticJsonDocument<192> doc;
  doc["temperatura"] = round(temperatura * 10) / 10.0;
  doc["humedad_aire"] = round(humedadAire * 10) / 10.0;
  doc["humedad_suelo"] = humedadSuelo;
  doc["luminosidad"] = luminosidad;

  char buffer[192];
  serializeJson(doc, buffer);

  if (mqtt.publish(TOPIC_SENSORES, buffer)) {
    Serial.printf("[MQTT] Publicado %s → %s\n", TOPIC_SENSORES, buffer);
  } else {
    Serial.println("[MQTT] Error al publicar sensores");
  }
}

void publicarHeartbeat() {
  StaticJsonDocument<96> doc;
  doc["zona"] = ZONA_ID;
  doc["uptime_ms"] = millis();

  char buffer[96];
  serializeJson(doc, buffer);

  if (mqtt.publish(TOPIC_HEARTBEAT, buffer)) {
    Serial.printf("[MQTT] Heartbeat → %s\n", buffer);
  } else {
    Serial.println("[MQTT] Error al publicar heartbeat");
  }
}

void callbackMQTT(char* topic, byte* payload, unsigned int length) {
  StaticJsonDocument<128> doc;
  DeserializationError error = deserializeJson(doc, payload, length);

  if (error) {
    Serial.print("[MQTT] JSON inválido: ");
    Serial.println(error.c_str());
    return;
  }

  const char* actuador = doc["actuador"];
  const char* estado = doc["estado"];

  if (!actuador || !estado) {
    Serial.println("[MQTT] Campos 'actuador' o 'estado' no encontrados");
    return;
  }

  Serial.printf("[MQTT] Comando: %s → %s\n", actuador, estado);

  if (strcmp(actuador, "ventilador") == 0) {
    aplicarActuador(RELAY_VENTILADOR, estado);
  } else if (strcmp(actuador, "bomba") == 0) {
    aplicarActuador(RELAY_BOMBA, estado);
  } else {
    Serial.printf("[MQTT] Actuador desconocido: %s\n", actuador);
  }
}

void conectarMQTT() {
  if (mqtt.connected()) {
    return;
  }

  unsigned long now = millis();
  if (now - lastMqttReconnectAttempt < mqttRetryDelay) {
    return;
  }
  lastMqttReconnectAttempt = now;

  Serial.print("[MQTT] Conectando a ");
  Serial.print(MQTT_SERVER);
  Serial.print(":");
  Serial.println(MQTT_PORT);

  if (mqtt.connect(MQTT_CLIENT_ID)) {
    Serial.print("[MQTT] Conectado. Suscrito a ");
    Serial.println(TOPIC_ACTUADORES);
    mqtt.subscribe(TOPIC_ACTUADORES);
    mqttRetryDelay = MQTT_RETRY_INICIAL_MS;
    lastHeartbeat = 0;
    return;
  }

  Serial.printf("[MQTT] Falló, rc=%d. Reintentando en %lums\n", mqtt.state(), mqttRetryDelay);
  mqttRetryDelay = min(mqttRetryDelay * 2, MQTT_RETRY_MAX_MS);
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
  <title>Invernadero Config</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, sans-serif;
      background: #0f1a12;
      color: #e8f5e9;
      padding: 1.25rem;
      line-height: 1.5;
    }
    .card {
      max-width: 420px;
      margin: 0 auto;
      background: #1a2e1e;
      border: 1px solid #2d4a32;
      border-radius: 12px;
      padding: 1.5rem;
    }
    h2 { font-size: 1.25rem; margin-bottom: 0.25rem; }
    p.sub { color: #a5d6a7; font-size: 0.9rem; margin-bottom: 1.25rem; }
    label { display: block; margin-top: 1rem; margin-bottom: 0.35rem; font-size: 0.9rem; }
    select, input {
      width: 100%;
      padding: 0.65rem;
      border-radius: 8px;
      border: 1px solid #2d4a32;
      background: #0f1a12;
      color: #e8f5e9;
      font-size: 1rem;
    }
    button {
      width: 100%;
      margin-top: 1.25rem;
      padding: 0.75rem;
      border: none;
      border-radius: 8px;
      background: #4caf50;
      color: #fff;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
    }
    button:active { background: #388e3c; }
  </style>
</head>
<body>
  <div class="card">
    <h2>Configuración WiFi — Invernadero</h2>
    <p class="sub">Conéctate a la red <strong>Invernadero-Config</strong> y elige tu WiFi.</p>
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
  html += "<title>Invernadero</title><style>body{font-family:system-ui;background:#0f1a12;";
  html += "color:#e8f5e9;padding:2rem;text-align:center;}p{max-width:360px;margin:0 auto;}";
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
  dht.begin();
  conectarMQTT();
  lastSensorRead = 0;
  lastHeartbeat = 0;
}

// ── Setup y loop ──────────────────────────────────────────────────────────────

void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\n[Invernadero] Iniciando ESP32...");
  initTopics();

  esp_task_wdt_init(WDT_TIMEOUT_SEG, true);
  esp_task_wdt_add(NULL);
  Serial.printf("[WDT] Watchdog activo (%ds)\n", WDT_TIMEOUT_SEG);

  pinMode(RELAY_VENTILADOR, OUTPUT);
  pinMode(RELAY_BOMBA, OUTPUT);
  digitalWrite(RELAY_VENTILADOR, HIGH);
  digitalWrite(RELAY_BOMBA, HIGH);

  if (botonResetPresionado()) {
    borrarCredenciales();
    iniciarModoAP();
    return;
  }

  leerCredenciales();

  if (wifiSSID.length() == 0) {
    iniciarModoAP();
    return;
  }

  if (conectarWiFi()) {
    iniciarModoStation();
    return;
  }

  Serial.println("[WiFi] Conexión fallida — borrando credenciales y abriendo portal");
  borrarCredenciales();
  iniciarModoAP();
}

void loop() {
  esp_task_wdt_reset();

  if (modoAP) {
    server.handleClient();
    return;
  }

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

  unsigned long now = millis();
  if (mqtt.connected() && now - lastSensorRead >= INTERVALO_LECTURA) {
    lastSensorRead = now;
    publicarSensores();
  }

  if (mqtt.connected() && now - lastHeartbeat >= INTERVALO_HEARTBEAT) {
    lastHeartbeat = now;
    publicarHeartbeat();
  }
}
