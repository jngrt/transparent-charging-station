'use strict'

const Tetris = function () {

  let height;
  let width;
  let element;
  let start;
  let now;
  let minWidth;
  let lines = [];
  this.lines = lines;
  let claims = [];
  let onUpdateCallback;

  this.init = function (_start, _element, _height, _width, _minWidth) {

    start = _start || 0;
    element = _element || '#tetris';
    height = _height || 12;
    width = _width || 15;
    minWidth = _minWidth || Math.round(width / 3);
    now = start;

    claims.length = 0;

    //is there a previous Tetris? //restore from last session
    //if not: create the first tetris
    _.times(height * linesPerHour, createLine);
    console.log(lines);
    update();

  }

  const createLine = function (_lineTime) {

    if (typeof _lineTime == 'undefined') {
      _lineTime = lines.length || 0;
    }

    //add random variations to width
    const prev = lines.length ? _.last(lines).pixels.length : 0;
    const lineLength = prev ?
      _.random(minWidth, width) :
      _.random(
        Math.max(minWidth, prev - 1),
        Math.min(width, prev + 1)
      );

    //add line
    const line = {
      t: _lineTime,
      meta: {},
      pixels: Array(lineLength).fill(0)
    };
    lines.push(line);
  }

  //claiming algorihm
  this.addClaim = function (claimer, priority, chargeNeeded, deadline, info) {

    //we're not checking for a double claim. If this claimer was still claiming, we need to remove the previous claim.
    claims = _.reject(claims, function (claim) {
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
  let processClaims = function () {

    //print the current claims
    $('.claims').empty();
    _.each(claims, function (claim) {
      $('.claims').append(JSON.stringify(claim)).append('<br>');
    })

    //we process the claims per line.
    let totalReceived = {};
    _.each(lines, function (line, lineNo) {

      let pixels = line.pixels;
      let totalPriority = 0;

      //Copy claims for this line
      // filter out past deadlines (_.without)
      line.claims = _.map(claims, function (claim) {

        // Filter out if past deadline
        if (claim.deadline < line.t) {
          return;
        }

        // Filter out if no more is needed
        if (totalReceived[claim.claimer] >= claim.chargeNeeded) {
          return;
        }

        totalPriority += claim.priority;
        return _.clone(claim);

      });

      line.claims = _.without(line.claims, undefined);

      // Calculate pixels based on priority
      _.each(line.claims, function (claim) {
        claim.pixels = Math.round(claim.priority / totalPriority * pixels.length);
      });


      // Check if there is discrepancy bc of rounding
      let pixelsNeeded = getPixelsNeeded(line.claims);
      let diff = pixels.length - pixelsNeeded;
      let oldDiff = diff;

      // If more pixels needed than available
      // (due to rounding) remove low prio pixels

      while (line.claims.length > 1 && diff < 0) {
        //subtract from lowest priority;
        let lowestPrio = _.min(line.claims, function (c) {
          return c.priority;
        }).priority;

        _.each(line.claims, function (c) {
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
        let highestPrio = _.min(line.claims, function (c) {
          return c.priority;
        }).priority;
        _.each(line.claims, function (c) {
          if (diff > 0 && c.priority == highestPrio) {
            c.pixels++;
            diff--;
          }
        });
      }

      let newDiff = pixels.length - getPixelsNeeded(line.claims);

      if (oldDiff != 0) {
        console.log(
          lineNo + " - needed:" + pixelsNeeded + " avlbl:" + pixels.length + " diff:" + oldDiff + " newDiff:" + newDiff);
      }

      // Keep track of how much charge is received
      _.each(line.claims, function (c) {
        if (!lineNo) {
          totalReceived[c.claimer] = 0;
        }

        totalReceived[c.claimer] += c.pixels
        c.chargeReceived = totalReceived[c.claimer];


      });

      // Translate the claims to the pixels
      let fillIndex = 0;
      pixels.fill(0);
      _.each(line.claims, function (c) {

        let start = fillIndex;
        let end = start + c.pixels;

        pixels.fill(c.claimer, start, end);

        fillIndex = end;
      });
    })

    console.log(claims);
    update();

  }

  function getPixelsNeeded(claims) {
    return _.reduce(claims, function (total, c) {
      return total + c.pixels;
    }, 0);
  }

  //process line

  //...

  //visualization
  this.onUpdate = function (_callback) {
    //only one accomidates for one callback... shoddy solution... sorry for this.
    onUpdateCallback = _callback;
  }

  let update = function () {
    //do things
    if (typeof onUpdateCallback === "function") {
      onUpdateCallback(tetris);
    }

    //render function of tetris might be obsolete if swarm does this trick.
    render();
  }
  let render = function () {
    $(element).empty();
    for (let i = lines.length - 1; i >= 0; i--) { //render lines
      let line = lines[i];
      let pixels = line.pixels;
      $(element).append('<i>' + (("0" + i).slice(-2)) + ':' + line.t + ':</i>');
      for (let j = 0; j < pixels.length; j++) { //render pixels
        let pixel = '♢';
        if (pixels[j] > 0) {
          pixel = claimers[pixels[j] - 1];
          if (fullyCharged(line.claims, pixels[j])) {
            pixel = '<span style="color:green">' + pixel + '</span>';
          } else if (deadlineReached(line.claims, pixels[j], line.t)) {
            pixel = '<span style="color:red">' + pixel + '</span>';
          } else {
            pixel = '<span style="color:' + 
            ['lightgrey','grey','black'][pixels[j]-1] + 
            '">' + pixel + '</span>';
          }
        }
        $(element).append('<span class="pixel">' + pixel + '</span>');
      };
      $(element).append('<br>'); //clear line
    };
  }
  let deadlineReached = function (claims, claimer, time) {
    return !!_.find(claims, function (c) {
      return c.claimer == claimer && time == c.deadline;
    });
  }
  let fullyCharged = function (claims, claimer) {
    return !!_.find(claims, function (c) {
      return c.claimer == claimer && c.chargeReceived >= c.chargeNeeded;
    });
  }
}