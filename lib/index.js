var extend = require( 'extend' );
var THREE = require( 'three' );
var Emitter = require( 'emitter' );
var Tween = require( 'tween' );
var attach = THREE.SceneUtils.attach;
var detach = THREE.SceneUtils.detach;
var raf = require( 'raf' );

function Game() {
  document.body.style.margin = '0px';
  document.body.style.padding = '0px';
  document.body.style.overflow = 'hidden';

  var container = this.container =  document.createElement( 'div' );
  container.style.position = 'absolute';
  container.style.left = '0px';
  container.style.right = '0px';
  container.style.top = '0px';
  container.style.bottom = '0px';

  document.body.appendChild( container );

  var scene = this.scene = new THREE.Scene();

  var camera = this.camera = new THREE.PerspectiveCamera(
    50,
    container.offsetWidth / container.offsetHeight,
    1,
    10000
  );
  camera.position.set( -6, -10, 10 );
  camera.up.set( 0, 0, 1 );
  camera.lookAt( new THREE.Vector3() );

  var light = new THREE.DirectionalLight( 0xffffff, 0.6 );
  light.position.set( 1, 1, 1 ).normalize();
  scene.add( light );

  light = new THREE.DirectionalLight( 0xffffff, 0.6 );
  light.position.set( -1, -1, 1 ).normalize();
  scene.add( light );

  light = new THREE.AmbientLight( 0x111111 );
  scene.add( light );

  var renderer = this.renderer = new THREE.WebGLRenderer( { antialias: true } );
  renderer.setSize( container.offsetWidth, container.offsetHeight );
  renderer.setClearColor( 0xffbbbb );
  // renderer.autoClear = false;
  // renderer.autoUpdateScene = false;

  var canvas = this.canvas = renderer.domElement;
  canvas.className = 'bloxorz-canvas';
  container.appendChild( canvas );

  this.controller = new GameControls( this );
}

Game.prototype.loadStage = function( stage ) {
  var tiles = stage.tiles;
  var start = stage.start;
  var scene = this.scene;

  Array.isArray( tiles ) || ( tiles = [] );
  var map = this.map = new GameMap( tiles );
  scene.add( map );

  var block = this.block = new Block( start );
  this.blocks = [ this.block ];
  scene.add( block );
  this.controller.setBlock( block );

  this.stage = stage;
  this.start = start;
  this.goal = stage.goal;

  this.render();
};

Game.prototype.render = function() {
  this.renderer.render( this.scene, this.camera );
};

Game.prototype.update = function() {
  this.render();
};

function GameControls( game, block ) {
  this.setBlock( block );
  this.enable();
}

GameControls.prototype.setBlock = function( blk ) {
  this.block = blk;
};

var LEFT_ARROW = 37, UP_ARROW = 38, RIGHT_ARROW = 39, DOWN_ARROW = 40;

GameControls.prototype.enable = function() {
  var _this = this;
  document.addEventListener('keydown', function(event) {
    var blk = _this.block;
    if ( blk ) {
      switch( event.keyCode ) {
      case LEFT_ARROW:
        blk.goLeft();
        break;
      case UP_ARROW:
        blk.goUp();
        break;
      case RIGHT_ARROW:
        blk.goRight();
        break;
      case DOWN_ARROW:
        blk.goDown();
        break;
      default:
      }
    }
  });
};

