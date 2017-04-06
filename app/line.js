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
	const bgColorNotAvailable = "white";

	var createLine = function(){
		return $("<div data-index='"+_this.t+"'></div>").addClass("line").appendTo(parent);
	}
	var createDot = function(){
		return $("<div></div>").addClass("dot").appendTo(el);
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
		el.css("top",_offset);

	}
	this.clearLine = function(){
		el.css("top",parentHeight + 320 + lineHeight).one("transitionend",kill);
	}
	var kill = function(){
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
	
	}
}