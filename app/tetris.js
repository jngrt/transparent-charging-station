'use strict'

/*
Two algorithm modes right now:
SIMPLE -> Only looks at priority
STRESS -> Only looks at stress regarding total available charge until deadline.



*/
const GRID_HEIGHT = 48;
const GRID_WIDTH = 6;
//Maximum history length of 48 lines
const HISTORY_LINES = 48;

const PRIORITY = 'priority';
const STRESS = 'stress';
const COMBINED = 'combined';
const claimers = ['A', 'B', 'C'];

const _maxStress = 50;

const START_CHARGE = 100;
const START_DEADLINE = 16; // 3 hours, 8 lines per hour

class Tetris {

  constructor ( cards ) {
    this.cards = cards;
    this.start = 0;
    this.element = '#tetris';
    this.height = GRID_HEIGHT;
    this.width = GRID_WIDTH;
    this.minWidth = Math.round(this.width / 2);
    this.maxWidth = Math.round(this.width * 2);
    this.now = this.start;
    this.lines = [];
    this.onUpdateCallbacks = [];
    this.onUnplugCallback = null;
    this.algorithm = COMBINED;

    //create grid with predictable settings
    _.times(24, function(){
      this.createLine(undefined, 6, 4);
    },this);
    
    //the rest of the lines can be random.
    _.times(GRID_HEIGHT - 24, function(){
      this.createLine();
    },this);


    this.claims = _.times(3, n => ({
      claimer: n,
      card: -1,
      priority: 0,
      chargeNeeded: 0,
      deadline: 0,
      chargeReceived: 0,
      claimStart: -1,
      predictedClaimEnd: -1,
    }));

    console.log(this.lines);
    this.update();
  }
  getCurrentChargers(){
    //let line = _.find(this.lines, line => line.t === this.now, this);
    return _.map( this.claims, c => { return c.claimStart > -1 });
  }
  getLastLine(_offset){
    let offset = _offset || 0;
    let index = _.findIndex(this.lines, line => line.t === (this.now+offset), this);
    if( !~index ) return;

    return this.lines[index];
  }
  getCurrentGrid() {
    let lowIndex = _.findIndex(this.lines, line => line.t === this.now, this);
    lowIndex = ~lowIndex ? lowIndex : 0;
    let highIndex = Math.min( lowIndex + GRID_HEIGHT + 1, this.lines.length);
    return this.lines.slice(lowIndex,highIndex);
  }
  getReplayLines( claimer ) {
   
    // start: when claimer plugged in
    let claimStart = this.claims[claimer].claimStart;
    let lowIndex = _.findLastIndex(this.lines, line => line.t === claimStart );
    lowIndex = ~lowIndex ? lowIndex : 0;
    
    // end: when claimer plugged out 
    let predEnd = this.claims[claimer].predictedClaimEnd;
    let highIndex = this.lines.length - 1;
    if ( ~predEnd ) {
      highIndex = _.findIndex(this.lines, line => line.t === predEnd, this);
      highIndex = ~highIndex ? highIndex : this.lines.length - 1;
    }

    return this.lines.slice(lowIndex,highIndex + 1);
  }
  increaseTime() {
    this.now++;
    this.updateChargeReceived();
    this.createLine();
    this.processClaims();
    return this.now;
  }

  get time() {
    return this.now;
  }
  updateChargeReceived() {
    //Every time the time increases we update the amount of charge received
    let line = _.find(this.lines, ln => ln.t === this.now - 1);
    if(!line) return;
    
    _.each(line.claims, lc => {
      this.claims[lc.claimer].chargeReceived += lc.pixels;
    });

  }

  createLine (_lineTime, _maxWidth, _minWidth) {
    
    if ( _lineTime === void(0)) {
      _lineTime = this.lines.length ? _.last(this.lines).t + 1 : 0;
    }


    var maxWidth = _maxWidth || this.maxWidth;
    var minWidth = _minWidth || this.minWidth;
    
    //add random variations to width
    const prev = (this.lines.length > 0) ? _.last(this.lines).pixels.length : _.random(minWidth, this.width);
    const variation = Math.round(_.random(-2,2));

    
    let lineLength = prev + variation;
    if(lineLength <= minWidth) lineLength = minWidth;
    if(lineLength > maxWidth) lineLength = maxWidth;
       
    // add line
    const line = {
      t: _lineTime,
      meta: {},
      pixels: Array(lineLength).fill(0)
    };
    this.lines.push(line);

    // check total size
    // (make sure we don't run out of memory)
    if( this.lines.length > GRID_HEIGHT + HISTORY_LINES){
      this.lines.shift();
    }
  }

