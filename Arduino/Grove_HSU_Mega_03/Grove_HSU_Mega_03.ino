/**************************************************************************/
/*! 
    This example will wait for any ISO14443A card or tag, and
    depending on the size of the UID will attempt to read from it.
   
    If the card has a 4-byte UID it is probably a Mifare
    Classic card, and the following steps are taken:
   
    - Authenticate block 4 (the first block of Sector 1) using
      the default KEYA of 0XFF 0XFF 0XFF 0XFF 0XFF 0XFF
    - If authentication succeeds, we can then read any of the
      4 blocks in that sector (though only block 4 is read here)
   
    If the card has a 7-byte UID it is probably a Mifare
    Ultralight card, and the 4 byte pages can be read directly.
    Page 4 is read by default since this is the first 'general-
    purpose' page on the tags.

    To enable debug message, define DEBUG in PN532/PN532_debug.h
*/
/**************************************************************************/


#include <PN532_HSU.h>
#include <PN532.h>
    
PN532_HSU pn532hsu1(Serial1);
PN532 nfc1(pn532hsu1);

PN532_HSU pn532hsu2(Serial2);
PN532 nfc2(pn532hsu2);

PN532_HSU pn532hsu3(Serial3);
PN532 nfc3(pn532hsu3);

int timeOut = 2000;
unsigned long readTime1;
unsigned long readTime2;
unsigned long readTime3;

const char STX = 0x02;
const char ETX = 0x03;

char curChar = 'C';

void setup(void) {
  Serial.begin(115200);
  Serial.println("Hello!");

  nfc1.begin();
  getFirmware(nfc1);
  
  nfc2.begin();
  getFirmware(nfc2);
  
  nfc3.begin();
  getFirmware(nfc3);
  
  Serial.println("All readers init");
}

void getFirmware(PN532 nfc){
  uint32_t versiondata = nfc.getFirmwareVersion();
  if (! versiondata) {
    Serial.print("Didn't find PN53x board");
    while (1); // halt
  }
  // Got ok data, print it out!
  Serial.print("Found chip PN5"); Serial.println((versiondata>>24) & 0xFF, HEX); 
  Serial.print("Firmware ver. "); Serial.print((versiondata>>16) & 0xFF, DEC); 
  Serial.print('.'); Serial.println((versiondata>>8) & 0xFF, DEC);
  
  // configure board to read RFID tags
  nfc.SAMConfig();
}


void loop(void) {
  if(millis()>readTime1+timeOut){
    if(readTag(nfc1, 0))
    {
      readTime1 = millis();
    }
  }
  if(millis()>readTime2+timeOut){
    if(readTag(nfc2, 1))
    {
      readTime2 = millis();
    }
  }
  if(millis()>readTime3+timeOut){
    if(readTag(nfc3, 2))
    {
      readTime3 = millis();
    }
  }
  //updateWriteChar();
}

void updateWriteChar(){
  while ( Serial.available() ){
     char newChar = Serial.read();
     if( newChar > 60 && newChar < 90 ){
      Serial.print("new character:");
      Serial.println(newChar);
      curChar = newChar;
     }
  }
}

bool readTag(PN532 nfc, int index)
{
  uint8_t success;
  uint8_t uid[] = { 0, 0, 0, 0, 0, 0, 0 };  // Buffer to store the returned UID
  uint8_t uidLength;                        // Length of the UID (4 or 7 bytes depending on ISO14443A card type)
    
  // Wait for an ISO14443A type cards (Mifare, etc.).  When one is found
  // 'uid' will be populated with the UID, and uidLength will indicate
  // if the uid is 4 bytes (Mifare Classic) or 7 bytes (Mifare Ultralight)
  
//  unsigned long startReadTime = millis();
  success = nfc.readPassiveTargetID(PN532_MIFARE_ISO14443A, uid, &uidLength, 30);
//  Serial.print("read duration: ");
//  Serial.println(millis()-startReadTime);
  
  if (success) {
    // Display some basic information about the card
//    Serial.print("Found an ISO14443A card at: ");
//    Serial.println(millis());
//    Serial.print("  UID Length: ");Serial.print(uidLength, DEC);Serial.println(" bytes");
//    Serial.print("  UID Value: ");
//    nfc1.PrintHex(uid, uidLength);
//    Serial.println("");
    
    if (uidLength == 4)
    {
      // We probably have a Mifare Classic card ... 
      //Serial.println("Seems to be a Mifare Classic card (4 byte UID)");
    
      // Now we need to try to authenticate it for read/write access
      // Try with the factory default KeyA: 0xFF 0xFF 0xFF 0xFF 0xFF 0xFF
      //Serial.println("Trying to authenticate block 4 with default KEYA value");
      uint8_t keya[6] = { 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF };
    
    // Start with block 4 (the first block of sector 1) since sector 0
    // contains the manufacturer data and it's probably better just
    // to leave it alone unless you know what you're doing
      success = nfc.mifareclassic_AuthenticateBlock(uid, uidLength, 4, 0, keya);
    
      if (success)
      {
        //Serial.println("Sector 1 (Blocks 4..7) has been authenticated");
        uint8_t data[16];
        // If you want to write something to block 4 to test with, uncomment
    // the following line and this text should be read back in a minute
         //data = { 'A', 'd', 'a', 'f', 'r', 'u', 'i', 't', '.', 'c', 'o', 'm', 0, 0, 0, 0};
         
         
//         data[0] = curChar;
//         Serial.print("Try to write :");
//         Serial.print(curChar);
//         Serial.print(" ...");
//         success = nfc.mifareclassic_WriteDataBlock (4, data);
//          if( success ){
//            Serial.print(" success!");
//          } else {
//            Serial.print(" fail!");
//          }
        // Try to read the contents of block 4
        success = nfc.mifareclassic_ReadDataBlock(4, data);
    
        if (success)
        {
          // Data seems to have been read ... spit it out
          //Serial.println("Reading Block 4:");
          //nfc.PrintHexChar(data, 16);

          Serial.print(STX);
          Serial.print(0);//preceed with a 0, indicating it is an NFC read
          Serial.print(',');
          Serial.print(index);
          Serial.print(',');
          
          Serial.print(data[0]);
          
          Serial.println(ETX);
      
          // Wait a bit before reading the card again
          delay(10);
        }
        else
        {
         //Serial.println("Ooops ... unable to read the requested block.  Try another key?");
        }
      }
      else
      {
//        Serial.println("Ooops ... authentication failed: Try another key?");
      }
    }
//    Serial.print("Done at: ");
//    Serial.println(millis());
    if (uidLength == 7)
    {
      // We probably have a Mifare Ultralight card ...
      Serial.println("Seems to be a Mifare Ultralight tag (7 byte UID)");
    
      // Try to read the first general-purpose user page (#4)
      Serial.println("Reading page 4");
      uint8_t data[32];
      success = nfc.mifareultralight_ReadPage (4, data);
      if (success)
      {
        // Data seems to have been read ... spit it out
        nfc.PrintHexChar(data, 4);
        Serial.println("");
    
        // Wait a bit before reading the card again
        delay(10);
      }
      else
      {
        Serial.println("Ooops ... unable to read the requested page!?");
      }
    }
    return true;
  }
   return false;
}
