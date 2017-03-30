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

const [ABSOLUTE_PRIORITY, MEDIUM_PRIORITY, NO_PRIORITY, GREEN_PRIORITY] = [1, 2, 3, 4];

const greenThreshold = 6; //6 gray energy, 6 green energy



jQuery(document).ready(function ($) {

	const tetris = new Tetris();
	//tetris.init();
	dummyData(tetris);

	swarm = new Swarm();
	tetris.onUpdate(() => swarm.update( tetris ));


	$('form.addClaims :input').on('input', function (evt) {
		evt.preventDefault();

		let data = $(evt.target).parents("form").serializeArray().reduce(function (obj, item) {
			obj[item.name] = item.value;
			return obj;
		}, {});

		console.log("data",data);

		tetris.addClaim(+data.claimer, +data.priority, +data.chargeNeeded, +data.deadline);
		return false;
	})
});

function dummyData(t) {
	//claimer, priority, chargeNeeded, deadline, info){
	t.addClaim(1, 10, 60, 10);
	t.addClaim(2, 10, 60, 20);
	t.addClaim(3, 10, 200, 30);

}