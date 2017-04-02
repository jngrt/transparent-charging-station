var Swarm = function(){

	//dispatches group of circles (A/B/C)

	var pixelWidth = 20;
	var gutter = 20;

	var throttle = 1000; //time out in ms
	var renderTimeout;

	var swarm = [];

	var getTetrisLength = function(lines){

	}


	this.update = function(_lines){

		//we get the lines in, now lets make it work.
		lines = _lines;

		if(renderTimeout) clearTimeout(renderTimeout);
		renderTimeout = setTimeout(render, throttle);

		render();
	}

	var render = function(){

		_.each(lines, function(line, _l){
			
			var claims = line.claims;

			_.each(line.pixels, function(pixel, _p){

				if(claims[pixel])
				//iterate over the pixels.
				console.log(pixel, _l, _p);

			});
		});


	}
}