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
var Replay = function(_claimer, _recorder, _replaySwarmParent, _replayParent, _killCallback){
	
	var claimer = _claimer;
	// var lines = _lines;

	var recorder = _recorder;


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

	this.checkIn = function(){
		console.log(">> replay2: replay checked in!");

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

		if(currentState == 0){
			index = 0;
			data.msg_intro = "Do you want to see "+countdown;
			progressTimeout = setTimeout(update,1000);
			if(countdown <= 0) _this.kill();
			replaySwarm.update(recorder.getLines(index));
			countdown--;
		} else if(currentState == 1) {

			data.msg_replay = "";

			var lines = recorder.getLines(index);

			if((lines.length -1) >= index){

				currentState = 1;
				var msgs = [];

				if(!lines[index]){
					alert("an incorrect line was addressed");
					currentState = 2;
					setTimeout(update,4000);
					return;
				}
				if(lines[index].claims.length > 0){
					console.log(">> replay2: finding messages for this line");
					_.each(lines[index].claims,function(claim, i){
						if(claim.message) msgs.push(i + ": "+ claim.message);
					})
					data.msg_replay = msgs.join("<br>");
				}
				if(index == 0 && msgs.length == 0){
					data.msg_replay = "User started charging";
				}
				if(_.isUndefined(lines[index].claims[claimer])){
					data.msg_replay = "User plugged out before charging was done";
					currentState = 2;
				}

			} else {
				currentState = 2;
			}

			//render the lines after index;
			var _index = (lines.length - index) || 1;
			replaySwarm.update(_.last(lines, _index));
			
			var _updateInterval = (data.msg_replay != "") ? 4000 : updateInterval;
			data.msg_replay = (data.msg_replay == "") ? "•••" :  data.msg_replay;
			
			setTimeout(update,_updateInterval);
			
			index++;
			countdown = 10;

		} else if(currentState == 2) {
			data.msg_outro = "Finished replay, want to see it again? " +countdown;
			
			if(countdown <= 0){
				_this.kill();
			}
			if(!replaySwarm.hasBeenReset){
				replaySwarm.reset(function(){
					update();
					return;
				});
			} else {
				progressTimeout = setTimeout(update,1000);
			}

			index = 0;
			countdown--;

		} 
		render();
		stateChange();
		lastState = currentState;

	}
	this.init = function(){
		console.log(">> replay2: init replay");
		createEl();
		createReplaySwarm();
		update();
	}
}