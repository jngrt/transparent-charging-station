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

jQuery(document).ready(function ($) {

	ArduinoManager.init();
	ArduinoManager.setReadersCallback( onCardScan );
	const tetris = new Tetris();
	
	//for debug
	document.tetris = tetris;

	swarm = new NewSwarm("#tetris_ui");
	tetris.onUpdate(() => swarm.update( tetris.getCurrentGrid() ));
	tetris.onUnplug( doReplay );

	

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
		//tetris.updateClaim( obj.claimer,  )
	}

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
		window.clearInterval(timer);
	}
	function startTimer(){
		timer = window.setInterval(updateTime,500);
	}
	function updateTime(){
		$('.time-display').html( tetris.increaseTime() );
	}
	$(window).on('keypress', function(event) {
		if(event.charCode == 120){
			$(".debug-ui").toggle();
		};
	});
	
});