  updateCard(claimer, card){
    if( !this.cards[card] ) return console.error('Undefined card: ', card);
  
    if( !this.cards[card] ) return console.error('Unknown card: ', card);

    let priority = this.cards[card].priority;
    let c = this.claims[claimer];
    if(!c) return console.error('Not a valid claimer:' + claimer);
    
    if( c.card === -1 ) {
      _.extend( c, {
        priority: priority,
        card: card,
        deadline: this.now + START_DEADLINE,
        chargeNeeded: START_CHARGE
      });
    } else {
      _.extend( c, {
        priority: priority,
        card: card
      });
    }
    
    this.processClaims();
  }
  updatePlugs(claimer, pluggedIn){

    let c = this.claims[claimer];
    if(!c)
      return console.log('Invalid claimer: ', claimer, pluggedIn);
    
    if( !!~c.claimStart === pluggedIn )
      return console.log('State did not change: ', claimer, pluggedIn, c);
    
    if( !pluggedIn && ~c.claimStart ) {
      let replayLines = this.getReplayLines( claimer );
      _.extend( c, {
         priority:0, chargeNeeded:0, deadline:0, chargeReceived: 0, claimStart: -1, card: -1
      });
      this.onUnplugCallback( claimer, replayLines );
    } else if( pluggedIn ) {
       c.claimStart = this.now;
       c.deadline = this.now;
       //fix overdue bug, by setting default deadline to now
     
      console.log(">>> DETECTED PLUGIN EVENT", claimer, pluggedIn);
      this.onPlugInCallback( claimer );
    }
    this.processClaims();
  }
  updateParameters( encoder, value ){
    //console.log(encoder,value);
    let claimer = ~~(encoder / 2);

    let c = this.claims[claimer];
    if(!c)
      return console.error('Invalid claimer: ', claimer, pluggedIn);
    
    if(!~c.claimStart)
      return console.log('Claimer not plugged in', claimer);
    
    let changeValue = value === 1 ? 1 : -1;

    if( encoder % 2 ) {
      // Charge needed should be between 0 and 100
      c.chargeNeeded = Math.max( 0, Math.min( 200, c.chargeNeeded + changeValue ));
    } else {
      // deadline should be between NOW and NOW + 48
      c.deadline = Math.max( this.now, Math.min( this.now + GRID_HEIGHT, c.deadline + changeValue));
    }

    this.processClaims();
  }

