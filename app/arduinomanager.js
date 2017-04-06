const SerialPort = require('serialport');
const [READERS,ENCODERS,PLUGS] = ['readers','encoders','plugs'];
const devices = [{
	type: READERS,
	pnpId: 'usb-Arduino__www.arduino.cc__0042_553323332303511042B1-if00'
},
{
	type: ENCODERS,
	pnpId:'usb-Arduino__www.arduino.cc__0043_754333137393517080F1-if00'
},
{
	type: PLUGS,
	pnpId:'usb-Arduino__www.arduino.cc__0043_7533131303335110F0E1-if00'
	//pnpId:"usb-Arduino_Srl_Arduino_Uno_754333035313513160D1-if00"
}];

let readersCallback;
let encodersCallback;
let plugsCallback;

exports.init = function(){
	SerialPort.list( (err, ports) => {
		_.each(ports, port => {
			console.log(port);
			if( port.pnpId === void 0 )
				return;
			let dev = _.find(devices, dev => dev.pnpId === port.pnpId );
			if( dev ) {
				console.log( 'Found device ', dev, port );
				startListening( dev, port );
			}
			

		});
	});
}
exports.setReadersCallback = function( cb ){
	readersCallback = cb;
}
exports.setEncodersCallback = function( cb ){
	encodersCallback = cb;
}
exports.setPlugsCallback = function( cb ) {
	encodersCallback = cb;
}


function startListening( dev, port ) {
	
	dev.port = new SerialPort(port.comName, { baudRate: 115200});
	
	dev.port.on('error', err => console.log('Error: ', err.message));
	let fn = {readers:readersData, encoders:encodersData, plugs: plugsData}[dev.type];
	dev.port.on('data', fn);

	if( dev.type === PLUGS ) {
		dev.port.on('open', function() {
			console.log('on open');
			dev.port.write('111', function(err) {
				if (err) {
					return console.log('Error on write: ', err.message);
				}
				console.log('message written');
			});
			window.plugs = dev.port;
		});
	}
	
}

function readersData( data ) {
	console.log(data.toString('utf8'))
	
	if( data.length !== 4 ) return;
	
	let dataStr = data.toString('utf8');
	let plug = +dataStr.substr(1,1);
	let card = +dataStr.substr(2,2);
	if( readersCallback )
		readersCallback({claimer: plug, card: card});
}

function encodersData( data ) {
	let dataStr = data.toString('utf8');
	console.log(dataStr);
	let split = dataStr.split(',');

	//data should be 3 comma separated vals
	//data should be formatted as 1,1,1 or 1,1,255
	//otherise ignore data
	if( split.length !== 3 )
		return;
	
	//encoder value should be either 1 or 255
	let val = +split[2];
	if( val !== 1 || val !== 255 )
		return;
	
	let encoder = +dataStr.substr(2,1);
	let claimer = ~~(encoder / 2);
	

}
function plugsData( data ) {
	console.log('plugsData');
	console.log(data);
	console.log(data.toString('utf8'));

}

