/*
	PIXEL
		3px x 3px
		has owner
			none, A, B, C
			...

	TETRIS
		Init, width, height

	DIRECTOR

		divides all available pis

	ACTORS
		Regular
			gets no priority
		Doctor
			gets all priority
		Premium
			gets some priority
		Philantropist
			give away priority?
*/
const _ = require('underscore')
const jQuery = require('jquery')
const $ = jQuery;

var ABSOLUTE_PRIORITY 	= 1,
	MEDIUM_PRIORITY 	= 2,
	NO_PRIORITY			= 3,
	GREEN_PRIORITY 		= 4;

var linesPerHour 		= 4;
var greenThreshold 		= 6; //6 gray energy, 6 green energy
var tetris;

// var claimers = [
// 	"▒","▓","░"
// ]
var claimers = [ //sorry JG, ik wilde even spelen
	"A","B","C"
]

jQuery(document).ready(function($) {

	tetris = new Tetris();
	tetris.init();
	dummyData(tetris);

	swarm = new Swarm();
	tetris.onUpdate(swarm.update);


	$('form').on('submit',function(evt){
		evt.preventDefault();

		var data = $('#addClaims').serializeArray().reduce(function(obj, item) {
    	obj[item.name] = item.value;
    	return obj;
		}, {});

		tetris.addClaim(
			+data.claimer,
			+data.priority,
			+data.chargeNeeded,
			+data.deadline
		);
		return false;
	})
});

function dummyData(t) {
	//claimer, priority, chargeNeeded, deadline, info){
	t.addClaim(1,1,20,10);
	t.addClaim(2,1,30,20);
	t.addClaim(3,1,10,30);

}