  // only used when changing values in the debug overlay screen
  updateClaimDebugForm(claimer, pluggedIn, card, chargeNeeded, deadline, info) {
     //TODO check events: plug in / plug out...
      //TODO update the last line because of plug out.
      // And trigger the animation.
    if( !this.cards[card] )
      return console.error('Unknown card: ', card);

    let priority = this.cards[card].priority;
    let c = this.claims[claimer];
    if(!c) {
      throw new Error('Not a valid claimer:' + claimer);
    }

    if( !pluggedIn && ~c.claimStart ) {
      let replayLines = this.getReplayLines( claimer );
      _.extend( c, {
        priority:0, chargeNeeded:0, deadline:0, chargeReceived: 0, claimStart: -1, card: -1
      });
      this.onUnplugCallback( claimer, replayLines );
    } else if( pluggedIn ) {

      _.extend( c, { 
        priority: priority, 
        chargeNeeded: chargeNeeded, 
        deadline: Math.min(this.now + 48, Math.max(this.now, this.now + deadline)),
        claimStart: ( ~c.claimStart ? c.claimStart : this.now ),
        card: card
      });

      console.log(">>> DETECTED PLUGIN EVENT", claimer, pluggedIn);
      this.onPlugInCallback( claimer );
     
    }
       

    //process the claims
    this.processClaims();

  }
  clearLine(){
    //clear line and save it to the record
    //this.updateTotalReceived() ...?
  }
  processClaims () {

    //we process the claims per line.
    let _totalReceived = [0,0,0];
    if ( this.now > 0 ) {
      _totalReceived = _.map(this.claims, c => c.chargeReceived);
    }
    
    //let lastLine;
    _.each(this.lines, function (_line, _lineNo) {
      if ( _line.t < this.now ) {
        return;
      }
      

      let _pixels = _line.pixels;

      // copy claims which are applicable for this line
      this.copyAndFilterClaims(_line, _totalReceived);
     
      this.calculateStress( _line, _totalReceived );
      //this.checkClaimSubtotal(_line, lastLine);
      this.combinedToPixelsNeeded( _line, _totalReceived );
      this.checkLeftoversStress( _line );
      
    
      // Keep track of how much charge is received up until this line
      this.updateTotalReceived( _line, _totalReceived, _lineNo === 0  );

      // Add event messages to the claims for this line
      this.generateMessages( _line, _lineNo );

      // Fill the pixels based on the claims
      this.fillPixels( _line );
      
     // lastLine = _line;

    }, this)

    // console.log(this.claims);
    this.update();

  }
  // checkClaimSubtotal( _line, _lastLine ) {
  //   _.each( _line.claims, claim => {
  //     let prevClaim = _lastLine? _.find( _lastLine.claims, plc => plc.claimer === claim.claimer):null;
  //     claim.prevSubtotal = prevClaim? prevClaim.prevSubtotal + prevClaim.pixels : 0;
      
  //   });
  // }
  generateMessages ( _line, _lineNo ) {
    
    let prevLine = _lineNo? this.lines[_lineNo-1] : null;

    _.each( _line.claims, (claim, index, claims ) => {
      let prevClaim = prevLine? _.find(prevLine.claims, plc => plc.claimer === claim.claimer): null;
      let card = this.cards[claim.card];
      let cName = card? card.name : 'Unknown';
      if( claim.claimStart === _line.t) {
        claim.message = cName + ' started charging';
      }
      else if ( claim.deadline === _line.t ) {
        if ( claim.predictedClaimEnd === _line.t ) {
          claim.message = cName + ' is charged right in time for the deadline';
        } else if ( claim.predictedClaimEnd > _line.t ){
          claim.message = cName + ' missed deadline, not yet fully charged';
        }
      } 
      else if ( claim.predictedClaimEnd === _line.t ) {
        if( claim.deadline < _line.t ) {
          claim.message = cName + ' received all requested charge, but missed the deadline';
        } else {
          claim.message = cName + ' received all requested charge, before the deadline';
        }
      } 
      else if (  claim.overdue && prevClaim && !prevClaim.overdue ) {
        claim.message = cName + ' missed deadline but continues charging';
      }
      else if ( claim.claimStart !== _line.t && prevClaim && prevClaim.card !== claim.card ) {
        claim.message = this.cards[prevClaim.card].name + ' switched cards to ' + cName;
      }
      else if ( prevClaim && claim.chargeNeeded != prevClaim.chargeNeeded ){
        claim.message = cName + ' changed the requested charge';
      } 
      else if ( prevClaim && claim.deadline != prevClaim.deadline ){
        claim.message = cName + ' changed the deadline';
      }
    }, this);
  }
  copyAndFilterClaims( _line, _totalReceived ) {
     _line.claims = _.map(this.claims, claim => {


        // Filter out if not plugged in
        if (!~claim.claimStart) {
          return;
        }

        // Filter out if no more is needed
        if (_totalReceived[claim.claimer] >= claim.chargeNeeded) {
          return;
        }


        let _lineClaim = _.clone(claim);

        if(_lineClaim.deadline < _line.t && _totalReceived[_lineClaim.claimer] <= _lineClaim.chargeNeeded){
          //_lineClaim.deadline++;
          _lineClaim.overdue = true;
        }

        // Filter out if past deadline
        // if (claim.deadline < _line.t) {
        //   return;
        // }

        return _lineClaim;

      });

      _line.claims = _.without(_line.claims, undefined);
  }

