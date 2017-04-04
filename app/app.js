/*
TODO: 
- Add tetris.getHistoryForClaimer function
- Add timer class which calls tetris.increaseTime
- Add playback functionality (get array of history from Tetris, and replay this)
- Add application states and transitions
*/
const _ 	 = require('underscore')
const jQuery = require('jquery')
const $ 	 = jQuery;
const SerialPort = require('serialport');

// const [ABSOLUTE_PRIORITY, MEDIUM_PRIORITY, NO_PRIORITY, GREEN_PRIORITY] = [1, 2, 3, 4];

jQuery(document).ready(function ($) {

	const tetris = new Tetris();
	
	//for debug
	document.tetris = tetris;

	swarm = new Swarm();
	tetris.onUpdate(() => swarm.update( tetris.getCurrentGrid() ));

	SerialPort.list(function (err, ports) {
	  ports.forEach(function(port) {
	    console.log(port.comName);
	    console.log(port.pnpId);
	    console.log(port.manufacturer);

		port.on('open', function() {
		  port.write('Charge station says hi', function(err) {
		    if (err) {
		      return console.log('Error on write: ', err.message);
		    }
		    console.log('message written');
		  });
		});

		port.on('data', function (data) {
		  console.log('Data: ' + data);
		});

		// open errors will be emitted as an error event
		port.on('error', function(err) {
		  console.log('Error: ', err.message);
		})


	  });
	});


	$('form.addClaims :input').on('input', function (evt) {
		var form = $(evt.target).parents("form");
		getDataFromForm(form, tetris);
		evt.preventDefault();
	})
	$("form").each(function(index){
		getDataFromForm($(this), tetris);
	});
});

function getDataFromForm(form, tetris){
	let data = form.serializeArray().reduce(function (obj, item) {
		obj[item.name] = item.value;
		return obj;
	}, {});

	tetris.addClaim(+data.claimer, +data.priority, +data.chargeNeeded, +data.deadline);
}
