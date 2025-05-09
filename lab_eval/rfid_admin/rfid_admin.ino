#include <WiFi.h>
#include <PubSubClient.h>
#include <SPI.h>
#include <MFRC522.h>

// —— USER CONFIGURATION ——
// Your Wi‑Fi credentials:
const char* SSID     = "SMB";
const char* PASSWORD = "BH1B127@#88";

// Your MQTT broker’s IP (on your LAN) and port:
const char* MQTT_SERVER = "172.22.28.218";   // ← removed leading space
const uint16_t MQTT_PORT = 1883;

// MQTT topic to publish card UIDs to:
//   must match your Next.js subscriber
const char* MQTT_TOPIC = "rfid_details";      // ← changed from "$SYS/broker"

WiFiClient   wifiClient;
PubSubClient mqttClient(wifiClient);

// RC522 ↔ ESP32‑C6 pin definitions
constexpr uint8_t SCK_PIN  = 18;  // VSPI SCK
constexpr uint8_t MISO_PIN = 19;  // VSPI MISO
constexpr uint8_t MOSI_PIN = 23;  // VSPI MOSI
constexpr uint8_t SS_PIN   = 5;   // SDA / SS
constexpr uint8_t RST_PIN  = 22;  // RST

MFRC522 mfrc522(SS_PIN, RST_PIN);

void setup() {
  Serial.begin(115200);
  delay(100);

  // 1) Init SPI bus
  // SPI.begin(SCK_PIN, MISO_PIN, MOSI_PIN, SS_PIN);
  // mfrc522.PCD_Init();
  // Serial.println("✅ RC522 RFID reader initialized");

  // 2) Connect to Wi‑Fi
  Serial.printf("🌐 Connecting to Wi-Fi SSID '%s'…", SSID);
  WiFi.begin(SSID, PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(250);
    Serial.print('.');
  }
  Serial.printf("\n✅ Wi-Fi connected, IP: %s\n", WiFi.localIP().toString().c_str());

  // 3) Setup MQTT
  mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
  reconnectMQTT();
}

void loop() {
  // Keep MQTT alive
  if (!mqttClient.connected()) {
    reconnectMQTT();
  }
  mqttClient.loop();

  // Check for a new card
  if (mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial()) {
    // Build UID string
    String uidStr;
    for (byte i = 0; i < mfrc522.uid.size; i++) {
      if (mfrc522.uid.uidByte[i] < 0x10) uidStr += '0';
      uidStr += String(mfrc522.uid.uidByte[i], HEX);
      if (i < mfrc522.uid.size - 1) uidStr += ':';
    }
    uidStr.toUpperCase();

    Serial.print("🔖 Card detected, UID: ");
    Serial.println(uidStr);

    // Publish to MQTT
    if (mqttClient.publish(MQTT_TOPIC, uidStr.c_str())) {
      Serial.println("🚀 Published successfully");
    } else {
      Serial.println("❌ Publish failed");
    }

    // Halt and wait for next scan
    mfrc522.PICC_HaltA();
    delay(200);  // debounce
  }
}

void reconnectMQTT() {
  while (!mqttClient.connected()) {
    Serial.printf("🔄 Attempting MQTT connection to %s:%d …\n", MQTT_SERVER, MQTT_PORT);
    String clientId = "esp32_rfid_";
    clientId += String(random(0xffff), HEX);

    if (mqttClient.connect(clientId.c_str())) {
      Serial.println("✅ MQTT connected");
    } else {
      Serial.printf("❌ failed, rc=%d. retrying in 2 s\n", mqttClient.state());
      delay(2000);
    }
  }
}
