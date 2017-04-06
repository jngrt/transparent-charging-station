var dotSize = lineHeight = 46;

var Line = function(_line, _i, _parent){

	var _this = this;

	var line = _line;
	var index = _i;
	var parent = _parent;
	var parentHeight = $(parent).height();

	var dots = [];
	var el;

	this.cleared = false;

	const bgColors = ["red","green","blue"];
	const bgColorAvailable = "#eee";
	const bgColorNotAvailable = "white";

	var createLine = function(){
		return $("<div data-index="+index+"></div>").addClass("line").appendTo(parent);
	}
	var createDot = function(){
		return $("<div></div>").addClass("dot").appendTo(el);
	}
	var claimDots = function(){
		
		//we have a line and empty pixels.
		
		var offset = Math.round((12-line.length)/2);

		_.each(dots, function(dot, i){
			
			if(_.isUndefined(line[i])){
				var bgColor = bgColorNotAvailable;
			} else if (line[i]<0) {
				var bgColor = bgColorAvailable;
			} else {
				var bgColor = bgColors[line[i]];
			}

			if(i < offset) dot.css("background-color",bgColorNotAvailable);
			if(i+offset < 12) dots[i+offset].css("background-color",bgColor);
		});
	}
	var moveLine = function(){
		var _offset = Math.round(parentHeight - ((index+1)*lineHeight));
		console.log("how many lines should i move? "+index, _offset, Math.round(parentHeight));
		el.css("top",_offset);
	}
	var clearLine = function(){
		el.css("top",parentHeight + 320 + lineHeight).one("transitionend",kill);
		_this.cleared = true;
	}
	var kill = function(){
		el.remove();
		delete this;
	}
	this.redraw = function(_line, _clearLine){
		line = _line;
		//if we have a new line, do the animation
		if(_clearLine){
			index--;
			if(index < 0){
				clearLine();
			} else {
				moveLine();
			}
			return;
		}
		//otherwise, just recolor the dots.
		claimDots();
	}
	this.init = function(){

		console.log("I am line: "+index);
		
		//first we create a line
		el = createLine();
		
		//then we move the line
		moveLine();

		//then we fill it with dots
		_.times(12, function(){
			dots.push(createDot());
		});

		//then we claim the dots
		claimDots();	
	}
}

var NewSwarm = function(_parent){

	var _this = this;
	var parent = _parent;

	var throttle = 200, 
		calculationTimeout;

	var lines 			= [],
		destinations 	= [];
	
	var time = 0;

	var clearLine = false;


	this.update = function(_lines){

		//we get the lines in, now lets make it work.
		destinations = _.map(_lines, function(line){return line.pixels});
		console.log('update');



		clearLine = (_lines[0].t > time);
		time = _lines[0].t;

		if(clearLine || lines.length == 0){
			calculate();
			return;
		}
		//throttle rerendering
		// if(calculationTimeout) clearTimeout(calculationTimeout);
		// calculationTimeout = setTimeout(calculate, throttle);

		// _.debounce(calculate);
		calculate();

	}

	var createLine = function(destination_line, i, parent){
		return new Line(destination_line, i, parent);
	}

	var createLines = function(_destinations){
		// console.log("creating "+_destinations.length+" new lines")
		_.each(_destinations, function(destination_line, index) {

			var line = createLine(destination_line, lines.length, parent);
			line.init();
			lines.push(line);
		});
	}

	var calculate = function(){
		console.log('calculate - ', destinations.length);
	
		_.each(destinations,function(destination, index){
			if(!lines[index]) return; 
			//this line does not exists.

			if(lines[index].cleared){ 
				//this line was cleared in the last cycle
				console.log("line "+index+" is cleared");
				delete lines[index]; 
			} else {
				//this line can still be redrawn
				lines[index].redraw(destination,clearLine);
				delete destinations[index]; //this line has been animated, so clear it from destinations.
			}
		})


		lines 			= _.compact(lines);
		destinations 	= _.compact(destinations);

		console.log("This many destinations have been unfulfilled ",destinations.length);
		
		createLines(destinations);

		clearLine = false;

	}


}



//LEFT ALIGNED
// _.each(dots, function(dot, i){
// 	if(_.isUndefined(line[i])){
// 		var bgColor = bgColorNotAvailable;
// 	} else if (line[i]<0) {
// 		var bgColor = bgColorAvailable;
// 	} else {
// 		var bgColor = bgColors[line[i]];
// 	}
// 	dot.css("background-color",bgColor);
// })