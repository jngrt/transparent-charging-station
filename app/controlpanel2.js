var ControlPanel = function(_id, _parent){
	
	var id = _id;
	var bleepClass = "bleep"+id;
	var parent = _parent;
	
	_.templateSettings.variable = "rc";

	var el;
	var uiTemplate = $("#ui-panel-template-new").html();
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
	
	var throttle = 20, 
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
		return;

		if(lastLines.length > 0){	
			if(lines[0].t > lastLines[0].t){
				var px = _.filter(lastLines[0].pixels, function(pixel){ return(pixel == id) });
				if(px.length>0) _this.bleep(px.length);
			}
		} else {
		};

		lastLines = lines;

	}

	this.bleep = function(line){
		// var times = _times + 1; 
		if(_.isUndefined(line)) return;
		var times = _.filter(line.pixels, function(px){ return (px == id)}).length; 
		el.addClass(bleepClass)
			.css("animation-delay",".5s")
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
		//console.log("statechange triggered",id, lastState, currentState);

		el.children('.state').hide();

		if(currentState != lastState){
			//console.log("i did change state!");
			//elegant transition
			el.children('.state'+currentState).fadeIn();
			lastState = currentState;
		} else {
			el.children('.state'+currentState).show();
		}		
	}

	// var timestampToHour = function(timestamp){

	// 	var hour = (Math.floor(timestamp/4)+12)%24;
	// 	var min = Math.abs((timestamp%4)*15);

	// 	hour = (hour < 10) ? "0"+hour : hour;
	// 	min = (min < 10) ? "0"+min : min;

	// 	return hour +":"+min;

	// }

	this.update = function(_claims){

		claims = _claims;

		if(calculationTimeout) clearTimeout(calculationTimeout);
		calculationTimeout = setTimeout(calculate, throttle);
	}
	var calculate = function(){
		//find in the tetris my
		//console.log("CP UPDATE",lines, claims);

		//first we extract all variables from the tetris and claims.

		var myClaim = _.find(claims, function(claim){
			return claim.claimer == id;
		})

		//console.log("\n\n\n",myClaim,"\n\n\n")
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
					data.notificationChargedMsg = "Not charged before deadline";
				} else {
					data.notificationChargedMsg = "";
				}
			} else if(lastDeadlineReq == myClaim.deadline && lastChargeReq == myClaim.chargeNeeded){
				currentState = STATE_CHARGING;
			} else {
				currentState = STATE_CHANGE_PARAMS;
			}
			
			data.chargePlan = cards[myClaim.card].name;
			data.chargePlanMeta = cards[myClaim.card].info.join(" • ");
		}

		if(myClaim.predictedClaimEnd > myClaim.deadline){
			data.notificationMsg = "Cannot charge before deadline";
		} else {
			data.notificationMsg = "";
		}

		var chargePercentage = Math.round(100*(myClaim.chargeReceived / myClaim.chargeNeeded));
		data.chargeValuePerc = (_.isNaN(chargePercentage)) ? 0 : chargePercentage;
	
		data.deadlineValue = timestampToHour(myClaim.predictedClaimEnd);
		data.deadlineReqValue = timestampToHour(myClaim.deadline);
		// data.chargeReqValue = myClaim.chargeNeeded;
		data.chargeReqValue = Math.round(myClaim.chargeNeeded/2);

		lastChargeReq = myClaim.chargeNeeded;
		lastChargeReq = Math.round(myClaim.chargeNeeded/2);
		lastDeadlineReq = myClaim.deadline;

		render();		
		stateChange();
		clearLine();

	}
	this.reset = function(){
		setDefaultData();
	}

	this.init = function(){
		//create a box;
		setDefaultData();
		createEl();
		stateChange();

		//now we have a box;
		el.click(function(){
			currentState++;
			currentState%=5;
			stateChange();
		})

	}

}