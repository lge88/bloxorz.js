
(function() {
  var bloxorz = require( 'bloxorz.js' );
  bloxorz.stages.push({
    level: 0,
    start: { x: 0, y: 0 },
    goal: { x: 0, y: 0 },
    tiles: [
      { x: -1, y: -2, type: 'Normal' },
      { x: -1, y: -1, type: 'Normal' },
      { x: -1, y: 0, type: 'Normal' },
      { x: -1, y: 1, type: 'Normal' },
      { x: -1, y: 2, type: 'Normal' },
      { x: 0, y: -2, type: 'Normal' },
      { x: 0, y: -1, type: 'Normal' },
      { x: 0, y: 0, type: 'Normal' },
      { x: 0, y: 1, type: 'Normal' },
      { x: 0, y: 2, type: 'Normal' },
      { x: 1, y: -1, type: 'Normal' },
      { x: 1, y: 0, type: 'Normal' },
      { x: 1, y: 1, type: 'Normal' },
      { x: 2, y: -1, type: 'OrangeTile' },
      { x: 3, y: -1, type: 'OrangeTile' },
      { x: 3, y: 3, type: 'Goal' }
    ]
  });
})();
