#include "Adafruit_WS2801.h"
#include "SPI.h" // Comment out this line if using Trinket or Gemma

uint8_t dataPin  = 5;    // Yellow wire on Adafruit Pixels
uint8_t clockPin = 6;    // Green wire on Adafruit Pixels


Adafruit_WS2801 strip = Adafruit_WS2801(36, dataPin, clockPin);

uint8_t pixels[36];
uint32_t off;
uint32_t red;
uint32_t green;
uint32_t blue;
uint32_t negative;

//int pin1 = 3;
//int pin2 = 2;
//int pin3 = 1;
int pinNums[3] = {4,3,2};
int oldPinVals[3] = {0,0,0};


void setup() {

  off = Color(0, 0, 0);
  red = Color(255, 0, 0);
  green = Color(0, 0, 255);
  blue = Color(0, 255, 0);
  negative = Color(200, 200, 155);

  pinMode(pinNums[0], INPUT_PULLUP);
  pinMode(pinNums[1], INPUT_PULLUP);
  pinMode(pinNums[2], INPUT_PULLUP);
  
  
  Serial.begin(115200);
  
  strip.begin();

  // Update LED contents, to start they are all 'off'
  strip.show();
}


void loop() {


  updateConnectors();
  updatePixels();
  chargeCycle();
}

////////////////

void updateConnectors()
{
  for(int i = 0; i<3;i++){
    int pinRead = digitalRead(pinNums[i]);
    if(pinRead != oldPinVals[i]){
      if(pinRead == LOW){
        printToSerial(2, i, 1);//mode is connector: 2, index, 1 for HIGH
        flashDots(i);

      }else{
        printToSerial(2, i, 0);
        unplug(i);
      }
      oldPinVals[i] = pinRead;
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

void updatePixels(){
  int i = 0;
  while (Serial.available() > 0){
     pixels[i] = Serial.read();
     //Serial.print(pixels[i]);
     i++;
  }
}

void chargeCycle(){
  
  for(int i=0; i<36; i++){

    if(pixels[i]==49){      
      strip.setPixelColor(i, negative);
      //Serial.print("negative");
    }
    if(pixels[i]==50){      
      strip.setPixelColor(i, red);
      //Serial.print("red");
    }
    if(pixels[i]==51){      
      strip.setPixelColor(i, green);
      //Serial.print("green");
    }
    if(pixels[i]==52){      
      strip.setPixelColor(i, blue);
      //Serial.print("blue");
    }
    if(pixels[i]==48){      
      strip.setPixelColor(i, off);
    }  
    strip.show();
  }
  
}

//flash leds at respective socket
void flashDots(int socket){

  //reset socket color and check which socket to flash
  uint32_t socketColor;
  int startIndex;
  
  if(socket==0){
    socketColor=red;
    startIndex=0;
            //Serial.println("flashing red");
  }
  if(socket==1){
    socketColor=green;
    startIndex=12;
            //Serial.println("flashing green");
  }
  if(socket==2){
    socketColor=blue;
    startIndex=24;
            //Serial.println("flashing blue");
  }

  for(int i=0; i<3; i++){
    for (int i=12*socket; i<12*socket+12; i++){
      strip.setPixelColor(i, socketColor);
      strip.show(); 
    }
    delay(500);
    for (int i=12*socket; i<12*socket+12; i++){
      strip.setPixelColor(i, off);
      strip.show(); 
    }      
    delay(500);     
  }

}

// replace with NODE code
void unplug(int socket){
  //tell node to stop charging

  //turn off leds at respective socket
  if(socket==0){
    for (int i=0; i<12; i++){
      pixels[i]=48; 
    }
   Serial.println("unplug red");
  }
  
  if(socket==1){
    for (int i=12; i<24; i++){
      pixels[i]=48;
    }
   Serial.println("unplug green");    
  }
  
  if(socket==2){
    for (int i=24; i<36; i++){
      pixels[i]=48;
    }
   Serial.println("unplug blue");    
  }  
}



/* Helper functions */

// Create a 24 bit color value from R,G,B
uint32_t Color(byte r, byte g, byte b)
{
  uint32_t c;
  c = r;
  c <<= 8;
  c |= g;
  c <<= 8;
  c |= b;
  return c;
}

