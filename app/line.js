var Line = function(_line, _parent, _delegate){

	var _this = this;

	var dotSize = lineHeight = 46;

	var line = _line;
	var parent = _parent;
	var delegate = _delegate;

	var index;

	var parentHeight = $(parent).height();

	var dots = [];
	var el;
	this.t = _t = _line.t;

	this.cleared = false;

	const bgColors = ["red","green","blue"];
	const bgColorAvailable = "#eee";
	const bgColorNotAvailable = "black";

	var createLine = function(){
		return $("<div data-index='"+_this.t+"'></div>").addClass("line").appendTo(parent);
	}
	var createDot = function(){
		return $("<div></div>").addClass("dot").appendTo(el);
	}
	var addTimeLabel = function(){
		if((_this.t % 4) == 0){
			var now = new Date().getHours();
			var timeLabel = (now + (_this.t / 4))%24;	
			$("<div></div>").html(timeLabel+":00").addClass("lineLabel").appendTo(el);
		}
	}
	var addDeadline = function(){
		
	}
	var claimDots = function(){
		
		//we have a line and empty pixels.
		
		var offset = Math.round((12-line.pixels.length)/2);

		_.each(dots, function(dot, i){
			
			if(_.isUndefined(line.pixels[i])){
				var bgColor = bgColorNotAvailable;
			} else if (line.pixels[i]<0) {
				var bgColor = bgColorAvailable;
			} else {
				var bgColor = bgColors[line.pixels[i]];
			}

			if(i < offset) dot.css("background-color",bgColorNotAvailable);
			if(i+offset < 12) dots[i+offset].css("background-color",bgColor);

			var lineClaim = line.claims[line.pixels[i]];
			if(lineClaim){
				dots[i+offset].removeClass("overdue");	
				if(lineClaim.overdue){
					dots[i+offset].addClass("overdue");	
				}
			}				

		});
	}
	this.touch = function(){
		el.attr("alt",delegate.getNow());
	}
	this.redraw = function(_line){
		line = _line || line;
		claimDots();
		moveLine();
	}
	var moveLine = function(){
		var _offset = Math.round(parentHeight - ((getIndex()+1)*lineHeight));
		_.delay(function(){
			el.css("top",_offset);
		}, _this.t*50);

	}
	this.clearLine = function(){
		el.children(".lineLabel").fadeOut("fast");
		el.css("top",parentHeight + 320 + lineHeight).one("transitionend",_this.kill);
	}
	this.kill = function(){
		el.remove();
		_this.cleared = true;
	}
	var getIndex = function(){
		return line.t - delegate.getNow();
	}
	this.init = function(){
		el = createLine();
		_.times(12, function(){
			dots.push(createDot());
		});
		claimDots();
		addTimeLabel();
	
	}
}