  /*
  * Stress is calculated looking at total charge available until deadline.
  * Dividing this based on priority.
  * So now it assumes for every claimer X that the other claimers will also charge until 
  * claimer X's deadline.
  */

  calculateStress(_line, _totalReceived) {
    const _totalPriority = _.reduce(_line.claims, (_tot, _c) => _tot + _c.priority, 0);

    _.each(_line.claims, _claim => {
      let _recv = _totalReceived[_claim.claimer] || 0;
      let totalAvailable = this.calculateAvailableCharge( _line.t, _claim.deadline);
      _claim.available = totalAvailable * ( _claim.priority / _totalPriority ); 
      //_claim.stress = ( _claim.chargeNeeded - _recv ) / _claim.available;
  

      //if stress > 1, means there is more available than you need
      //if stress < 1, means there is way less available than you need.
      //cap it to 20, because reasons.
      _claim.stress =  _.min([_maxStress,Math.ceil(( _claim.chargeNeeded - _recv ) / _claim.available)]);

    });
  }
  
  calculateAvailableCharge(_start, _end) {
    return _.reduce(this.lines, (t, v, i) => ( i >= _start && i <= _end )? t + v.pixels.length: t, 0);
  }


  combinedToPixelsNeeded(_line, _totalReceived){
    const _totalPriority = _.reduce(_line.claims, (_tot, _c) => _tot + _c.priority, 0);
    const _totalStress =  _.reduce(_line.claims, (_tot, _c) => _tot + _c.stress, 0);


    _.each(_line.claims, _claim => {
      // _claim.pixels = 
      //   Math.round(
      //     _claim.stress / _totalStress * (_line.pixels.length/3*1) +
      //     _claim.priority / _totalPriority * (_line.pixels.length/3*2)
          
      //   )


      //made simplified version.
      _claim.pixels = Math.round(
        (_claim.stress + 2 * _claim.priority) / (_totalStress + 2 * _totalPriority) * _line.pixels.length
      );

      // Make sure a claimer doesn't take more than needed
      // before the charge would be divided by line,
      // now there can also be leftovers and half lines
      let received = _totalReceived[_claim.claimer];
      received = received ? received : 0;
      let needed = _claim.chargeNeeded - received;
      if( _claim.pixels > needed ) {
        _claim.pixels = needed;
        _claim.stress = 0;
      }
    });
  }

  

  checkLeftoversStress( _line ) {
    
      // Check if there is discrepancy bc of rounding
      let pixelsNeeded = this.getPixelsNeeded(_line.claims);
      let diff = _line.pixels.length - pixelsNeeded;
      let oldDiff = diff;

      // If more pixels needed than available
      // (due to rounding) remove low prio pixels

      while (_line.claims.length > 1 && diff < 0) {
        //subtract from lowest priority;
        let lowestStress = _.min(_line.claims, function (c) {
          return c.stress;
        }).stress;

        _.each(_line.claims, function (c) {
          if (diff < 0 && c.stress === lowestStress) {
            c.pixels--;
            diff++;
          }
        });
      }

      // If more pixels available then needed
      // deal out to highest prio
      while (_line.claims.length > 1 && diff > 0) {
        let highestStress = _.max(_line.claims, function (c) {
          return c.stress;
        }).stress;
        _.each(_line.claims, function (c) {
          if (diff > 0 && c.stress === highestStress) {
            c.pixels++;
            diff--;
          }
        });
      }

      let newDiff = _line.pixels.length - this.getPixelsNeeded(_line.claims);

      if (oldDiff != 0) {
        // console.log(_line.t + " - needed:" + pixelsNeeded + " avlbl:" + _line.pixels.length + " diff:" + oldDiff + " newDiff:" + newDiff);
      }
  }

   getPixelsNeeded(claims) {
    return _.reduce(claims, function (total, c) {
      return total + c.pixels;
    }, 0);
  }

   updateTotalReceived( _line, _totalReceived, _isFirst ) {
    _.each(_line.claims, function (_c) {
      if (_isFirst) {
        _totalReceived[_c.claimer] = 0;
      }

      _totalReceived[_c.claimer] += _c.pixels;
      _c.chargeReceived = _totalReceived[_c.claimer];

      // check if this claimer is done charging
      if ( _c.chargeReceived >= _c.chargeNeeded ) {
        this.claims[_c.claimer].predictedClaimEnd = _line.t;
      }
    }, this);
  }
  
