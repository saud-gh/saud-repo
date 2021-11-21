//  SerialIn_SerialOut_HM-10_01
//
//  Uses hardware serial to talk to the host computer and AltSoftSerial for communication with the bluetooth module
//
//  What ever is entered in the serial monitor is sent to the connected device
//  Anything received from the connected device is copied to the serial monitor
//  Does not send line endings to the HM-10
//
//  Pins
//  BT VCC to Arduino 5V out. 
//  BT GND to GND
//  Arduino D8 (SS RX) - BT TX no need voltage divider 
//  Arduino D9 (SS TX) - BT RX through a voltage divider (5v to 3.3v)
//
 
#include <Arduino.h>
#include <SoftwareSerial.h>

#define NUM_OF_COMMANDS 8

SoftwareSerial bleSerial(8,9);

// String rxStr = "";
String response = "";
int ii_0 = 0;

String sendATCommand(String cmdStr);


const char cmd1[] PROGMEM = "AT+VERSION";
const char cmd2[] PROGMEM = "AT+RESET";
const char cmd3[] PROGMEM = "AT";
const char cmd4[] PROGMEM = "AT+MARJ0x0017";
const char cmd5[] PROGMEM = "AT+MINO0x0004";
const char cmd6[] PROGMEM = "AT+ADVI2";
const char cmd7[] PROGMEM = "AT+NAMEiBeacon";
const char cmd8[] PROGMEM = "AT+IBEA1";

const char* const commands[] PROGMEM = {
  cmd1, cmd2, cmd3,
  cmd4, cmd5, cmd6, cmd7, cmd8
};

void setup() {  
  Serial.begin(115200);
  bleSerial.begin(9600);

  delay(100);

  char buffer[15];

  for(uint8_t i = 0; i < NUM_OF_COMMANDS; i++){
    strcpy_P(buffer, (char *)pgm_read_word(&(commands[i])));
    Serial.print(buffer);
    Serial.print(" -----> ");
    Serial.println(sendATCommand((String)buffer));
    
    delay(500);
  }
  
  // sendATCommand(F("AT+RENEW")); //Restore to factory defaults
  // sendATCommand(F("AT+RESET")); //Reboot
  // sendATCommand(F("AT")); //AT test
  // sendATCommand(F("AT+MARJ0x0017")); //Set Major number
  // sendATCommand(F("AT+MINO0x0004")); //Set minor number
  // sendATCommand(F("AT+ADVI2")); //Set advertising interval
  // sendATCommand(F("AT+NAMEiBeacon")); //Set name
  // sendATCommand(F("AT+ADTY3")); //Set module to non-connectable
  // sendATCommand(F("AT+IBEA1")); //Set Enable iBeacon mode
  // sendATCommand(F("AT+DELO2")); //Set iBeacon in boadcast mode
  // sendATCommand(F("AT+PWRM0")); //Set to auto sleep mode
  // sendATCommand(F("AT+RESET")); //Reboot

  Serial.println(F("Programing completed...."));
}

void loop() {
  // while (bleSerial.available()){
  //   char in_char = bleSerial.read();
  //   if (int(in_char)!=-1 and int(in_char)!=42){
  //     rxStr+=in_char;
  //   }
  //   if (in_char=='\n'){
  //     delay(20);
  //     String msg = "Msg: ";
  //     msg+=rxStr;
  //     bleSerial.print(msg);
  //     rxStr = "";
  //   }
  // }
}

String sendATCommand(String cmdStr){
  response = "";
  unsigned long currentTime = millis();
  bleSerial.println(cmdStr);

  while (true){
    char rxChar = bleSerial.read();

    if (int(rxChar) == -1 || int(rxChar) == 42){
      if ((millis() - currentTime) > 3000){ // 2 second timeout
        return "Timeout....Something went wrong";
      }
      // Serial.println("hi there!");
      continue;
    }

    if (rxChar=='\n'){
      return response;
    }

    response += rxChar;
  }
}
