'use strict'

/*
Two algorithm modes right now:
SIMPLE -> Only looks at priority
STRESS -> Only looks at stress regarding total available charge until deadline.

TODO: algorithm which makes use of both stress and priority
Proposal:
- For each line make a priority based division of all charge up until all deadlines.
- Then calculate stress based on these divisions.
- Then distribute this line partly based on stress partly based on priority.
- Then go to next line and repeat.

*/

const PRIORITY = 'priority';
const STRESS = 'stress';
const COMBINED = 'combined';
const claimers = ['A', 'B', 'C'];

const _maxStress = 50;


class Tetris {

  constructor (_start, _element, _height, _width, _minWidth) {
    this.start = _start || 0;
    this.element = _element || '#tetris';
    this.height = _height || 48;
    this.width = _width || 6;
    this.minWidth = _minWidth || Math.round(this.width / 3);
    this.now = this.start;
    this.lines = [];
    this.claims = [];
    this.onUpdateCallback = null;
    this.algorithm = COMBINED;

  
    _.times( this.height, this.createLine, this);
    console.log(this.lines);
    this.update();
  }

  createLine (_lineTime) {
    if ( _lineTime === void(0)) {
      _lineTime = this.lines.length || 0;
    }

    //add random variations to width
    const prev = (this.lines.length > 0) ? _.last(this.lines).pixels.length : _.random(this.minWidth, this.width);
    const variation = Math.round(_.random(-2,2));
    
    let lineLength = prev + variation;
    if(lineLength <= this.minWidth) lineLength = this.minWidth;
    if(lineLength > this.maxWidth) lineLength = this.maxWidth;
       
    //add line
    const line = {
      t: _lineTime,
      meta: {},
      pixels: Array(lineLength).fill(0)
    };
    this.lines.push(line);
  }

