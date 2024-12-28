const int analogPin = A0; // Analog input pin that the sensor is attached to
const String startingChar = "S";
const String endingCar = "E";

void setup() {
  // Initialize serial communication at the defined baud rate
  Serial.begin(9600);

  // Configure the analog pin for input
  pinMode(analogPin, INPUT);
}

void loop() {
  int startedAt = micros();

  // Read the analog value
  int sensorValue = analogRead(analogPin);

  int endedAt = micros();
  int timeTook = endedAt - startedAt;

  // 125us = 8kHz sampling rate
  int timeRemaining = 125 - timeTook;

  Serial.print(startingChar);
  Serial.print(sensorValue);
  Serial.println(endingCar);
  if (timeRemaining > 0) {
    delayMicroseconds(timeRemaining);
  }
}
