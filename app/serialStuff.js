
var SerialPort = require('serialport');
var port = new SerialPort('/dev/pts/6');

port.on('open', function() {
  port.write('Charge station says hi', function(err) {
    if (err) {
      return console.log('Error on write: ', err.message);
    }
    console.log('message written');
  });
});

// open errors will be emitted as an error event
port.on('error', function(err) {
  console.log('Error: ', err.message);
})