  //claiming algorihm
  addClaim(claimer, priority, chargeNeeded, deadline, info) {

    //we're not checking for a double claim. If this claimer was still claiming, we need to remove the previous claim.
    this.claims = _.reject(this.claims, function (claim) {
      return claim.claimer == claimer
    });

    //now add the new claim to the list
    this.claims.push({
      claimer: claimer,
      priority: priority,
      chargeNeeded: chargeNeeded,
      deadline: deadline,
      chargeReceived: 0,
      claimStart: this.now
    });

    //sort by user
    this.claims = _.sortBy(this.claims, 'claimer');

    //process the claims
    this.processClaims();

  }
  clearLine(){
    //clear line and save it to the record
    //this.updateTotalReceived() ...?
  }
  processClaims () {

    this.printClaims();

    //we process the claims per line.
    let _totalReceived = {};
    _.each(this.lines, function (_line, _lineNo) {

      let _pixels = _line.pixels;

      // copy claims which are applicable for this line
      this.filterLineClaims(_line, _totalReceived);
     
      if( this.algorithm === PRIORITY ) {
        // Turn priority into pixels
        this.priorityToPixelsNeeded( _line );
        // Check for remainders after rounding
        this.checkLeftoversSimple( _line );
      } else if ( this.algorithm === STRESS ) {
        // calculate how much charge is available for each claimer until deadline
        this.calculateStress( _line, _totalReceived );
        this.stressToPixelsNeeded( _line );
        this.checkLeftoversStress( _line );
      } else if ( this.algorithm === COMBINED ) {
        this.calculateStress( _line, _totalReceived );
        this.combinedToPixelsNeeded( _line );
        this.checkLeftoversStress( _line );
      }
    
      // Keep track of how much charge is received up until this line
      this.updateTotalReceived( _line, _totalReceived, _lineNo === 0  );


      // Fill the pixels based on the claims
      this.fillPixels( _line );
      
    }, this)

    // console.log(this.claims);
    this.update();

  }
  printClaims() {
    //print the current claims
    $('.claims').empty();
    _.each(this.claims, function (claim) {
      $('.claims').append(JSON.stringify(claim)).append('<br>');
    })  
  }
  filterLineClaims( _line, _totalReceived ) {
     _line.claims = _.map(this.claims, function (claim) {

        if(claim.deadline < _line.t && _totalReceived[claim.claimer] <= claim.chargeNeeded){
          claim.deadline++;
          claim.overdue = true;
          if(_.has(claim, "originalDeadline")) claim.originalDeadline = true;
        }

        // Filter out if past deadline
        // if (claim.deadline < _line.t) {
        //   return;
        // }

        // Filter out if no more is needed
        if (_totalReceived[claim.claimer] >= claim.chargeNeeded) {
          if(_.has(claim, "overdue")) claim.overdue = false;
          return;
        }

        //totalPriority += claim.priority;
        return _.clone(claim);

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

  priorityToPixelsNeeded(_line) {
    // Calculate pixels based on priority
      const _totalPriority = _.reduce(_line.claims, (_tot, _c) => _tot + _c.priority, 0);

      _.each(_line.claims, _claim => {
        _claim.pixels = Math.round(_claim.priority / _totalPriority * _line.pixels.length);
      });
  }
  stressToPixelsNeeded(_line ) {
    //TODO: use the priority in the stress calculation
    //const _totalPriority = _.reduce(_line.claims, (_tot, _c) => _tot + _c.priority, 0);

    const _totalStress =  _.reduce(_line.claims, (_tot, _c) => _tot + _c.stress, 0);
    _.each(_line.claims, _claim => {
      _claim.pixels = Math.round(_claim.stress / _totalStress * _line.pixels.length);
    });
  }

  combinedToPixelsNeeded(_line){
    const _totalPriority = _.reduce(_line.claims, (_tot, _c) => _tot + _c.priority, 0);
    const _totalStress =  _.reduce(_line.claims, (_tot, _c) => _tot + _c.stress, 0);


    _.each(_line.claims, _claim => {
      // _claim.pixels = 
      //   Math.round(
      //     _claim.stress / _totalStress * (_line.pixels.length/3*1) +
      //     _claim.priority / _totalPriority * (_line.pixels.length/3*2)
          
      //   )

      //made simplified version.
      _claim.pixels = Math.round((_claim.stress + _claim.priority) / (_totalStress + _totalPriority) * _line.pixels.length);
    });
  }

  checkLeftoversSimple( _line ) {
    
      // Check if there is discrepancy bc of rounding
      let pixelsNeeded = this.getPixelsNeeded(_line.claims);
      let diff = _line.pixels.length - pixelsNeeded;
      let oldDiff = diff;

      // If more pixels needed than available
      // (due to rounding) remove low prio pixels

      while (_line.claims.length > 1 && diff < 0) {
        //subtract from lowest priority;
        let lowestPrio = _.min(_line.claims, function (c) {
          return c.priority;
        }).priority;

        _.each(_line.claims, function (c) {
          if (diff < 0 && c.priority === lowestPrio) {
            c.pixels--;
            diff++;
          }
        });
      }

      // If more pixels available then needed
      // deal out to highest prio
      while (_line.claims.length > 1 && diff > 0) {
        //subtract from lowest priority;
        let highestPrio = _.min(_line.claims, function (c) {
          return c.priority;
        }).priority;
        _.each(_line.claims, function (c) {
          if (diff > 0 && c.priority === highestPrio) {
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
        //subtract from lowest priority;
        let highestStress = _.min(_line.claims, function (c) {
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

      _totalReceived[_c.claimer] += _c.pixels
      _c.chargeReceived = _totalReceived[_c.claimer];
    });
  }
  
  fillPixels( _line ) {
    _line.pixels.fill(0);
  
    _.reduce(_line.claims, function (_fillIndex, _c) {
      _line.pixels.fill(_c.claimer, _fillIndex, _fillIndex + _c.pixels);
      return _fillIndex + _c.pixels;
    }, 0);
  }

  //visualization
  onUpdate (_callback) {
    //only one accomidates for one callback... shoddy solution... sorry for this.
    this.onUpdateCallback = _callback;
  }

  update () {
    //do things
    if (typeof this.onUpdateCallback === "function") {
      this.onUpdateCallback();
    }

    //render function of tetris might be obsolete if swarm does this trick.
    this.render();
  }
  render () {
    $(this.element).empty();
    
    let htmlStr = '';

    for (let i = this.lines.length - 1; i >= 0; i--) { //render lines
      let line = this.lines[i];
      let pixels = line.pixels;
      //$(this.element).append('<i>' + (("0" + i).slice(-2)) + ':' + line.t + ':</i>');
      htmlStr += '<tr><td>' + i + '</td><td>' + line.t + '</td>';
      //htmlStr += '<td>Recv</td><td>Avail</td><td>Stress</td><td>Deadline</td>';
      for (let j = 1; j <= 3; j++){
        let foundClaim = _.find(line.claims, c => c.claimer === j)
        if ( foundClaim ) {
          htmlStr += '<td>';
          htmlStr += foundClaim.chargeReceived + ':' + foundClaim.available.toFixed(2) + ':' + foundClaim.stress.toFixed(2);
          htmlStr += '</td>';
        } else {
          htmlStr += '<td> - </td>';
        }

      }
      // _.each(line.claims, _c => {
      //   htmlStr += '<td>';
      //   htmlStr += _c.chargeReceived + ':' + _c.available + ':' + _c.stress;
      //   htmlStr += '</td>';
      // });

      htmlStr += '<td>'
      for (let j = 0; j < pixels.length; j++) { //render pixels
        let pixel = '.';
        if (pixels[j] > 0) {
          pixel = claimers[pixels[j] - 1];
          
          if (this.isfullyCharged(line.claims, pixels[j])) {
            pixel = '<span class="pixel" style="color:green">' + pixel + '</span>';
          
          } else if (this.hasReachedDeadline(line.claims, pixels[j], line.t)) {
            // pixel = '<span class="pixel" style="color:red">' + pixel + '</span>';
            pixel = '<span class="pixel overdue pixel' + pixel + '">&nbsp;</span>';

          
          } else {
            pixel = '<span class="pixel pixel' + pixel + '">&nbsp;</span>';
          
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