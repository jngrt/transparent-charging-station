var Recorder = function(_claimer){
	
	this.track 		=  [];
	var playHead 	= 0;

	var claimer 	= _claimer;
	
	var RECORDING 	= 1;
	var STOPPED		= 0;
	
	this.recordingStatus = STOPPED;

	console.log("!! RECORDER CREATED FOR "+claimer);

	
	this.record = function(lines){
		console.log(">> recorder is recording for track "+claimer);
		if(this.recordingStatus != RECORDING) return;
		var _lines = (lines.length > 48) ? _.last(lines,48) : lines;

		if(!_.isUndefined(_lines[0].claims[claimer])){
			console.log(">> recorder: This line looks irrelevant");
			this.track.push(_lines);
		}
	}
	this.isRecording = function(){
		return (this.recordingStatus == RECORDING);
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
		var index = _index || playHead;
		playHead++;
		return this.track[index];
	}
	// this.getLine = function(index){
	// 	console.log(">> recorder - getTrack "+claimer);
	// 	return tracks[claimer];
	// }

}