  fillPixels( _line ) {
    _line.pixels.fill(-1);
  
    _.reduce(_line.claims, function (_fillIndex, _c) {
      _line.pixels.fill(_c.claimer, _fillIndex, _fillIndex + _c.pixels);
      return _fillIndex + _c.pixels;
    }, 0);
  }

  //visualization
  onUpdate (_callback) {
    //only one accomidates for one callback... shoddy solution... sorry for this.
    this.onUpdateCallbacks.push(_callback);
  }

  update () {
    //do things
    _.each(this.onUpdateCallbacks, function(onUpdateCallback){
      if (typeof onUpdateCallback === "function") {
        onUpdateCallback();
      }
    })
    

    //render function of tetris might be obsolete if swarm does this trick.
    this.debugRender();
  }

  onUnplug( _cb ) {
    this.onUnplugCallback = _cb;
  }
  onPlugin (_cb) {
    console.log(">> tetris: set callback for onPlugin")
    this.onPlugInCallback = _cb;
  }
  printClaims() {
    //print the current claims
    _.each(this.claims, function (claim, n) {
      $('.form' + claimers[n] + ' .debug').html(JSON.stringify(claim));
    })  
  }
  debugRender () {
    this.printClaims();

    $(this.element).empty();
    
    let htmlStr = '';

    //let lowIndex = _.findIndex(this.lines, line => line.t === this.now, this);
    //lowIndex = ~lowIndex ? lowIndex : 0;
    let lowIndex = 0;

    //let highIndex = Math.min( lowIndex + GRID_HEIGHT, this.lines.length - 1);
    let highIndex = this.lines.length - 1;

    for (let i = highIndex; i >= lowIndex; i--) { //render lines
      let line = this.lines[i];
      let pixels = line.pixels;
      let nowClass = (line.t === this.now )? 'now':'';
      htmlStr += '<tr class="'+nowClass+'"><td>' + i + '</td><td>' + line.t + '</td>';
      
      for (let j = 0; j < 3; j++){
        let foundClaim = _.find(line.claims, c => c.claimer === j)
        if ( foundClaim ) {
          htmlStr += '<td>';
          htmlStr += foundClaim.chargeReceived + '|' + foundClaim.available.toFixed(2) + '|' + foundClaim.stress.toFixed(2) + '|' + (foundClaim.overdue?'O':'-');
          if ( foundClaim.message ) 
            htmlStr += '<br/><span class="message">'+foundClaim.message+'</span>';
          htmlStr += '</td>';
        } else {
          htmlStr += '<td> - </td>';
        }
      }

      htmlStr += '<td>';
      for (let j = 0; j < pixels.length; j++) { //render pixels
        let pixel = '.';
        if (pixels[j] > -1) {
          pixel = claimers[pixels[j]];
          
          let overdue = this.isOverdue(line.claims, pixels[j], line.t) ? ' overdue':'';

          if (this.isfullyCharged(line.claims, pixels[j])) {
            pixel = '<span class="pixel pixel'+ pixel + overdue + '" style="color:white">' + pixel + '</span>';
          
          } else {
            pixel = '<span class="pixel pixel' + pixel + overdue + '">&nbsp;</span>';
          
          }
        }
        //$(this.element).append('<span class="pixel">' + pixel + '</span>');
        htmlStr += pixel;
      }
      htmlStr += '</td></tr>';
      //$(this.element).append('<br>'); //clear line
    }
    $(this.element).html( htmlStr );
  }
  isOverdue(claims, claimer, time) {
      return !!_.find(claims, function(c) {
        return c.claimer == claimer && c.overdue;
      });
  }
   hasReachedDeadline (claims, claimer, time) {
    return !!_.find(claims, function (c) {
      return c.claimer == claimer && time == c.deadline;
    });
  }
   isfullyCharged  (claims, claimer) {
    return !!_.find(claims, function (c) {
      return c.claimer == claimer && c.chargeReceived >= c.chargeNeeded;
    });
  }
}
