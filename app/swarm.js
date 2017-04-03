var Dot = function(x, y, pixel, claim, parent){

	var el;
	var diffX = 20;
	var diffY = 20;
	var claimers = ["","A","B","C"];

	this.convert = function(){

	}

	var translate = function(){
		el.css({
			left: x * diffX,
			top: y * diffY
		})
	}


	this.init = function(){

		el = $("<div class='dot pixel"+claimers[pixel]+"'>"+pixel+"</div>").appendTo(parent);
		translate();
	}()
}

var Swarm = function(){

	var pixelWidth = 20;
	var gutter = 20;

	var el = $("#swarm")

	var throttle = 200; //time out in ms
	var renderTimeout;

	var allDots = [];


	this.update = function(_lines){

		//we get the lines in, now lets make it work.
		lines = _lines;

		//throttle rerendering
		if(renderTimeout) clearTimeout(renderTimeout);
		renderTimeout = setTimeout(render, throttle);

		// render();
	}

	var render = function(){

		for (var l = lines.length - 1; l >= 0; l--) {
			var line = lines[l];
			var claims = line.claims;

			for (var p = line.pixels.length - 1; p >= 0; p--) {
				var pixel = line.pixels[p];
				allDots.push(new Dot(p, l, pixel, claims[line.pixels],el));
			};
		};

		


	}
}