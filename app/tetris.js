var Tetris = function() {

  var height,
    width,
    element,
    start,
    now;
  var lines = [];
  this.lines = lines;

  var claims = [];


  this.init = function(_start, _element, _height, _width, _minWidth) {

    start = _start || 0;
    element = _element || '#tetris';
    height = _height || 12;
    width = _width || 15;
    minWidth = _minWidth || Math.round(width / 3);
    now = start;


    var onUpdateCallback;



    claims = [];

    //is there a previous Tetris? //restore from last session
    //if not: create the first tetris
    _.times(height * linesPerHour, createLine);
    console.log(lines);
    update();

  }

  var createLine = function(_lineTime) {

    if (typeof _lineTime == 'undefined') {
      _lineTime = lines.length || 0;
    }

    //add random variations to width
    var lineLength = _.random(minWidth, width);
    if (lines.length > 0) {
      var prev = _.last(lines).pixels.length;
      lineLength = _.random(
        Math.max(minWidth, prev - 1),
        Math.min(width, prev + 1)
      );
    }

    //add line
    var line = {
      t: _lineTime,
      meta: {},
      pixels: Array(lineLength).fill(0)
    };
    lines.push(line);
  }

  //claiming algorihm
  this.addClaim = function(claimer, priority, chargeNeeded, deadline, info) {

    //we're not checking for a double claim. If this claimer was still claiming, we need to remove the previous claim.
    claims = _.reject(claims, function(claim) {
      return claim.claimer == claimer
    });

    //now add the new claim to the list
    claims.push({
      claimer: claimer,
      priority: priority,
      chargeNeeded: chargeNeeded,
      deadline: deadline,
      chargeReceived: 0,
      claimStart: now
    });

    //sort by user
    claims = _.sortBy(claims, 'claimer');

    //process the claims
    processClaims();

  }
  var processClaims = function() {

    //print the current claims
    $('.claims').empty();
    _.each(claims, function(claim) {
      $('.claims').append(JSON.stringify(claim)).append('<br>');
    })

    //we process the claims per line.
    var curLine = 0;
    var totalReceived = {};
    _.each(lines, function(line) {

      var pixels = line.pixels;
      var totalStrength = 0;

      //Copy claims and calculate claim strengths
      // filter out past deadlines (_.without)
      line.claims = _.map( claims, function(claim) {

        // Filter out if past deadline
        if (claim.deadline < line.t) {
          return;
        }

        // Filter out if no more is needed
        if ( totalReceived[claim.claimer] >= claim.chargeNeeded){
          return;
        }


        var strength = claim.priority;
        totalStrength += strength;
        return _.extend(claim,{strength:strength});

      });

      line.claims = _.without(line.claims, undefined);

      // Calculate pixels based on claimstrength
      _.each(line.claims, function(claim) {
        claim.pixels = Math.round(claim.strength / totalStrength * pixels.length);
      });


      // Check if there is discrepancy bc of rounding
      var pixelsNeeded = getPixelsNeeded(line.claims);
      var diff = pixels.length - pixelsNeeded;
      var oldDiff = diff;

      // If more pixels needed than available
      // (due to rounding) remove low prio pixels

      while (line.claims.length > 1 && diff < 0) {
        //subtract from lowest priority;
        var lowestPrio = _.min(line.claims, function(c) {
          return c.priority;
        }).priority;

        _.each(line.claims, function(c) {
          if (diff < 0 && c.priority == lowestPrio) {
            c.pixels--;
            diff++;
          }
        });
      }

      // If more pixels available then needed
      // deal out to highest prio
      while (line.claims.length > 1 && diff > 0) {
        //subtract from lowest priority;
        var highestPrio = _.min(line.claims, function(c) {
          return c.priority;
        }).priority;
        _.each(line.claims, function(c) {
          if (diff > 0 && c.priority == highestPrio) {
            c.pixels++;
            diff--;
          }
        });
      }

      var newDiff = pixels.length - getPixelsNeeded(line.claims);

      if (oldDiff != 0) {
        console.log(
          curLine + " - needed:" + pixelsNeeded + " avlbl:" + pixels.length + " diff:" + oldDiff + " newDiff:" + newDiff);
			}

      // Keep track of how much charge is received
      _.each(line.claims, function(c){
        if( !curLine ) {
          totalReceived[c.claimer] = 0;
        }

        totalReceived[c.claimer] += c.pixels
        c.chargeReceived = totalReceived[c.claimer];


      });

      // Translate the claims to the pixels
      var fillIndex = 0;
      pixels.fill(0);
      _.each(line.claims, function(c) {

        var start = fillIndex;
        var end = start + c.pixels;

        pixels.fill(c.claimer, start, end);

        fillIndex = end;
      });


      curLine++;
    })

    console.log(claims);
    update();

  }
  function getPixelsNeeded(claims) {
    return _.reduce(claims, function(total, c) {
      return total + c.pixels;
    }, 0);
  }

  //process line

  //...

  //visualization
  this.onUpdate = function(_callback) {
    //only one accomidates for one callback... shoddy solution... sorry for this.
    onUpdateCallback = _callback;
  }

  var update = function() {
    //do things
    if (typeof onUpdateCallback === "function") onUpdateCallback(tetris);

    //render function of tetris might be absolute if swarm does this trick.
    render();
  }
  var render = function() {
    $(element).empty();
    for (var i = lines.length - 1; i >= 0; i--) { //render lines
      var line = lines[i];
      var pixels = line.pixels;
      $(element).append('<i>' + (("0" + i).slice(-2)) + ':' + line.t + ':</i>');
      for (var j = 0; j < pixels.length; j++) { //render pixels
        var pixel = '♢';
        if (pixels[j] > 0){
          pixel = claimers[pixels[j] - 1];
          if ( fullyCharged(line.claims, pixels[j]) ){
            pixel = '<span style="color:green">' + pixel + '</span>';
          }else if ( deadlineReached(line.claims, pixels[j], line.t) ){
            pixel = '<span style="color:red">' + pixel + '</span>';
          }



        }
        $(element).append('<span class="pixel">' + pixel + '</span>');
      }
      ;
      $(element).append('<br>'); //clear line
    }
    ;
  }
  var deadlineReached = function(claims, claimer, time) {
    return !!_.find(claims,function(c){
      return c.claimer == claimer && time == c.deadline;
    });
  }
  var fullyCharged = function(claims, claimer) {
    return !!_.find(claims,function(c){
      return c.claimer == claimer && c.chargeReceived >= c.chargeNeeded;
    });
  }
}
