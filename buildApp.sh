#!/bin/sh
git pull
echo 'Building new version...'
NOW=$(date +"%m-%d-%Y_%H-%M-%S")
mkdir ./builds/$NOW
electron-packager ./ ChargingStation --overwrite --platform=darwin --arch=x64 --out ./builds/$NOW
CURDIR=$(pwd)
rm /Applications/ChargingStation.app
ln -s "$CURDIR/builds/$NOW/ChargingStation-darwin-x64/ChargingStation.app" /Applications/ChargingStation.app
