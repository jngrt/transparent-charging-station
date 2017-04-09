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
const tickDuration = 2000;

const [P_LOW, P_NORMAL, P_HIGH, P_TOP] = [1, 10, 100, 1000];

const cards = {
  	'65':{ name: 'Community Service', priority:P_HIGH, info:['High priority','Flexible deadline','Outside peak hours']},
  	'66':{ name: 'Optimus Platinum', priority:P_HIGH, info: ['High priority', 'Strict deadline', 'Unlimited use']},
  	'67':{ name: 'Ministry of Transport', priority:P_TOP, info:['Top priority', 'Strict deadline', 'Use with discretion']},
  	'68':{ name: 'A-Mart', priority: P_NORMAL, info:['Normal priority', 'Flexible deadline', '50% off at A-Mart charging stations']},
	'69':{ name: 'Medical Priority', priority: P_HIGH, info:['High priority', 'Strict deadline', 'Medical condition: Heavily pregnant']},
	'70':{ name: 'Probation I.D.', priority: P_LOW, info:['Low priority', 'Flexible deadline', 'Max 20 kWH per charge']},
	'71':{ name: 'Diplomat', priority: P_TOP, info:['Top priority', 'Strict deadline', 'Use with discretion']},
	'72':{ name: 'Chargecard', priority: P_NORMAL, info:['Normal priority', 'Flexible deadline']},
	'73':{ name: 'Hacker', priority: P_TOP, info:['Top priority', 'Strict deadline', 'Unlimited use']},
	'74':{ name: 'CarShare', priority: P_NORMAL, info:['Normal priority', 'Strict deadline', 'Only at home address']},
	'75':{ name: 'DiscountCharge', priority: P_LOW, info:['Low priority', 'Flexible deadline', 'Fixed price']},
	'76':{ name: 'Fire Department', priority: P_TOP, info:['Top priority', 'Strict deadline', 'Only at home address']},
	'77':{ name: 'Swiss Citizen Charging Plan', priority: P_LOW, info:['Low priority', 'Flexible deadline', 'Non-EU charging applies']},
	'78':{ name: 'Generic Motors', priority: P_HIGH, info:['High priority', 'Flexible deadline', 'Only for Generic Motor cars']},
	'79':{ name: 'Myface', priority: P_NORMAL, info:['Normal priority', 'Flexible deadline', '4 Free charges per month']},
	'80':{ name: 'Welfare Charge Program', priority: P_NORMAL, info:['Normal priority', 'Flexible deadline', 'Max 200 kWh per month']},
	'81':{ name: 'Medical Doctor', priority: P_TOP, info:['Top priority', 'Strict deadline', 'Use with discretion']},
	'82':{ name: 'Green Charge', priority: P_NORMAL, info:['Normal priority', 'Flexible deadline', 'Renewable energy only']},
	'83':{ name: 'Gift-A-Charge', priority: P_NORMAL, info:['Normal priority', 'Flexible deadline', 'Charge 100 kWh free']}
};

jQuery(document).ready(function ($) {

	/*
	ARDUINO
	*/

	ArduinoManager.init();
	ArduinoManager.setReadersCallback( (reader, value) => {
		if(appState == NORMAL) tetris.updateCard(reader, value);
		if(appState == REPLAY && replay) replay.checkIn();
	});
	ArduinoManager.setPlugsCallback( (plug, value) => {
		tetris.updatePlugs(plug, !!value);

	});
	ArduinoManager.setEncodersCallback( (encoder, value) => {
		tetris.updateParameters(encoder, value);
	});



	/*
	TETRIS
	*/
	const tetris = new Tetris( cards );
	
	//for debug
	document.tetris = tetris;

	

	/*
	CONTROL PANEL
	*/
	var controlPanels = _.times(3, function(i){
		var cp = new ControlPanel(i, "#socket-ui");
		cp.init();
		return cp;
	});

	

	/*
	SWARM
	*/
	swarm = new NewSwarm("#tetris_ui", true);
	


	/*
	UPDATE VISUALIZATIONS
	*/
	tetris.onUpdate(() => {
		
		if(appState == REPLAY) return;
		
		//update Swarm
		swarm.update(tetris.getCurrentGrid());

		//make those lights to cool stuff.
		updatePlugLights( tetris.getLastLine() );

		//make the controlpanels bleep
		_.each(controlPanels, function(cp){
			cp.bleep(tetris.getLastLine());
			cp.update( tetris.claims );
		})

	});
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
	


	/*
	PLUG LEDS
	*/
	function updatePlugLights( line ) {
		console.log('updatePlugLights ', line);
		if(!line || !line.claims || !line.claims.length )
			return console.log('no claims');

		let leds = new Array(36).fill(0);
		_.each(line.claims, c => {
			if( c.pixels && c.pixels > 0 ) {
				let cIndex = c.claimer * 12;
				leds.fill(c.claimer + 1, cIndex, cIndex + c.pixels);
			}
		});
		console.log(leds);
		ArduinoManager.setLights(leds);
	}



	/*
	PLAYBACK HISTORY
	*/
	var replay;
	function doReplay( claimer, lines ){

		if(replay) return //we check if there is a replay going on: then ignore

		//first we set the appstate to Replay.
		appState = REPLAY;
		stopTimer();

		var onKillCallback = function(){
			console.log("onKillCallback called");
			appState = NORMAL;

			startTimer();
			
			if(!replay) return;
			replay = void(0);
		}
		
		replay = new Replay(claimer, lines, "#replay_tetris_ui", "#ui", onKillCallback);
		replay.init();
		swarm.reset();	
		
	}

	/*
	TIMER RELATED THINGS
	 */
	let timer;
	startTimer();
	
	function stopTimer(){
		if( timer ) {
			console.log("timer stopped");
			window.clearInterval(timer);
			timer = void(0);	
		}
	}
	function startTimer(){
		console.log("triggered timer start", timer);
		if(timer) return;
		timer = window.setInterval(updateTime,tickDuration);
	}
	
	function updateTime(){
		$('.time-display').html( tetris.increaseTime() );
	}

	$('.toggle-timer').click( e => {
		if(timer) {
			window.clearInterval(timer);
			timer = null;
		} else {
			startTimer();
		}
	});

	/*
	DEBUG RELATED THINGS
	 */

	$(".debug-ui").hide();

	$(window).on('keypress', function(event) {
		console.log(event.charCode);
		if(event.charCode == 120){
			$(".debug-ui").toggle();
		};
		if([114,99].indexOf(event.charCode)>=0){
			console.log('triggered replay check-in', replay);
			if(replay) replay.checkIn();
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


