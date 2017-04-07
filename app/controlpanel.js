var ControlPanel = function(_id, _parent){
	
	var id = _id;
	var bleepClass = "bleep"+id;
	var parent = _parent;

	var uiTemplate = $("#ui-panel-template").html();


	var currentState = 0;
	
	const STATE_PLUG_IN = 0;
	const STATE_TAP_TO_START = 1;
	const STATE_CHANGE = 2;
	const STATE_CHARGING = 3;

	var data = {
		chargePlan: "Optimus Charge",
		chargePlanMeta: "All the perks",
		notificationMsg: "You ded",
		deadlineValue: "12:00",
		deadlineReqValue: "12:30",
		chargeValuePerc: "95",
		chargeReqValue: 25
	}
	_.templateSettings.variable = "rc";

	var el;

	var bleep = function(){
		console.log(bleepClass);
		el.removeClass(bleepClass);
		setTimeout(function(){
			el.addClass(bleepClass);
		},50);
	}
	var createEl = function(){
		el = $("<div></div>").addClass('ui-panel').appendTo(parent);
		renderTemplate();
		hideStates();
	}
	var renderTemplate = function(){
		var tmp = _.template(uiTemplate);
		el.html(tmp(data));	
	}
	var hideStates = function(){
		el.children('.state').hide();		
	}
	var stateChange = function(){
		el.children('.state').fadeOut();
		el.children('.state'+currentState).fadeIn();
	}

	this.onUpdate = function(tetris){
		//find in the tetris my 
	}

	this.init = function(){
		//create a box;
		createEl();
		stateChange();

		//now we have a box;
		el.click(function(){
			currentState++;
			currentState%=4;
			stateChange();
		})

	}

}