function cube( dx, dy, dz ) {
  var geo = new THREE.Geometry();
  var dx2 = dx/2, dy2 = dy/2;

  geo.vertices = [
    [ -dx2, -dy2, 0 ],
    [ dx2, -dy2, 0 ],
    [ dx2, dy2, 0 ],
    [ -dx2, dy2, 0 ],
    [ -dx2, -dy2, dz ],
    [ dx2, -dy2, dz ],
    [ dx2, dy2, dz ],
    [ -dx2, dy2, dz ]
  ].map(function( x ) {
    return new THREE.Vector3( x[0], x[1], x[2] );
  });

  geo.faces = [
    [ 0, 2, 1, 0, 0, -1 ],
    [ 0, 3, 2, 0, 0, -1 ],
    [ 4, 5, 6, 0, 0, 1 ],
    [ 4, 6, 7, 0, 0, 1 ],
    [ 1, 2, 6, 1, 0, 0 ],
    [ 1, 6, 5, 1, 0, 0 ],
    [ 0, 4, 7, -1, 0, 0 ],
    [ 0, 7, 3, -1, 0, 0 ],
    [ 0, 1, 4, 0, -1, 0 ],
    [ 1, 5, 4, 0, -1, 0 ],
    [ 2, 3, 7, 0, 1, 0 ],
    [ 2, 7, 6, 0, 1, 0 ]
  ].map(function( x ) {
    var f = new THREE.Face3( x[0], x[1], x[2] );
    f.normal.set( x[3], x[4], x[5] );
    f.vertexNormals.push( f.normal.clone() );
    f.vertexNormals.push( f.normal.clone() );
    f.vertexNormals.push( f.normal.clone() );
    return f;
  });

  // geo.computeBoundingBox();
  // geo.computeBoundingSphere();
  // geo.computeCentroids();
  // geo.computeFaceNormals();
  // geo.computeVertexNormals();
  return geo;
}

function Block( x, y ) {
  THREE.Object3D.call( this );
  var geometry = Block.geometry;
  var material = Block.material;
  var mesh = this.mesh = new THREE.Mesh( geometry, material );
  var ref = this.ref = new THREE.Object3D();

  ref.position.set( 0, -0.5, 0 );

  this.bottomSurface = 0;
  this.bottomSurfaceState = 0;
  this.weight = 2;
  this.postions = [
    { x: x, y: y }
  ];
  this.matrixAutoUpdate = false;
  ref.matrixAutoUpdate = false;
  this.add( mesh );
  this.add( ref );
  this.update();
}
Block.prototype = Object.create( THREE.Object3D.prototype );
Block.prototype.constructor = Block;

// initial edge numbering:
Block.edges = [
  // surface index starts with 1
  null,

  // bottom edges
  [ 0, 1 ],
  [ 1, 2 ],
  [ 2, 3 ],
  [ 3, 0 ],

  // vertical edges
  [ 0, 4 ],
  [ 1, 5 ],
  [ 2, 6 ],
  [ 3, 7 ],

  // top edges
  [ 4, 5 ],
  [ 5, 6 ],
  [ 6, 7 ],
  [ 7, 4 ]
];

// initial surface numbering:
// index starts with 1,
// minus sign is used to represent direction
// All surface normal points inward
// these are 4 states of each surface,
// next state is acquired by rotate the previous surface clock wise
// for example:
// bottom surface from state 0 -> 1 -> 2 -> 3
// [ 1, 2, 3, 4 ] -> [ 2, 3, 4, 1 ] -> [ 3, 4, 1, 2 ] -> [ 4, 1, 2, 3 ]
Block.surfaces = [
  // 0, bottom
  [ 1, 2, 3, 4 ],

  // 1, top
  [ -9, -10, -11, -12 ],

  // 2, front
  [ -1, 5, 9, -6 ],

  // 3, back
  [ -3, 7, 11, -8 ],

  // 4, left
  [ -4, 8, 12, -5 ],

  // 5, right
  [ -2, 6, 10, -7 ]
];

// neighborhoods of each surface are represent by
// the order of adj edges
Block.surfaceNeighborhoods = [
  // bottom
  [ 2, 5, 3, 4 ],

  // top
  [ 2, 5, 3, 4 ],

  // front
  [ 0, 4, 1, 5 ],

  // back
  [ 0, 5, 1, 4 ],

  // left
  [ 0, 3, 1, 2 ],

  // right
  [ 0, 2, 1, 3 ]
];

// times > 0, shift right
// times < 0, shift left
function getRotatedArray( arr, times ) {
  var out = arr.slice(), i = 0;
  if ( times === 0 ) {
    return out;
  }

  times || ( times = 1 );
  if ( times > 0 ) {
    while ( i++ < times ) {
      out.unshift( out.pop() );
    }
  } else {
    var t = -times;
    while ( i++ < t ) {
      out.push( out.shift() );
    }
  }
  return out;
}

// console.log( getRotatedArray( [ 1, 2, 3, 4 ], 2 ) )
// console.log( getRotatedArray( [ 1, 2, 3, 4 ], -2 ) )

