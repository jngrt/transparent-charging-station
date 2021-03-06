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
const {ipcRenderer} = require('electron');

// const [ABSOLUTE_PRIORITY, MEDIUM_PRIORITY, NO_PRIORITY, GREEN_PRIORITY] = [1, 2, 3, 4];

const [NORMAL,REPLAY] = _.times(2,n=>n);
let appState = NORMAL;

const greenThreshold = 6; //6 gray energy, 6 green energy

const tickDuration = 10000;	
let timer;
let lightsTimer;



const [P_LOW, P_NORMAL, P_HIGH, P_TOP] = [1, 50, 200, 4000];

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

const VISIBLE_CARD = '90';
const PLAY_CARD = '89';
const RESET_CARD = '88';

const linesPerHour = 8;

function timestampToHour(timestamp){


	var hour = (Math.floor(timestamp/8)+12)%24;
	var min = Math.round(Math.abs((timestamp%8)*(60/linesPerHour)));

	hour = (hour < 10) ? "0"+hour : hour;
	min = (min < 10) ? "0"+min : min;

	return hour +":"+min;

}


jQuery(document).ready(function ($) {

	/*
	ARDUINO
	*/

	ArduinoManager.init();


	ipcRenderer.on('app-quit', function () {
			console.log('on quit');
			let leds = new Array(36).fill(0);
			ArduinoManager.setLights(leds);
	});

	ArduinoManager.setReadersCallback( (reader, value) => {

		if( value == RESET_CARD ) {
			let leds = new Array(36).fill(0);
			ArduinoManager.setLights(leds);
			window.location.reload();
		} else if( value == PLAY_CARD ) {
			toggleTimer();
		} else if ( value == VISIBLE_CARD ) {
			leBigReveal();
		} else if(appState == NORMAL){
			tetris.updateCard(reader, value);
		} else if(appState == REPLAY && replay) {
			replay.checkIn();
		}

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
	RECORDERS
	*/
	var recorders = _.times(3, function(i){
		var recorder = new Recorder(i);
		return recorder;
	});	

	

	/*
	SWARM
	*/
	swarm = new NewSwarm("#tetris_ui", true);
	


	/*
	UPDATE VISUALIZATIONS
	*/

	var justDidTimeUpdate = false;
	var resumeTetrisTimeout = void(0);
	var revealSwarmTimeout = void(0);
	var hideSwarmAgainTimeout = void(0);
	var readyToShowSwarm = true;

	var update = function(){

		console.log("\n\n\n-------------- CYCLE --------------");
		
		if(appState == REPLAY) return;
		
		swarm.update(tetris.getCurrentGrid());
		_.invoke(controlPanels, "update", tetris.claims);

		/*
			Here we would need to detect the a line clear or the result of a parameter update

		*/

		// if(justDidTimeUpdate == true){
		// 	console.log(">> app.js: update result of time update");

		// } else {
		// 	console.log(">> app.js: update result of parameter update");
		// }

		// justDidTimeUpdate = false;
	}

	tetris.onUpdate(update);
	
	tetris.onPlugin(function(_claimer){
		console.log(">> app.js : onPlugin event at socket "+_claimer)
		recorders[_claimer].clearTrack();
		recorders[_claimer].startRecording();
	});
	
	tetris.onUnplug(function(_claimer, _replayLines){
		console.log(">> app.js : unPlug event at socket "+_claimer)
		recorders[_claimer].stopRecording();
		doReplay(_claimer, _replayLines);
	});

	function updateTime(){
		console.log("\n\n\n-------------- update time, state: ", appState);

		justDidTimeUpdate = true;

		_.each(recorders, function(recorder, i){
			if(recorder.isRecording()) recorder.record(tetris.getCurrentGrid());
		});
		_.each(controlPanels, function(cp){
			cp.bleep(tetris.getLastLine());
		})

		//make those lights do cool stuff.
		updatePlugLights( tetris.getLastLine(), tetris.getCurrentChargers() );


		var curTime = tetris.increaseTime();
		$('.time-display').html( curTime );
		$('#clock').html( timestampToHour(curTime) );


	}
	var leBigReveal = function(){
		swarm.toggle();
		_.invoke(controlPanels, "togglePersonalInfo");
	}



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

		tetris.updateClaimDebugForm(+data.claimer, !!data.pluggedIn, +data.card, +data.chargeNeeded, +data.deadline);
	}

	/*
	PLUG LEDS
	*/
	function updatePlugLights( line, currentChargers ) {

		let leds = new Array(36).fill(0);


		console.log('updatePlugLights ', line, currentChargers);
		if(!line || !line.claims || !line.claims.length ){
			ArduinoManager.setLights(leds);
			return; // console.log('no claims');
		}

		_.each(line.claims, c => {

			if( currentChargers[c.claimer] && c.pixels && c.pixels > 0 ) {
				let cIndex = c.claimer * 12;
				leds.fill(c.claimer + 1, cIndex, cIndex + c.pixels);
			}
		});

		console.log(leds);
		
		if(lightsTimer)
			clearTimeout(lightsTimer);

		lightsTimer = setTimeout(function(){
			ArduinoManager.setLights(leds);
		},500)
	}
	function clearLights() {
		if(lightsTimer)
			clearTimeout(lightsTimer);

		let leds = new Array(36).fill(0);
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
		clearLights();


		var onKillCallback = function(claimer){

			console.warn("onKillCallback called");
			appState = NORMAL;

			startTimer();
			update();

			if(claimer) 
				recorders[claimer].clearTrack();

			if(replay)
				replay = void(0);
		}

		replay = new Replay(claimer, recorders[claimer], "#replay_tetris_ui", "#ui", onKillCallback);
		// replay = new Replay(claimer, lines, "#replay_tetris_ui", "#ui", onKillCallback);
		
		replay.init();
		swarm.reset();	
		
	}

	/*
	TIMER RELATED THINGS
	*/

	startTimer();

	

	function stopTimer(){
		if( timer ) {
			$("#clock").css("background-color","black").css("border-color","black");
			console.log("timer stopped");
			window.clearInterval(timer);
			timer = void(0);	
		}
	}
	function startTimer(){
		console.log("triggered timer start", timer);
		if(timer) return;
		$("#clock").css("background-color","green").css("border-color","green");
		timer = window.setInterval(updateTime, tickDuration);
	}
	function toggleTimer(){
		if( timer ) stopTimer();
		else startTimer();
	}

	$('.toggle-timer').click( toggleTimer );

	/*
	DEBUG RELATED THINGS
	 */

	$(".debug-ui").hide();
	var left = 0;

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
			toggleTimer();
		};
		if(event.charCode == 111){
			console.log("nudge left",left);
			left--;
			$("#tetris_ui").css("transform","translateX("+left+"px)");
			$("#replay_tetris_ui").css("transform","translateX("+left+"px)");
		};
		if(event.charCode == 112){
			console.log("nudge right",left);
			left++;
			$("#tetris_ui").css("transform","translateX("+left+"px)");
			$("#replay_tetris_ui").css("transform","translateX("+left+"px)");
		};
		// "i" toggles swarm
		if(event.charCode == 105){
			leBigReveal();
		};
	});
	
});


