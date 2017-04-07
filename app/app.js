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
const ArduinoManager = require('./arduinomanager')

// const [ABSOLUTE_PRIORITY, MEDIUM_PRIORITY, NO_PRIORITY, GREEN_PRIORITY] = [1, 2, 3, 4];

const [NORMAL,REPLAY] = _.times(2,n=>n);
let appState = NORMAL;

const greenThreshold = 6; //6 gray energy, 6 green energy
const tickDuration = 5000;

const cards = {
  '1':{ priority:1, name: 'DiscountCharge'},
  '2':{ priority:10, name: 'Gift-A-Charge' },
  '3':{ priority:50, name: 'Optimus Platinum'},
  '4':{ priority:1000, name: 'Medical Doctor'},
  '65':{ priority:1, name: 'DiscountCharge'},
  '66':{ priority:10, name: 'Gift-A-Charge' },
  '67':{ priority:50, name: 'Optimus Platinum'},
  '68':{ priority:1000, name: 'Medical Doctor'}
};

jQuery(document).ready(function ($) {

	ArduinoManager.init();
	ArduinoManager.setReadersCallback( onCardScan );
	ArduinoManager.setPlugsCallback( onPlug );
	ArduinoManager.setEncodersCallback( onEncoders );
	const tetris = new Tetris();
	
	//for debug
	document.tetris = tetris;

	/*
	VISUALIZATION
	*/
	swarm = new NewSwarm("#tetris_ui");
	tetris.onUpdate(() => swarm.update( tetris.getCurrentGrid() ));
	tetris.onUnplug( doReplay );

	/*
	INPUT
	*/
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
	function getDataFromForm(form, tetris){
		let data = form.serializeArray().reduce(function (obj, item) {
			obj[item.name] = item.value;
			return obj;
		}, {});

		tetris.updateClaim(+data.claimer, !!data.pluggedIn, +data.card, +data.chargeNeeded, +data.deadline);
	}

	function onCardScan( obj ) {
		tetris.updateCard( obj.claimer, obj.card );
	}
	function onPlug( obj ) {
		console.log( obj );
	}
	function onEncoders( obj ) {
		console.log(obj);
	}

	/*
	CONTROL PANEL
	*/
	var controlPanels = _.times(3, function(i){
		var cp = new ControlPanel(i, "#socket-ui");
		cp.init();
		tetris.onUpdate(() => cp.update( tetris.getCurrentGrid(), tetris.claims ));
		return cp;
	});





	/*
	PLAYBACK HISTORY
	*/
	function doReplay( claimer, lines ){
		
		appState = REPLAY;
		stopTimer();
		
		console.log(lines);
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
		console.log("timer stopped");
		window.clearInterval(timer);
	}
	function startTimer(){
		console.log("timer started");
		stopTimer();
		timer = window.setInterval(updateTime,tickDuration);
	}
	function updateTime(){
		$('.time-display').html( tetris.increaseTime() );
	}

	$(".debug-ui").hide();

	$(window).on('keypress', function(event) {
		// console.log(event.charCode);
		if(event.charCode == 120){
			$(".debug-ui").toggle();
		};
		if(event.charCode == 32){
			if(timer) {
				window.clearInterval(timer);
				timer = null;
			} else {
				startTimer();
			}
		};
	});
	
});