Block.prototype._getNextState = function( dir ) {
  var currentBottom = this.bottomSurface;
  var currentSurfaceState = this.bottomSurfaceState;
  var nextBottomSurface, nextSurfaceState;

  var neighbors = Block.surfaceNeighborhoods[ currentBottom ];
  var candidates = getRotatedArray( neighbors, currentSurfaceState );
  nextBottomSurface = candidates[ dir ];

};

// Works!
// TODO: need to figure out by which edge including dir the
// block going to roll
Block.prototype._rollByEdge = function( edgeId ) {
  // get the edge direction vector
  var edge = Block.edges[ Math.abs( edgeId ) ];
  if ( edge ) {
    var vertices = this.mesh.geometry.vertices;
    var from = vertices[ edge[0] ], to = vertices[ edge[1] ];
    from = this.mesh.localToWorld( from );
    to = this.mesh.localToWorld( to );

    // debugger;
    // construct a local coordinate system that has a x axias
    // from -> to
    var ref = this.ref;
    var mat = new THREE.Matrix4();

    var mesh = this.mesh;
    var axis = ( new THREE.Vector3() ).subVectors( to, from );
    if ( edgeId < 0 ) {
      axis.negate();
    }

    mat.makeTranslation(
      (from.x + to.x) / 2,
      (from.y + to.y) / 2,
      (from.z + to.z) / 2
    );
    ref.matrix.copy( mat );

    var xAxis = new THREE.Vector3( 1, 0, 0 );
    var angle = xAxis.angleTo( axis );
    var tol = 1e-5;
    var dir = new THREE.Vector3();
    // edge cases
    if ( Math.abs( angle ) < tol || Math.abs( angle - Math.PI ) < tol ) {
      dir.set( 0, 0, 1 );
    } else  {
      dir.crossVectors(
        xAxis,
        axis
      ).normalize();
    }
    mat.makeRotationAxis( dir, xAxis.angleTo( axis ) );
    ref.matrix.multiply( mat );

    ref.matrixWorldNeedsUpdate = true;
    ref.updateMatrixWorld();

    mesh.applyMatrix( this.matrixWorld );
    var matrixWorldInverse = new THREE.Matrix4();
	matrixWorldInverse.getInverse( ref.matrixWorld );
	mesh.applyMatrix( matrixWorldInverse );
    ref.add( mesh );

    var _this = this;
    var duration = 1000;
    var dtheta = Math.PI/2 / ( duration/60 );
    var dTot = 0;

    function animate() {
      dTot = dTot + dtheta;
      if ( dTot > Math.PI/2 ) {
        dtheta = dtheta - ( dTot - Math.PI/2 );
      }
      mat.makeRotationAxis( xAxis, dtheta );
      ref.matrix.multiply( mat );
      ref.matrixWorldNeedsUpdate = true;
      ref.updateMatrixWorld();
      if ( dTot > Math.PI/2 ) {
        mesh.applyMatrix( ref.matrixWorld );
	    matrixWorldInverse.getInverse( _this.matrixWorld );
	    mesh.applyMatrix( matrixWorldInverse );
        _this.add( mesh );
      } else {
        raf( animate );
      }
    }
    animate();

  }

};

function rotateAroundWorldAxis(object, axis, radians) {
    var rotWorldMatrix = new THREE.Matrix4();
    rotWorldMatrix.makeRotationAxis(axis.normalize(), radians);

    // old code for Three.JS pre r54:
    //  rotWorldMatrix.multiply(object.matrix);
    // new code for Three.JS r55+:
    rotWorldMatrix.multiply(object.matrix);                // pre-multiply

    object.matrix = rotWorldMatrix;

    // old code for Three.js pre r49:
    // object.rotation.getRotationFromMatrix(object.matrix, object.scale);
    // new code for Three.js r50+:
    object.rotation.setEulerFromRotationMatrix(object.matrix);
}

Block.geometry = cube( 1, 1, 2 );
Block.material = new THREE.MeshPhongMaterial( {
  ambient: 0x030303,
  color: 0xBF9D15,
  specular: 0xeeeeee,
  shininess: 5,
  shading: THREE.SmoothShading
} );

