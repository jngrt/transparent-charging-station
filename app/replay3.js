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
		console.log(">> replay3: this.kill");
		if(killCalled) return;
		console.log(">> replay3: this.kill: GO!");

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
		console.log("render checked");
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
		data.msg_intro = "intro";
		data.msg_replay = "replay";
		data.msg_outro = "outro";
		render();

		clearTimeout(progressTimeout);
		progressTimeout = void(0);

		if(currentState == 0){
			
			index = 0;
			data.msg_intro = "Do you want to see the replay? "+countdown;

			replaySwarm.update(track[index]);
			countdown--;

			if(countdown <= 0) _this.kill();

			render();

			progressTimeout = setTimeout(update,1000);

		} else if(currentState == 1) {
			currentState = 1;
			countdown = 10;
			data.msg_replay = " ••• ";

			if (!track[index]){
				data.msg_replay = "Unplugged car...";
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

			render();

			setTimeout(update, updateInterval);

		} else {
			
			index = 0;
			data.msg_outro = "Done! "+countdown;
			
			
			replaySwarm.update(track[track.length-1]);
			countdown--;

			if(countdown <= 0) _this.kill();

			render();

			progressTimeout = setTimeout(update,1000);


		}
		
		stateChange();	
		lastState = currentState;

	}
	this.init = function(){
		track = myRecorder.getTrack();
		console.log(">> replay 3: init replay",track);
		createEl();
		createReplaySwarm();
		update();
		
	}
}