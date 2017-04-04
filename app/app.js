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

const [NORMAL,REPLAY] = _.times(2,n=>n);
let appState = NORMAL;

const greenThreshold = 6; //6 gray energy, 6 green energy

jQuery(document).ready(function ($) {

	const tetris = new Tetris();
	
	//for debug
	document.tetris = tetris;

	swarm = new Swarm();
	tetris.onUpdate(() => swarm.update( tetris.getCurrentGrid() ));
	tetris.onUnplug(() => {


	});

	SerialPort.list(function (err, ports) {
	  ports.forEach(function(port) {
	    console.log(port.comName);
	    console.log(port.pnpId);
	    console.log(port.manufacturer);

		// port.on('open', function() {
		//   port.write('Charge station says hi', function(err) {
		//     if (err) {
		//       return console.log('Error on write: ', err.message);
		//     }
		//     console.log('message written');
		//   });
		// });

		// port.on('data', function (data) {
		//   console.log('Data: ' + data);
		// });

		// // open errors will be emitted as an error event
		// port.on('error', function(err) {
		//   console.log('Error: ', err.message);
		// })


	  });
	});

	$('form.addClaims input:checkbox').change( function(evt){
		let form = $(evt.target).parents("form");
		getDataFromForm(form, tetris);
		evt.preventDefault();
	});
	$('form.addClaims :input').on('input', function (evt) {
		let form = $(evt.target).parents("form");
		getDataFromForm(form, tetris);
		evt.preventDefault();
	})
	$("form").each(function(index){
		getDataFromForm($(this), tetris);
	});

	/*
	PLAYBACK HISTORY
	*/
	function doReplay(){
		appState = REPLAY;
		stopTimer();
		//TODO: get the one who plugged out, do replay
		let history = tetris.getHistoryGrid();

	}


	/*
	TIMER RELATED THINGS
	 */
	let timer;
	
	$('.toggle-timer').click( e => {
		if(timer) {
			window.clearInterval(timer);
			timer = null;
		} else {
			startTimer();
		}
		

	});
	function stopTimer(){
		window.clearInterval(timer);
	}
	function startTimer(){
		timer = window.setInterval(updateTime,500);
	}
	function updateTime(){
		$('.time-display').html( tetris.increaseTime() );
	}
	
});

function getDataFromForm(form, tetris){
	let data = form.serializeArray().reduce(function (obj, item) {
		obj[item.name] = item.value;
		return obj;
	}, {});

	tetris.updateClaim(+data.claimer, !!data.pluggedIn, +data.priority, +data.chargeNeeded, +data.deadline);
}
