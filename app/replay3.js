/*
	what does this do?
	
	gets thrown some lines.
	--> PAUSE TIMER
	- replaySwarm --> hide
	- first show the UI steps
		- Did you get charge you want? Make a recording...
			- Countdown 5-4-3-2-1
	- replay
		internal timer, internal replaySwarm
	- Want to see it again?
		- tap again
	- Have a nice day, stop
	--> 
*/
var Replay = function(_claimer, _myRecorder, _replaySwarmParent, _replayParent, _killCallback){
	
	var myRecorder = _myRecorder;
	var claimer = _claimer;


	var killCallback = _killCallback;
	var replaySwarmParent = _replaySwarmParent;
	var replayParent = _replayParent;
	var _this = this;

	var updateInterval = 1500;

	var killTimer;
	var killCalled = false;

	var hideState = {"top":$(replayParent).height()};
	var showState = {"top":$(replayParent).height()-270}

	var onCheckInCallback = null;

	var currentState = 0;
	var lastState = -1;
	var progressTimeout = 0;
	var countdown = 10;


	_.templateSettings.variable = "rc";

	var uiTemplate = $("#ui-replay-template").html();

	var el;
	var data = {};
	var replaySwarm;
	var index = 0;
	var track = [];

	this.checkIn = function(){
		console.log(">> replay 3: replay checked in!");

		if(currentState != 1){
			index = 0;
			currentState = 1;
			update();
		}		
	}

	this.kill = function(_forceKillCallback){
		if(killCalled) return;
		killCalled = true;
		clearTimeout(killTimer);
		clearTimeout(progressTimeout);
		hideEl(_forceKillCallback);
		if(typeof killCallback == 'function') killCallback();
	}
	var createEl = function(){
		el = $("<div id='replay-ui'></div>").css(hideState).appendTo(replayParent);
		el.addClass("replay-ui-"+claimer);
		setTimeout(function(){el.css(showState);},100);
	}
	var hideEl = function(callback){
		replaySwarm.reset();
		el.css(hideState).one("transitionend",function(){
			if(typeof callback == "function") callback();
			$(replayParent).empty();
			$(replaySwarmParent).empty();
			el.remove();
		});
	}
	var render = function(){
		var tmp = _.template(uiTemplate);
		el.html(tmp(data));	
	}
	var hideStates = function(){
		el.children('.state').hide();		
	}
	var stateChange = function(){
		if(currentState != lastState){
			//elegant transition
			el.children('.state').fadeOut();
			el.children('.state'+currentState).fadeIn();
			lastState = currentState;
			return;
		};
		//cut to state
		el.children('.state'+currentState).show();
	}
	var createReplaySwarm = function(){
		replaySwarm = new NewSwarm(replaySwarmParent, false);
	}

	var update = function(){
		
		data.claimer = claimer;
		
		clearTimeout(progressTimeout);
		progressTimeout = void(0);

		if(currentState == 0){
			index = 0;
			data.msg_intro = "Do you want to see the replay? "+countdown;
			progressTimeout = setTimeout(update,1000);
			if(countdown <= 0) _this.kill();
			replaySwarm.update(track[index]);
			countdown--;
		} else if(currentState == 1) {
			currentState = 1;
			countdown = 10;
			data.msg_replay = " ••• ";

			if (!track[index]){
				console.log(">> replay: next track is dead == 0 ")
				currentState = 2;
			} else {
				var lines = track[index];

				if(lines.length <= 0){
					console.log(">> replay: lines.length == 0 ")
					currentState = 2; 
				} else {
					//get all messages from lines[0].
					var msgs = [];
					_.each(lines[0].claims,function(claim, i){
						if(claim.message) msgs.push(i + ": "+ claim.message);
					})
					data.msg_replay = msgs.join("<br>");
					console.log("about to send this set of lines",lines);
					replaySwarm.update(lines);
				}
			}
			index++;
						
			setTimeout(update, updateInterval);
		} else {
			console.log(">> replay OUTROOOO");
			index = 0;
			data.msg_intro = "Done! "+countdown;
			progressTimeout = setTimeout(update,1000);
			if(countdown <= 0) _this.kill();
			replaySwarm.update(track[track.length-1]);
			countdown--;
		}
		
		stateChange();		
		render();
		lastState = currentState;

	}
	this.init = function(){
		console.log(">> replay 3: init replay");
		track = myRecorder.track;
		createEl();
		createReplaySwarm();
		update();
	}
}