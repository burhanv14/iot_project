#include <WiFi.h>
#include <SPI.h>
#include <MFRC522.h>
#include <PubSubClient.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>  // Changed to I2C LCD library

// ========== RFID Setup ==========
#define SS_PIN   5   // RFID SS
#define RST_PIN  22  // RFID RST
MFRC522 rfid(SS_PIN, RST_PIN); 

// ========== LCD Setup ==========
// For I2C LCD - using default I2C pins (SDA=21, SCL=22 on ESP32)
// 0x27 is the default I2C address for most I2C LCD backpacks
// If not working, you might need to use 0x3F or scan for the correct address

LiquidCrystal_I2C lcd(0x27, 16, 2);  // Set the LCD address to 0x27 for a 16 chars and 2 line display

// ========== Wi-Fi and MQTT ==========
const char* ssid = "oneplus_ayush";
const char* password = "12345678";
const char* mqtt_server = "192.168.46.183";
const uint16_t mqtt_port = 1883;

WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);

// ========== Setup ==========
void setup() {
  Serial.begin(9600);
  
  // Initialize I2C
  Wire.begin(20, 21);  // SDA and SCL use default pins (21 and 22 on ESP32)
  // Initialize the LCD
  lcd.init();
  lcd.backlight();
  lcd.print("Starting...");

  // SPI for RFID
  SPI.begin(18, 19, 23, SS_PIN);  // SCK, MISO, MOSI, SS
  rfid.PCD_Init();
  Serial.println("RFID initialized");

  // Wi-Fi
  WiFi.begin(ssid, password);
  lcd.clear();
  lcd.print("Connecting WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
  lcd.clear();
  lcd.print("WiFi Connected");

  // MQTT
  mqttClient.setServer(mqtt_server, mqtt_port);
  mqttClient.setCallback(mqttCallback);
  connectMQTT();

  lcd.clear();
  lcd.print("Ready to scan");
}

// ========== MQTT Reconnect ==========
void connectMQTT() {
  while (!mqttClient.connected()) {
    Serial.print("Connecting to MQTT...");
    if (mqttClient.connect("ESP32RFIDClient")) {
      mqttClient.publish("rfid/status", "ESP32 online");
      mqttClient.subscribe("rfid/dispensed");
      Serial.println("connected");
    } else {
      Serial.print(".");
      delay(2000);
    }
  }
}

// ========== MQTT Message Handling ==========
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String message;
  for (unsigned int i = 0; i < length; i++) {
    message += (char)payload[i];
  }

  Serial.print("Message from [");
  Serial.print(topic);
  Serial.print("]: ");
  Serial.println(message);

  lcd.clear();
  lcd.setCursor(0, 0);

  if (message.startsWith("ITEM:") || message.startsWith("NAME:")) {
    // Parse product info and quantity
    String prefix = message.startsWith("ITEM:") ? "ITEM:" : "NAME:";
    int prefixLen = prefix.length();
    int infoEndPos = message.indexOf(",QTY:");
    int qtyStartPos = infoEndPos + 5;  // Position after ",QTY:"
    
    if (infoEndPos > 0) {
      String productInfo = message.substring(prefixLen, infoEndPos);
      String quantity = message.substring(qtyStartPos);
      
      // Display product info and quantity in a user-friendly format
      if (message.startsWith("ITEM:")) {
        lcd.print("Product ID: " + productInfo);
      } else {
        // For NAME: messages, display the product name
        lcd.print(productInfo);
      }
      
      lcd.setCursor(0, 1);
      lcd.print("Quantity: " + quantity);
      
      Serial.println("Parsed - Product: " + productInfo + ", Quantity: " + quantity);
    } else {
      // Fallback if parsing fails
      lcd.print("Item Info:");
      lcd.setCursor(0, 1);
      lcd.print(message.substring(0, 16));
    }
  } else if (message.startsWith("DISPENSED:")) {
    lcd.print("Order Dispensed!");
    lcd.setCursor(0, 1);
    lcd.print("Order #" + message.substring(10, 16));
  } else if (message == "ERROR") {
    lcd.print("Error occurred!");
    lcd.setCursor(0, 1);
    lcd.print("Try again later");
  } else if (message.startsWith("Hi, Sorry")) {
    lcd.print("No orders found");
    lcd.setCursor(0, 1);
    lcd.print("Try again later");
  } else {
    lcd.print("Message:");
    lcd.setCursor(0, 1);
    lcd.print(message.substring(0, 16));
  }
  
  // Automatically clear the LCD after 3 seconds and go back to "Ready to scan"
  // for non-error messages
  if (!message.startsWith("ERROR") && !message.startsWith("Hi, Sorry")) {
    delay(3000);
    lcd.clear();
    lcd.print("Ready to scan");
  }
}

// ========== Main Loop ==========
void loop() {
  if (!mqttClient.connected()) {
    connectMQTT();
  }
  mqttClient.loop();

  // RFID scan
  if (rfid.PICC_IsNewCardPresent() && rfid.PICC_ReadCardSerial()) {
    String uid = "";
    for (byte i = 0; i < rfid.uid.size; i++) {
      if (rfid.uid.uidByte[i] < 0x10) uid += "0";
      uid += String(rfid.uid.uidByte[i], HEX);
    }
    uid.toUpperCase();
    Serial.println("UID: " + uid);

    mqttClient.publish("rfid/status", uid.c_str());

    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Card UID:");
    lcd.setCursor(0, 1);
    lcd.print(uid.substring(0, 16));

    delay(1000);  // Show UID
    lcd.clear();
    lcd.print("Processing...");
    rfid.PICC_HaltA();
    delay(1000);
  }
}