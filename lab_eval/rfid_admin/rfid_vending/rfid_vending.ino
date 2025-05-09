// ESP32 RFID Reader with MQTT Integration
#include <WiFi.h>
#include <SPI.h>
#include <MFRC522.h>
#include <PubSubClient.h>
// #include <LiquidCrystal.h>     // Uncomment if using LCD

// ===== RFID Pins (SPI) =====
#define SS_PIN   5     // GPIO5 for RFID SS
#define RST_PIN  22    // GPIO22 for RFID RST
MFRC522 rfid(SS_PIN, RST_PIN);

// ===== LCD Pins (4‑bit mode) =====
// LiquidCrystal lcd(2, 4, 16, 17, 18, 19);  
//            RS, E, D4, D5, D6, D7

// ===== Wi‑Fi & MQTT =====
const char* ssid = "SMB";
const char* password = "BH1B127@#88";
const char* mqtt_server = "172.22.28.218";
const uint16_t mqtt_port = 1883;

WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);

void setup() {
  Serial.begin(115200);
  Serial.println("Starting RFID reader...");
  
  // --- Init LCD ---
  // lcd.begin(16, 2);             
  // lcd.print("RFID Init...");    // splash message

  // --- Init SPI & RFID ---
  SPI.begin(18, 19, 23, SS_PIN); // SCK, MISO, MOSI, SS
  rfid.PCD_Init();               // init RFID reader
  Serial.println("RFID initialized");

  // --- Connect WiFi ---
  Serial.print("Connecting to WiFi");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
  
  // lcd.clear();
  // lcd.print("WiFi Connected");

  // --- Setup MQTT ---
  mqttClient.setServer(mqtt_server, mqtt_port);
  connectMQTT();
  
  // lcd.clear();
  // lcd.print("Ready to scan");
  Serial.println("Ready to scan RFID cards");
}

void connectMQTT() {
  Serial.print("Connecting to MQTT broker...");
  while (!mqttClient.connected()) {
    if (mqttClient.connect("ESP32RFIDClient")) {
      mqttClient.publish("rfid/status", "online");
      Serial.println("connected");
    } else {
      Serial.print(".");
      delay(2000);
    }
  }
}

void loop() {
  // Ensure MQTT connection is maintained
  if (!mqttClient.connected()) {
    connectMQTT();
  }
  mqttClient.loop();

  // Check for RFID card
  if (rfid.PICC_IsNewCardPresent() && rfid.PICC_ReadCardSerial()) {
    String uid = "";
    for (byte i = 0; i < rfid.uid.size; i++) {
      uid += String(rfid.uid.uidByte[i] < 0x10 ? "0" : "");
      uid += String(rfid.uid.uidByte[i], HEX);
    }
    uid.toUpperCase();
    Serial.println("UID: " + uid);
    
    // Publish to the topic that the Node.js script is subscribed to
    mqttClient.publish("rfid/scan", uid.c_str());
    
    // lcd.clear();
    // lcd.print("Card: " + uid);
    
    rfid.PICC_HaltA(); // Stop reading
    delay(1000);       // Prevent multiple reads
  }
}