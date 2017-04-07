const SerialPort = require('serialport');
const [READERS,ENCODERS,PLUGS] = [0,1,2];
const callbacks = [];

const STX = '\2';
const ETX = '\3';

exports.init = function(){
	SerialPort.list( (err, ports) => {
		_.each(ports, port => {
			//console.log(port);
			if( port.manufacturer && ~port.manufacturer.indexOf('Arduino')){
				startListening(port);
			}
		});
	});
}
exports.setReadersCallback = function( cb ){
	callbacks[READERS] = cb;
}
exports.setEncodersCallback = function( cb ){
	callbacks[ENCODERS] = cb;
}
exports.setPlugsCallback = function( cb ) {
	callbacks[PLUGS] = cb;
}


function startListening( portInfo ) {
	
	let sp = new SerialPort(portInfo.comName, { baudRate: 115200});
	sp.on('error', err => console.log('Error: ', err.message));
	//let fn = {readers:readersData, encoders:encodersData, plugs: plugsData}[dev.type];
	
	let buffer = '';
	
	sp.on('data', (data) => {
	
		buffer += data.toString('utf8');

		//console.log(buffer);

		while( ~buffer.indexOf(STX) && ~buffer.indexOf(ETX)){
	
			let stxi = buffer.indexOf(STX);

			//Remove any chars before STX
			if( stxi > 0 ) {
				buffer = buffer.substr(stxi)
				stxi = 0;
			}

			let etxi = buffer.indexOf(ETX);
			if( !~etxi )
				return;
				
			let msg = buffer.substring(stxi+1,etxi);
			buffer = buffer.substr(etxi+1);
			let split = msg.split(',');
			
			if( split.length !== 3 )
				return;
		
			let devType = +split[0];
			let plug = +split[1];
			let value = +split[2];
			
			if( callbacks[devType] ) {
				callbacks[devType](plug, value);
			}
		}
	});
}
