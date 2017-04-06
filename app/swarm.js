


/*
	swarm

	1. create destinations array
	
	2. if no dots: 
		create dots, break.
	3. else: 
		loop over dots, each find new location (in direction), if they can't find a place, they ask to be killed.
		loop over unfulfilled destinations, create dot at that location
	
*/


var Swarm = function(_parent){

	var dotSize = 46;

	const 	DIRECTION_SOUTH = 0,
			DIRECTION_ALL = 1;

	const 	SPOT_CLAIMED = "claimed",
			SPOT_VACANT = "vacant";
	
	var _this = this;

	//rendering vars
	var parent = _parent;

	//variables for animation
	var throttle = 200, 
		calculationTimeout;

	//keeping track of dots
	var dots 	= [],
		destinations = [];
	
	var time = 0;

	//called whenever the tetris changes
	this.update = function(_lines){

		//we get the lines in, now lets make it work.
		lines = _lines;

		//throttle rerendering
		if(calculationTimeout) clearTimeout(calculationTimeout);
		calculationTimeout = setTimeout(calculate, throttle);

	}

	this.reset = function(){
		dots = [];
	}

	var createDots = function(){
		for (var l = 0; l < destinations.length; l++) {
			var line = destinations[l];

			for (var p = 0; p < line.length; p++) {
				var pixel = line[p];
				var dot = new Dot(p, l, pixel, parent);
				dot.init();
				dots.push(dot);
			};
		};
	}

	var calculate = function(){

		//first we make a copy of the lines array
		destinations = _.map(lines, function(line){return line.pixels});

		if(dots.length == 0){
			createDots();
			return;
		}

		//the tetris was updated. Every dot should look for a new location or stay
		_.each(dots, function(dot, i){
			if(dot.removeMe){
				console.log(">> found a dead dot "+i, dots.length);
				dots = _.without(dots, dot);
				return;
			}
			var direction = (lines[0].t > time) ? DIRECTION_SOUTH : DIRECTION_ALL;
			dot.findNextDestination(destinations, DIRECTION_SOUTH);
		});
		
		//the destinations array may or may not be fulfilled.
		console.log("status of dots ",dots.length);
		
		_.each(destinations, function(line, l){
			_.each(line, function(pixel, p){
				if(pixel == SPOT_CLAIMED) return; //this destination is fulfilled.
				var dot = new Dot(p, l, pixel, parent);
				dot.init();
				dots.push(dot); 
			})
		})

		time = lines[0].t;

	}


}