/**
 * ESP32-C6-WROOM-1 RFID Reader with WiFi Integration
 * 
 * This example demonstrates how to:
 * 1. Initialize the MFRC522 RFID module with ESP32-C6-WROOM-1
 * 2. Connect to WiFi network
 * 3. Send RFID tag data to a web server
 * 
 * Wiring is the same as the basic example
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <SPI.h>
#include "MFRC522.h"

// Define pins for ESP32-C6-WROOM-1
#define SS_PIN    5     // SPI Chip Select
#define RST_PIN   22     // Reset pin
#define SCK_PIN   18    // SPI Clock pin
#define MISO_PIN  19    // SPI MISO pin
#define MOSI_PIN  23    // SPI MOSI pin
#define LED_PIN   2     // LED pin

// WiFi credentials
const char* ssid = "oneplus_ayush";
const char* password = "12345678";

// Web server details
const char* serverUrl = "http://your-server.com/api/rfid";

// Create MFRC522 instance
MFRC522 rfid(SS_PIN, RST_PIN, SCK_PIN, MISO_PIN, MOSI_PIN);

// Track last detected tag to prevent duplicate notifications
String lastTagId = "";
unsigned long lastTagTime = 0;
const unsigned long tagCooldown = 5000; // 5 seconds between same tag readings

// Callback function when a tag is detected
void tagDetected(MFRC522::TagInfo tag) {
  String tagId = tag.getHex();
  Serial.print("Tag detected! UID: ");
  Serial.println(tagId);
  
  // Prevent duplicate readings of the same tag within cooldown period
  unsigned long currentTime = millis();
  if (tagId != lastTagId || (currentTime - lastTagTime > tagCooldown)) {
    // Update the last tag info
    lastTagId = tagId;
    lastTagTime = currentTime;
    
    // Visual indicator
    digitalWrite(LED_PIN, HIGH);
    
    // Send tag data to server
    sendTagToServer(tagId);
    
    // Turn off LED after a delay
    delay(200);
    digitalWrite(LED_PIN, LOW);
  }
}

void sendTagToServer(String tagId) {
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected. Reconnecting...");
    setupWiFi();
    return;
  }
  
  HTTPClient http;
  
  // Configure target server and URL
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");
  
  // Prepare the JSON payload
  String jsonPayload = "{\"tagId\":\"" + tagId + "\"}";
  
  // Send HTTP POST request
  int httpResponseCode = http.POST(jsonPayload);
  
  if (httpResponseCode > 0) {
    Serial.print("HTTP Response code: ");
    Serial.println(httpResponseCode);
    String payload = http.getString();
    Serial.println(payload);
  } else {
    Serial.print("Error code: ");
    Serial.println(httpResponseCode);
  }
  
  // Free resources
  http.end();
}

void setupWiFi() {
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);
  
  WiFi.begin(ssid, password);
  
  // Wait for connection with timeout
  int timeout = 20; // seconds
  while (WiFi.status() != WL_CONNECTED && timeout > 0) {
    delay(500);
    Serial.print(".");
    timeout--;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("");
    Serial.println("WiFi connected");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("");
    Serial.println("WiFi connection failed!");
  }
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  // Initialize pins
  pinMode(LED_PIN, OUTPUT);
  
  // Initialize RFID reader
  rfid.begin();
  Serial.println("RFID Reader initialized");
  
  // Connect to WiFi
  setupWiFi();
  
  // Set up RFID scanning
  rfid.scan(125, 1000, tagDetected);
  
  Serial.println("System ready!");
}

void loop() {
  // Update the RFID scanner
  rfid.update();
  
  // Check WiFi connection and reconnect if needed
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected, attempting to reconnect");
    setupWiFi();
  }
  
  // ESP32 specific - yield processing time
  delay(1);
}