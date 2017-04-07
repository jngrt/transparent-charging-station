var ControlPanel = function(_id, _parent){
	
	var id = _id;
	var bleepClass = "bleep"+id;
	var parent = _parent;
	
	_.templateSettings.variable = "rc";

	var el;
	var uiTemplate = $("#ui-panel-template").html();
	var lastLines = [];
	var lines = [];
	var claims = [];

	var currentState = 0;
	var lastState = -1;
	
	const STATE_PLUG_IN = 0;
	const STATE_TAP_TO_START = 1;
	const STATE_CHANGE = 2;
	const STATE_CHARGING = 3;

	var data = {};
	
	var throttle = 300, 
		calculationTimeout;
		
	var setDefaultData = function(){
		data = {
			chargePlan: "No Plan Selected",
			chargePlanMeta: "-",
			notificationMsg: "No Warnings",
			deadlineValue: "12:00",
			deadlineReqValue: "12:00",
			chargeValuePerc: 100,
			chargeReqValue: 0
		}
	}
	var clearLine = function(){
		//clear Line
		
		if(lastLines.length > 0){		
			if(lines[0].t > lastLines[0].t){
				var px = _.filter(lastLines[0].pixels, function(pixel){ return(pixel == id) });
				if(px.length>0) bleep(px.length);
			}
		};

		lastLines = lines;
	}

	var bleep = function(_times){
		var times = _times + 1; 
		console.log(times + " bleeps socket"+id);
		el.addClass(bleepClass)
			.css("animation-iteration-count",times)
			.one("animationend",function(){ 
				el.removeClass(bleepClass);
			}); 

	}
	var createEl = function(){
		el = $("<div></div>").addClass('ui-panel').appendTo(parent);
		render();
		hideStates();
	}
	var render = function(){
		var tmp = _.template(uiTemplate);
		el.html(tmp(data));	
	}
	var hideStates = function(){
		el.children('.state').hide();		
	}
	var stateChange = function(){
		if(currentState == lastState) return;
		console.log(id+" --> changing state to "+currentState);
		lastState = currentState;
		el.children('.state').fadeOut();
		el.children('.state'+currentState).fadeIn();
	}

	var timestampToHour = function(timestamp){

		var hour = Math.floor(timestamp/4)%24;
		var min = (timestamp%4)*15;

		return hour +":"+min;

	}

	this.update = function(_lines, _claims){

		lines = _lines;
		claims = _claims;

		if(calculationTimeout) clearTimeout(calculationTimeout);
		calculationTimeout = setTimeout(calculate, throttle);
	}
	var calculate = function(){
		//find in the tetris my
		console.log("CP UPDATE",lines, claims);

		//first we extract all variables from the tetris and claims.

		var myClaim = claims[id];
		
		//if ClaimStart == -1, nothing is happening
		if(myClaim.claimStart < 0){
			currentState = 0;
			stateChange();
			return; //no need to change the data.
		}
		if(myClaim.card < 1){
			currentState = 1;
		} else {
			currentState = 2;
			data.chargePlan = cards[myClaim.card].name;
			data.chargePlanMeta = cards[myClaim.card].name;
		}


		data.notificationMsg = "No Warnings";
		data.deadlineValue = "12:00";
		data.deadlineReqValue = "12:00";
		data.chargeValuePerc = 100;
		data.chargeReqValue = 10;
		

		/*
		card : 1
		chargeNeeded : 68
		chargeReceived : 0
		claimStart : 0
		claimer : 0
		deadline : 12
		predictedClaimEnd : 28
		priority : 1

		*/
		stateChange();
		render();
		clearLine();

	}
	this.reset = function(){
		setDefaultData();
	}

	this.init = function(){
		//create a box;
		createEl();
		stateChange();
		setDefaultData();

		//now we have a box;
		el.click(function(){
			currentState++;
			currentState%=4;
			stateChange();
		})

	}

}