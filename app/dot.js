var Dot = function(_x, _y, _claimer, _parent){
	
	var _this 		= this;

	this.x 			= _x;
	this.y 			= _y;
	this.claimer 	= _claimer;
	this.parent 	= _parent;
	this.lastLine 	= false;
	this.removeMe 	= false;


	var el;
	var animationDelay = 0;

	var makeCoordinate = function(x, y){
		return {left: _this.x*dotSize, top: _this.y*dotSize};
	}

	var move = function(callback, msg){
		var xy = makeCoordinate(_this.x, _this.y);
		el.css(xy);
	}
	var moveDelayed = function(){
		_.delay(move, animationDelay);
	}
	
	this.findNextDestination = function(destinations, _direction){
		
		var destination_directions = [[_this.y-1], [_this.y-1, _this.y+1, _this.y]]; //DIRECTION_SOUTH, DIRECTION_ALL
		var directions = destination_directions[_direction];

		var reused = false;

		_.each(directions, function(destinationY){
			
			if(reused) return; // in previous loop we found a place for this dot.

			//check if the line we're checking is in range
			if(destinationY >= 0 && destinationY < destinations.length){

				//then this is a list of potential places to go
				var potentialDestinations = destinations[destinationY];
				destinationX = potentialDestinations.indexOf(_this.claimer);

				if(destinationX >= 0){
					reused = true;
					_this.y = destinationY;
					_this.x = destinationX;
					destinations[destinationY][destinationX] = SPOT_CLAIMED; //so next dots can't occupy this space;
				}
			}

			//this means clear line.
			if(destinationY < 0 && _direction == DIRECTION_SOUTH){
				reused = true;
				clearLine();
			}
		});

		if(!reused){
			this.kill(); //could not find a reason to retain
			return;
		}

		move();

	}
	this.kill = function(){
		this.removeMe = true;
		el.remove();
		delete this;
	}
	var clearLine = function(){
		//the next destination will be south. :-)
		// _this.y = -10;
		// _this.x = _this.claimer + 1;

		// move(_this.kill,"killed after line clear");

		console.log("killing dot for line clear",_this.x, _this.y);
		
		_this.kill();
	}

	this.init = function(){

		animationDelay = 10;

		el = $("<div></div>")
			.addClass("dot")
			.html(this.claimer)
			.appendTo(this.parent)
		
		moveDelayed();
	};
}
