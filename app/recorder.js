var Recorder = function(_claimer){
	
	this.track 		=  [];
	var playHead 	= 0;

	var claimer 	= _claimer;
	
	var RECORDING 	= 1;
	var STOPPED		= 0;
	
	this.recordingStatus = STOPPED;

	console.log(">>> RECORDER CREATED FOR "+claimer);

	
	this.record = function(_lines){
		console.log(">> recorder is recording for track "+claimer);
		if(this.recordingStatus != RECORDING) return;
		if(_lines.length < 1){
			console.log("this line has an error",_lines);
			return;
		}
		
		var lines = (_lines.length > 48) ? _.last(_lines,48) : _lines;

		if(!_.isUndefined(_lines[0].claims[claimer])){	
			console.log(">> recorder: This line looks relevant");

			this.track.push(clone(lines));
		} else {
			console.log("still recording, but this line looks irrelevant to me.");
		}
	}
	this.isRecording = function(){
		return (this.recordingStatus == RECORDING);
	}
	this.isLastLines = function(i){
		return ((i+1) == this.track.length);
	}
	this.startRecording = function(){
		console.log(">> recorder - start "+claimer);
		this.recordingStatus = RECORDING;
	}
	this.stopRecording = function(){
		console.log(">> recorder - stop "+claimer);
		this.recordingStatus = STOPPED;
	}
	this.clearTrack = function(){
		console.log(">> recorder - clear "+claimer);
		this.track = [];
	}
	this.getLines = function(_index){
		if(this.track.length == 0) return [];
		var index = _index || playHead;
		playHead++;
		return this.track[index];
	}
	this.getTrack = function(){
		if(this.track.length == 0) return [];
		return this.track;
	}

}