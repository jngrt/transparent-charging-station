var Swarm = function(){

	//dispatches group of circles (A/B/C)

	var pixelWidth = 20;
	var gutter = 20;
	var swarm = [];

	var getTetrisLength = function(tetris){

	}


	this.update = function(tetris){

		var allDots = $(".dot");

		_.each(tetris, function(line){
			_.each(line.pixels, function(pixel){
				//this is each pixel, convert it it into a dot.

			});
		})



		render();
	}

	var render = function(){

	}
}
