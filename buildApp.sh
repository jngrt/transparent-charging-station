#!/bin/sh
echo 'Building new version...'
NOW=$(date +"%m-%d-%Y_%H-%M-%S")
mkdir ./builds/$NOW
electron-packager ./ChargingStationCode ChargingStation --overwrite --platform=darwin --arch=x64 --out ./builds/$NOW
CURDIR=$(pwd)
ln -s "$CURDIR/builds/$NOW/ChargingStation-darwin-x64/ChargingStation.app" /Applications/ChargingStation.app
