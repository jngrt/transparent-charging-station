var Recorder = function(_claimer){
	
	this.track 		=  [];
	var playHead 	= 0;

	var claimer 	= _claimer;
	
	var RECORDING 	= 1;
	var STOPPED		= 0;
	
	this.recordingStatus = STOPPED;

	console.log(">>> RECORDER CREATED FOR "+claimer);

	
	this.record = function(lines){
		console.log(">> recorder is recording for track "+claimer);
		if(this.recordingStatus != RECORDING) return;
		if(lines.length < 1){
			console.log("this line has an error",lines);
			return;
		}
		
		var _lines = (lines.length > 48) ? _.last(lines,48) : lines;

		if(!_.isUndefined(_lines[0].claims[claimer])){	
			console.log(">> recorder: This line looks irrelevant");
			this.track.push(_lines);
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
		this.clearTrack();
		playHead = 0;
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

}