Block.prototype.update = function( animate ) {

  if ( animate === true ) {
    // var from = this.rotation;
    // var tween = Tween( from ).to( to ).duration( duration );

  }
};

Block.prototype.isStanding = function() {
  return this.position.z === 0;
};

// dir: 0 -> down, 1 -> right, 2 -> up, 3 -> left
Block.prototype.goDir = function( dir ) {
  // find the edge id;
  var edgeId = dir + 1;
  this._rollByEdge( edgeId );
}

Block.prototype.goLeft = function() {
  this.goDir( 3 );
  // if ( this.isStanding() ) {
  //   var x = this.covered[ 0 ].x;
  //   var y = this.covered[ 0 ].y;
  //   this.covered = [
  //     { x: x - 1, y: y },
  //     { x: x - 2, y: y }
  //   ];
  // } else {
  //   var x = Math.min( this.covered[ 0 ].x, this.covered[ 1 ].x );
  //   var y = this.covered[ 1 ].y;
  //   this.covered = [
  //     { x: x - 1, y: y }
  //   ];
  // }
};

Block.prototype.goRight = function() {
  this.goDir( 1 );
};

Block.prototype.goUp = function() {
  this.goDir( 2 );
};

Block.prototype.goDown = function() {
  this.goDir( 0 );
};

// function Part() {}

function Tile( x, y ) {
  var ctor = this.constructor;
  var material = ctor.material;
  var geometry = ctor.geometry;
  var scale = ctor.scale || 0.95;
  var t = ctor.thickness || 0.4;
  if ( geometry && material ) {
    THREE.Mesh.call( this, geometry, material );
  }
  this.scale.set( scale, scale, scale );
  this.position.setX( x );
  this.position.setY( y );
  this.position.setZ( -t );
}
Tile.scale = 0.95;
Tile.thickness = 0.4;
Tile.geometry = cube( 1, 1, 0.4 );
Tile.material = new THREE.MeshPhongMaterial( {
  ambient: 0x030303,
  color: 0xdddddd,
  specular: 0xeeeeee,
  shininess: 10,
  shading: THREE.SmoothShading
} );

Tile.prototype = Object.create( THREE.Mesh.prototype );
Tile.prototype.constructor = Tile;
Emitter( Tile.prototype );
Tile.prototype.toMesh = function() {
  return this;
};

function GameMap( tiles ) {
  THREE.Object3D.call( this );
  var map = this._map = {};
  var _this = this;
  tiles
    .map(function( t ) {
      var type = t.type;
      var ctor = GameMap.factory[ type ];
      if ( ctor ) {
        if ( !map[ t.x ] ) {
          map[ t.x ] = {};
        }
        map[ t.x ][ t.y ] = new ctor( t.x, t.y );
        return map[ t.x ][ t.y ];
      } else {
        return null;
      }
    }).filter(function( x ) {
      return x != null;
    }).map(function( x ) {
      return x.toMesh();
    }).filter(function( x ) {
      return x != null;
    }).forEach(function( x ) {
      _this.add( x );
    });
}

GameMap.prototype = Object.create( THREE.Object3D.prototype );
GameMap.prototype.constructor = GameMap;

GameMap.prototype.getTile = function( x, y ) {
  return this._map[ x ][ y ];
};


GameMap.factory = {};

GameMap.factory.Normal = Tile;

function OrangeTile() {
  Tile.apply( this, arguments );
}
OrangeTile.prototype = Object.create( Tile.prototype );
OrangeTile.prototype.constructor = OrangeTile;

extend( OrangeTile, Tile );
OrangeTile.material = new THREE.MeshPhongMaterial( {
  ambient: 0x030303,
  color: 0xF5770A,
  specular: 0xF5770A,
  shininess: 10,
  shading: THREE.SmoothShading
} );
GameMap.factory.OrangeTile = OrangeTile;

GameMap.factory.Goal = Goal;

function Goal() {}
Goal.prototype = Object.create( Tile.prototype );
Goal.prototype.constructor = Goal;
Goal.prototype.toMesh = function() { return null; };

exports.Game = Game;
exports.Block = Block;
exports.Tile = Tile;
exports.GameMap = GameMap;
exports.stages = [];
