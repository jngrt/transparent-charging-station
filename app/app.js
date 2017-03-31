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

// const [ABSOLUTE_PRIORITY, MEDIUM_PRIORITY, NO_PRIORITY, GREEN_PRIORITY] = [1, 2, 3, 4];

const greenThreshold = 6; //6 gray energy, 6 green energy

jQuery(document).ready(function ($) {

	const tetris = new Tetris();

	swarm = new Swarm();
	tetris.onUpdate(() => swarm.update( tetris ));


	$('form.addClaims :input').on('input', function (evt) {
		var form = $(evt.target).parents("form");
		getDataFromForm(form, tetris);
		evt.preventDefault();
	})
	$("form").each(function(index){
		getDataFromForm($(this), tetris);
	});
});

function getDataFromForm(form, tetris){
	let data = form.serializeArray().reduce(function (obj, item) {
		obj[item.name] = item.value;
		return obj;
	}, {});

	tetris.addClaim(+data.claimer, +data.priority, +data.chargeNeeded, +data.deadline);
}
