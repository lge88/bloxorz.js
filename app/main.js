// var ISEViewport = require( 'ise-viewport' );
// var randomCubes = require( 'three-random-cubes' );
var EditorControls = require( 'ise-editor-controls' );

// var viewport = ISEViewport();

// build scene:
// var cubes = randomCubes().map( function( c ) { viewport.scene.add(c); return c; } );

var bloxorz = require( 'bloxorz.js' );
var game = new bloxorz.Game();
game.loadStage( bloxorz.stages[ 0 ] );
var controls = EditorControls( game.camera, game.container );
var THREE = require( 'three' );

var scene = game.scene;
// scene.add( new THREE.FaceNormalsHelper( game.block, 50 ) )
// scene.add( new THREE.VertexNormalsHelper( game.block, 50 ) )
// bloxorz.Block.material.color.set( 'red' )
setInterval( function() {
  game.render();
}, 1000/60 )
