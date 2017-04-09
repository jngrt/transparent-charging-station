var NewSwarm = function(_parent, _fadeLabels){

	var _this = this;
	var parent = _parent;
	var parentHeight = $(parent).height();
	var fadeLabels = _fadeLabels || false;

	var dotSize = lineHeight = 44.8;

	this.hasBeenReset = true;

	var throttle = 50, 
		calculationTimeout;

	var lines = [];
	var dots = [];

	var time = 0;

	var clearLine = false;

	this.update = function(_lines){
		_this.hasBeenReset = false;

		$(parent).fadeIn();

		lines = _lines;

		clearLine = (time < lines[0].t);
		time = lines[0].t;

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
	var timestampToHour = function(timestamp){

		var hour = (Math.floor(timestamp/4)+12)%24;
		var min = Math.abs((timestamp%4)*15);

		hour = (hour < 10) ? "0"+hour : hour;
		min = (min < 10) ? "0"+min : min;

		return hour +":"+min;

	}
	var addTimeLabel = function(t, l){
		
		var time = timestampToHour(t);

		var top = { top: parentHeight - (l+1)*lineHeight };

		var timeLabel = $("<div></div>")
			.addClass("timeLabel")
			.html(time)
			.css(top)
			.appendTo(parent);
			
		if (fadeLabels) timeLabel.hide().fadeIn();
	}
	var addDeadline = function(l, t, p, isOverdue){
		var top = { top: parentHeight - (l+1)*lineHeight };
		
		var time = timestampToHour(t);

		var deadlineLabel = $("<div></div>")
			.addClass("deadlineLabel")
			.html("deadline: "+time)
			.css(top)
			.appendTo(parent);

		deadlineLabel.addClass("deadlineLabel"+p);

		if (isOverdue) deadlineLabel.addClass("overdue");
		if (fadeLabels) deadlineLabel.hide().fadeIn();

	}
	var createDots = function(){
		
		var i = 0;
		
		_.each(lines, function(line, l) {
			var claims = line.claims;
			i++;
			
			if(line.t%4 == 0) addTimeLabel(line.t, l);

			_.each(line.pixels, function(pixel, p){

							
				var isOverdue = false;
				
				if(_.has(claims[pixel],"overdue")){
					isOverdue = claims[pixel].overdue
				}
				if(line.claims[pixel]){
					console.log(line.t, "found line claim",line.claims[pixel]);
					if(line.claims[pixel].deadline == line.t){
						addDeadline(l, line.t, pixel, isOverdue);
					}
				}
				

				var classes = ["dot"];

				if(isOverdue) classes.push("overdue");
				if(pixel>=0)  classes.push("dot"+pixel);

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

		_this.hasBeenReset = true;

		$(parent).children(".dot").css("transform","translateY(3000px)").css("transition-duration","2s");
		$(parent).children(".timeLabel").fadeOut();
		$(parent).children(".deadlineLabel").fadeOut();
		$(parent).fadeOut("slow");
		setTimeout(function(){
			clearDots(callback);
		},4000);
	}
	var clearDots = function(callback){
		dots = [];
		$(parent).children(".dot").remove();
		$(parent).children(".timeLabel").remove();
		$(parent).children(".deadlineLabel").remove();
		$(parent).empty();
		if(typeof callback == "function") callback();
	}
	var clearAndCreateDots = function(){
		clearDots(createDots);
	}
	var animateDots = function(callback){
		if(fadeLabels) $(parent).children(".timeLabel").fadeOut();
		if(fadeLabels) $(parent).children(".deadlineLabel").fadeOut();
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
			dot.el.css("transform","translateY("+lineHeight+"px)");
		});

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