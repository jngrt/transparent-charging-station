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

    start = _start || new Date().getHours();
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
      deadline: deadline
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
    _.each(lines, function(line) {

      var pixels = line.pixels;
      var lineClaims;
      var totalStrength = 0;


      //Copy claims and calculate claim strengths
      // filter out past deadlines
      lineClaims = _.map(claims, function(claim) {

        // Filter out if past deadline
        if (claim.deadline < line.t) {
          return;
        }

        //TODO calculate claimstrength
        // here we should have logic for dividing based on parameters
        var strength = claim.priority;

        totalStrength += strength;


        return {
          strength: strength,
          claimer: claim.claimer,
          priority: claim.priority,
          chargeNeeded: claim.chargeNeeded,
          deadline: claim.deadline
        };
      });
      lineClaims = _.without(lineClaims, undefined);
      line.claims = lineClaims;


      // Calculate pixels based on claimstrength
      _.each(lineClaims, function(claim) {
        claim.pixels = Math.round(claim.strength / totalStrength * pixels.length);
      });


      // Check if there is discrepancy bco rounding
      var pixelsNeeded = getPixelsNeeded(lineClaims);
      var diff = pixels.length - pixelsNeeded;
      var oldDiff = diff;

      // If more pixels needed than available
      // (due to rounding) remove low prio pixels

      while (lineClaims.length > 1 && diff < 0) {
        //subtract from lowest priority;
        var lowestPrio = _.min(lineClaims, function(c) {
          return c.priority;
        }).priority;

        _.each(lineClaims, function(c) {
          if (diff < 0 && c.priority == lowestPrio) {
            c.pixels--;
            diff++;
          }
        });
      }

      // If more pixels available then needed
      // deal out to highest prio
      while (lineClaims.length > 1 && diff > 0) {
        //subtract from lowest priority;
        var highestPrio = _.min(lineClaims, function(c) {
          return c.priority;
        }).priority;
        _.each(lineClaims, function(c) {
          if (diff > 0 && c.priority == highestPrio) {
            c.pixels++;
            diff--;
          }
        });
      }

      var newDiff = pixels.length - getPixelsNeeded(lineClaims);

      if (oldDiff != 0) {
        console.log(
          curLine + " - needed:" + pixelsNeeded + " avlbl:" + pixels.length + " diff:" + oldDiff + " newDiff:" + newDiff);
			}

      // Translate the claims to the pixels
      var fillIndex = 0;
      pixels.fill(0);
      _.each(lineClaims, function(c) {

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
      var line = lines[i].pixels;
      $(element).append('<i>' + (("0" + i).slice(-2)) + ':' + lines[i].t + ':</i>');
      for (var j = 0; j < line.length; j++) { //render pixels
        var pixel = '♢';
        if (line[j] > 0)
          pixel = claimers[line[j] - 1];
        $(element).append('<span class="pixel">' + pixel + '</span>');
      }
      ;
      $(element).append('<br>'); //clear line
    }
    ;
  }
}
