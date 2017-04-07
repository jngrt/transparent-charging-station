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

	var lastChargeReq = 0;
	var lastDeadlineReq = 0;

	var currentState = 0;
	var lastState = -1;
	
	const STATE_PLUG_IN = 0;
	const STATE_TAP_TO_START = 1;
	const STATE_CHANGE_PARAMS = 2;
	const STATE_CHARGING = 3;
	const STATE_CHARGE_FULL = 4;

	var data = {};
	
	var throttle = 300, 
		calculationTimeout;
		
	var setDefaultData = function(){
		data = {
			chargePlan: "No Plan Selected",
			chargePlanMeta: "-",
			notificationMsg: "No Warnings",
			notificationChargedMsg: "No Warnings",
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

	var timestampToHour = function(timestamp){

		var hour = (Math.floor(timestamp/4)+12)%24;
		var min = Math.abs((timestamp%4)*15);

		hour = (hour < 10) ? "0"+hour : hour;
		min = (min < 10) ? "0"+min : min;

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
		// console.log("CP UPDATE",lines, claims);

		//first we extract all variables from the tetris and claims.

		var myClaim = claims[id];
		currentState = 1;
		
		//if ClaimStart == -1, nothing is happening
		if(myClaim.claimStart < 0){
			currentState = STATE_PLUG_IN;
			stateChange();
			return; //no need to change the data.
		}
		if(myClaim.card < 1){ //still need to swipe card.
			currentState = STATE_TAP_TO_START;
		} else {
			//has this request been changed?
			if(myClaim.chargeReceived > 0 && myClaim.chargeReceived >= myClaim.chargeNeeded){
				currentState = STATE_CHARGE_FULL;
				if(myClaim.predictedClaimEnd > myClaim.deadline){
					data.notificationChargedMsg = "Not charged within deadline";
				} else {
					data.notificationChargedMsg = "";
				}
			} else if(lastDeadlineReq == myClaim.deadline && lastChargeReq == myClaim.chargeNeeded){
				currentState = STATE_CHARGING;
			} else {
				currentState = STATE_CHANGE_PARAMS;
			}
			
			data.chargePlan = cards[myClaim.card].name;
			data.chargePlanMeta = cards[myClaim.card].name;
		}

		if(myClaim.predictedClaimEnd > myClaim.deadline){
			data.notificationMsg = "You won't make your deadline";
		} else {
			data.notificationMsg = "";
		}

		//find 
		var claimId = lines[0].claims[id]; 

		// if(claimId){
		// 	data.chargeValuePerc = (Math.round(claimId.chargeReceived / claimId.chargeNeeded).toFixed(2))*100;
		// } else {
			data.chargeValuePerc = Math.round(100*(myClaim.chargeReceived / myClaim.chargeNeeded));
		// }

		data.deadlineValue = timestampToHour(myClaim.predictedClaimEnd);
		data.deadlineReqValue = timestampToHour(myClaim.deadline);
		data.chargeReqValue = myClaim.chargeNeeded;

		lastChargeReq = myClaim.chargeNeeded;
		lastDeadlineReq = myClaim.deadline;
		
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
		render();
		console.log("going to rerender for state ",currentState);
		stateChange();
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
			currentState%=5;
			stateChange();
		})

	}

}