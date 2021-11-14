#include <Arduino.h>
#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEScan.h>
#include <BLEBeacon.h>
#include <BLEAdvertisedDevice.h>

#include <WiFi.h>
#include <HTTPClient.h>

#define ENDIAN_CHANGE_U16(x) ((((x)&0xFF00) >> 8) + (((x)&0xFF) << 8))

#define scanTime 1 //In seconds
#define BEACON_RECEIVER_ID (int)1

BLEScan* pBLEScan;
bool scanEnable = true;

const char* ssid = "Aphcarios";
const char* password = "aphcarios2019";
const char* postUrl = "http://192.168.1.110:8009/send_rssi";

std::string  myBeaconUuid = "3f350d46-8a5f-435c-a016-b7ee68cc5957";

typedef struct{
  uint16_t id; //Which beacon? 1, 2,3 or 4. Based on major
  int rssi;
} DiscoveredBeacon;

DiscoveredBeacon discoveredBeacons[4];

class MyAdvertisedDeviceCallbacks: public BLEAdvertisedDeviceCallbacks {
    void onResult(BLEAdvertisedDevice advertisedDevice) {
      if (advertisedDevice.haveManufacturerData() == true){
        std::string strManufacturerData = advertisedDevice.getManufacturerData();

        uint8_t cManufacturerData[100];
        strManufacturerData.copy((char *)cManufacturerData, strManufacturerData.length(), 0);

        // Check for iBeacons Only
        if (strManufacturerData.length() == 25 && cManufacturerData[0] == 0x4C && cManufacturerData[1] == 0x00)
          {
            Serial.println("Found iBeacon!");

            BLEBeacon oBeacon = BLEBeacon();
            oBeacon.setData(strManufacturerData);

            std::string strBeaconUUID = oBeacon.getProximityUUID().toString();
            const char *cBeaconUUID = strBeaconUUID.c_str();

            //Check if the beacon is OURS depending on uuid
            // if(strBeaconUUID == myBeaconUuid){
              int rssi = advertisedDevice.getRSSI();
              uint16_t major = ENDIAN_CHANGE_U16(oBeacon.getMajor());
              uint16_t minor = ENDIAN_CHANGE_U16(oBeacon.getMinor());
              uint16_t manuId = oBeacon.getManufacturerId();

              //Send data via WiFi to the server
              
              //Check WiFi connection status
              if(WiFi.status()== WL_CONNECTED){
                WiFiClient client;
                HTTPClient http;

                http.begin(client, postUrl);
                http.addHeader("Content-Type", "application/json");

                String payload = "{\"beaconReceiverId\": " + String(BEACON_RECEIVER_ID) + 
                                  ", \"rssi\": " + String(rssi) +
                                  ", \"major\": " + String(major) + 
                                  ", \"minor\": " + String(minor) + 
                                  "}";
                // Data to send with HTTP POST
                // String payload = strJsonData1;
                Serial.println(payload);
                // Send HTTP POST request
                int httpResponseCode = http.POST(payload);

                Serial.print("Response code:");
                Serial.println(httpResponseCode);
              }

              // Serial.printf(
              //   "ID: %04X Major: %d Minor: %d UUID: %s Power: %d RSSI: %i\n",
              //   manuId,
              //   major,
              //   minor,
              //   cBeaconUUID,
              //   oBeacon.getSignalPower(),
              //   rssi
              // );
            // }
          }
      }
    }
};

void setup() {
  Serial.begin(115200);
  //BLE setup
  BLEDevice::init("");
  pBLEScan = BLEDevice::getScan(); //create new scan
  pBLEScan->setAdvertisedDeviceCallbacks(new MyAdvertisedDeviceCallbacks());
  pBLEScan->setActiveScan(true); //active scan uses more power, but get results faster
  pBLEScan->setInterval(1000);
  pBLEScan->setWindow(500);  //less or equal setInterval value

  //WiFi setup
  WiFi.begin(ssid, password);

  while(WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.print(F("Connected to WiFi network with IP Address: "));
  Serial.println(WiFi.localIP());


}

void loop() {
  if(scanEnable){
    // put your main code here, to run repeatedly:
    BLEScanResults foundDevices = pBLEScan->start(scanTime, false);
    Serial.print(F("Devices found: "));
    Serial.println(foundDevices.getCount());
    Serial.println(F("Scan done!"));
    pBLEScan->clearResults();   // delete results fromBLEScan buffer to release memory
  }
}
