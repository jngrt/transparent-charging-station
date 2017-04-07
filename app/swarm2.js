
var NewSwarm = function(_parent){

	var _this = this;
	var parent = _parent;

	var dotSize = lineHeight = 46;


	var throttle = 200, 
		calculationTimeout;

	var lines  = window.lines	= [],
		destinations 	= [];

	
	var time = 0;

	var clearLine = false;

	this.update = function(_lines){

		//we get the lines in, now lets make it work.
		// destinations = _.map(_lines, function(line){return line.pixels});
		destinations = _lines;

		clearLine = (time < destinations[0].t);
		time = destinations[0].t;


		if(clearLine || lines.length == 0){
			calculate();
			return;
		}

		if(calculationTimeout) clearTimeout(calculationTimeout);
		calculationTimeout = setTimeout(calculate, throttle);

	}
	this.getNow = function(){
		return time;
	}
	var createLines = function(){
		// console.log("creating "+_destinations.length+" new lines")
		_.each(destinations, function(destination) {
			var line = new Line(destination, parent, _this);
			line.init();
			lines[destination.t] = line;
		});
	}

	var calculate = function(){

		var claimedDestinations = [];

		_.each(destinations, function(destination){
			//look for lines with this timestamp
			var timestamp = destination.t;
			var line = lines[timestamp];
			if(line){
				line.redraw(destination);
				claimedDestinations.push(timestamp);
			}
		});

		destinations = _.reject(destinations,function(dest){
			return (claimedDestinations.indexOf(dest.t)>=0);
		})


		var emptyLineObjects = 0; 

		//for some reason... this shit doesn't work.
		lines = _.each(lines, function(line){
			if (!line){
				// emptyLineObjects++;
				// delete lines[i];
				line = null;
				return;
			}
			if (line.t < _this.getNow()){
				line.clearLine();
			}
			if (line.cleared){
				emptyLineObjects++;
				line = null;
				// lines[i] = null;
				// delete lines[i];
			}
		})

		console.log("report: emptyLineObjects "+emptyLineObjects+" destinations",destinations.length, "lines",lines.length, "elements",$(".line").length);
		
		createLines();


	}

}