var NewSwarm = function(_parent){

	var _this = this;
	var parent = _parent;
	var parentHeight = $(parent).height();

	var dotSize = lineHeight = 44.8;

	var throttle = 200, 
		calculationTimeout;

	var lines = [];
	var dots = [];

	var time = 0;

	var clearLine = false;

	this.update = function(_lines){

		//we get the lines in, now lets make it work.
		// destinations = _.map(_lines, function(line){return line.pixels});
		lines = _lines;

		clearLine = (time < lines[0].t);
		time = lines[0].t;


		// if(xclearLine || lines.length == 0){
		// 	calculate();
		// 	return;
		// }

		if(calculationTimeout) clearTimeout(calculationTimeout);
		calculationTimeout = setTimeout(calculate, throttle);

	}
	this.getNow = function(){
		return time;
	}
	var makeCoordinates = function(l,p, lineLength){

		var offset = Math.round((12 - lineLength)/2);

		return {
			left: (offset+p)*dotSize,
			top: parentHeight - (l+1)*lineHeight
		}
	}
	var createDots = function(){
		
		var i = 0;
		
		_.each(lines, function(line, l) {
			var claims = line.claims;
			i++;
			if(line.t%4 == 0){
				//add a timelabel
			}
			_.each(line.pixels, function(pixel, p){
				
				var isOverdue = false;
				if(_.has(claims[pixel],"overdue")){
					isOverdue = claims[pixel].overdue
				}
				var classes = ["dot"];

				if(isOverdue) classes.push("overdue");
				if(pixel>=0) classes.push("dot"+pixel);

				var delay = (i/48).toFixed(2);
				var dot = {};
				dot.l 	= l;
				dot.claimer = pixel;
				dot.el = $("<div></div>")
					.addClass(classes.join(" "))
					.css(makeCoordinates(l, p, line.pixels.length))
					.css("transition-delay",delay+"s")
					.attr('alt',dot.l);

				dots.push(dot);
			})
		});
		_.each(dots, function(dot){
			dot.el.appendTo(parent);
		})
	}
	this.reset = function(callback){
		$(".dot").css("transform","translateY(3000px)").css("transition-duration","2s");
		setTimeout(function(){
			clearDots(callback);
		},4000);
	}
	var clearDots = function(callback){
		dots = [];
		$(".dot").remove();
		$(parent).empty();
		if(typeof callback == "function") callback();
	}
	var clearAndCreateDots = function(){
		clearDots(createDots);
	}
	var animateDots = function(callback){
		_.each(dots,function(dot){
			if(dot.l == 0){
				if(dot.claimer >=0){
					var c = dot.claimer - 1;
					var translateX = 300*c;
					dot.el.css("transform","translateX("+translateX+"px) translateY(460px)").css("transition-duration","1s");
					return;
				}
				dot.el.css("opacity","0");
				
			}
			dot.el.css("transform","translateY(46px)");
		});

		// $(".dot")
		setTimeout(callback,1400);
 	}

	var calculate = function(){
		
		if(clearLine){
			animateDots(clearAndCreateDots);
		} else{
			clearAndCreateDots();
		}
	
	}

}