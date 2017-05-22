#define TAG_READ 0
#define ENCODER_READ 1

#include <SoftwareSerial.h>

SoftwareSerial mySerial(18, 19); // RX, TX

int pin2Read;
int pin2Old = 0;
int pin3Read;

int oldPinAValues[6] = {1,1,1,1,1,1};
int oldPinBValues[6] = {1,1,1,1,1,1};

int encoderValues[6] = {0,0,0,0,0,0};

int results[6] = {0,0,0,0,0,0};

int encoderPins[6][2] = {
  {2,3},
  {4,5},
  {6,7},
  {8,9},
  {14,15},
  {16,17}
};

void setup() {
  // put your setup code here, to run once:
  pinMode(2, INPUT);
  pinMode(3, INPUT);
  pinMode(4, INPUT);
  pinMode(5, INPUT);
  pinMode(6, INPUT);
  pinMode(7, INPUT);
  pinMode(8, INPUT);
  pinMode(9, INPUT);
  pinMode(14, INPUT);
  pinMode(15, INPUT);
  pinMode(16, INPUT);
  pinMode(17, INPUT);
  
  Serial.begin(115200);
  //Serial.println("start");

  mySerial.begin(115200);
  

}

void loop() {

  //Serial.println("loop");
  //updateNFC();
  updateEncoders();
    

}
void updateNFC(){
  while(mySerial.available()>0) {
    mySerial.read(); //disregard the mode byte, we know it is an NFC
    int index = mySerial.read()-48;
    mySerial.read(); //somehow there is a byte in between we don't need
    printToSerial(TAG_READ, index, mySerial.read()+12);
    //Serial.write(mySerial.read());
  }
}

void updateEncoders(){
  //Serial.println("read");
  for(int i=0; i<6; i++){//read encoders
    results[i]= readEncoder(encoderPins[i][0],encoderPins[i][1],i);
  }
  
  for(int i=0; i<6; i++){//print to serial if nonzero
    if(results[i] != 0){
      printToSerial(ENCODER_READ, i, results[i]);
    }
  }
}

void printToSerial(int mode, int index, byte val){
  Serial.print(mode);
  Serial.print(",");
  Serial.print(index);
  Serial.print(",");
  Serial.println(val);
  
}

int readEncoder(int pinA, int pinB, int encoderIndex)
{
    
    //delayMicroseconds(500);
    int pinARead = digitalRead(pinA);
    int pinBRead = digitalRead(pinB);
    int encoderReturn = 0;
    
//  Serial.print(pinARead);
//  Serial.print(" ");
//  Serial.println(pinBRead);
//  Serial.print(" old A: ");
//  Serial.println(oldPinAValues[encoderIndex]);
  
  if(oldPinAValues[encoderIndex] != pinARead){

    
    if(pinARead > oldPinAValues[encoderIndex]){
//      Serial.print("rising ");
      if(digitalRead(pinB) == HIGH){
//        Serial.println("CW");
        delay(20);
        encoderReturn =1;
      }else{
//         Serial.println("CCW");
         delay(20);
         encoderReturn =-1;
       }
     }else if (pinARead < oldPinAValues[encoderIndex]){
//      Serial.print("falling ");
      if(digitalRead(pinB) == HIGH){
//        Serial.println("CCW");
        delay(20);
        encoderReturn =-1;
      }else{
//        Serial.println("CW");
        delay(20);
        encoderReturn = 1;
      }
     }

   oldPinAValues[encoderIndex] = pinARead; 
   return encoderReturn;
  } else{
    return 0;
  }
  
  
}
