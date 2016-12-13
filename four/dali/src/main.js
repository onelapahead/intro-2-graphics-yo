// GameObjects, Materials, and Resources
var defaultMaterial = dali.graphx.GMaterial({
  ambient: [0.1, 0.1, 0.1],
  diffuse: [1.0, 1.0, 1.0],
  specular: [0.8, 0.8, 0.8],
  alpha: 1.0,
  shininess: 32.0,
});

var frogMaterial = dali.graphx.GMaterial({
  ambient: [0.1, 0.3, 0.1],
  diffuse: [0.2, 1.0, 0.2],
  specular: [0.6, 0.8, 0.6],
  alpha: 1.0,
  shininess: 64.0,
});

var treeMaterial = dali.graphx.GMaterial({
  ambient: [0.6, 0.6, 0.6],
  diffuse: [1.0, 1.0, 1.0],
  specular: [0.3, 0.3, 0.3],
  alpha: 1.0,
  shininess: 32.0,
});

var ground;
function GroundGrid(dimensions, step, center, _sections, boxMeshId) {
  var self = dali.Entity({ 
    transform: {
      options: { 
        position: {
          x: center[0], y: center[1], z: center[2]
        }
      }
    }
  });
  self.setType('groundgrid');

  var numX = Math.floor(dimensions.x / step),
      numZ = Math.floor(dimensions.z / step);

  self.snap = function(position) {
    var pair = self.quantize(position.x, position.z);
    pair = self.localize(pair[0], pair[1]);
    position.x = pair[0];
    position.z = pair[2];
  };

  self.quantize = function(x, z) {
    // console.log('x: ' + x + ', z: ' + z);
    var dx = (x - ll.x);
    var dz = (z - ll.z);
    // console.log('dx: ' + dx + ', dz: ' + dz);
    var i = Math.floor(dx / step),
        j = Math.floor(dz / step);
    return [i, j];
  };

  self.localize = function(i, j) {
    var x = ll.x + step * i + step/2,
        z = ll.z + step * j + step/2;
    // console.log('x: ' + x + ', z: ' + z);
    return [x, 0, z]; 
  };

  var sections = _sections;
  var tiles = [];
  var ll = {
    x: center[0] - 0.5 * dimensions.x,
    z: center[2] - 0.5 * dimensions.z,
  };
  var ur = {
    x: center[0] + 0.5 * dimensions.x,
    z: center[2] + 0.5 * dimensions.z
  };

  self.getWorldBounds = function() {
    return {
      'min': ll, 'max': ur
    };
  };

  self.getGridBounds = function() {
    return {
      min: { i: 0, j: 0 }, max: { i: numX, j: numZ } 
    };
  };

  /**
   * Grid consists of "sections", a group of consecutive
   * rows of the same texture and collision action.
   * Sections are defined using their lower z-bound,
   * TODO add box colliders for sections
   */
  var section = sections[0];
  var secPtr = 0, texture, type;
  for (var i = 0; i <= numX; i++) {
    tiles.push([]);
    secPtr = 0;
    section = sections[secPtr++];
    for (var j = 0; j <= numZ; j++) {
      if (j === section.zBound && secPtr < sections.length) {
        section = sections[secPtr++];
      }
      if (secPtr == sections.length && i % 2 == 1) {
        texture = section.texture1;
        type = section.type1;
      } else {
        texture = section.texture;
        type = section.type;
      }

      tiles[i].push(GroundTile(texture, boxMeshId, {
        transform: { 
          options: {
            position: {
              x: ll.x + i * step + step/2,
              y: -0.1,
              z: ll.z + j * step + step/2,
            },
            scale: {
              x: step,
              y: 0.1,
              z: step,
            }
          }
        },
        groundType: type,
      }));
    }
  }

  self.update = function(dt) {
    for (var i = 0; i < numX; i++) {
      for (var j = 0; j < numZ; j++) {
        tiles[i][j]._update(dt);
      }
    }
  };

  self.requestRender = function() {
    for (var i = 0; i < numX; i++) {
      for (var j = 0; j < numZ; j++) {
        tiles[i][j]._requestRender();
      }
    }
  };

  return self;
}

function GroundTile(textureUrl, meshId, options) {
  var self = dali.Entity(options);
  self.setType('groundtile');
  self.setType(options.groundType);

  var texture = dali.graphx.g3D.Texture({
      url: textureUrl
  });
  var model = dali.graphx.g3D.Model({
    meshId: meshId,
    eTransform: self.transform,
    skinDepth: vec3.fromValues(1.0, 1.0, 1.0),
  });

  var renderer = dali.graphx.g3D.Renderable3D({
    'material': defaultMaterial,
    'texture': texture,
    'model': model
  });

  // TODO collision rxn

  self.addRenderable(renderer);

  var collider = dali.physx.BoxCollider();
  var body = dali.physx.EntityBody(self, {
    material: defaultPhysicsMaterial,
    mass: 0,
    type: CANNON.Body.STATIC,
    model: model,
    collider: collider,
  });
  body.transform.collisionResponse = false;

  return self;
}

const GRAVITY = -15.0;
const GROUND_HEIGHT = -0.1;
const JUMP_TIME = 0.5;
const JUMP_HEIGHT = 0.7;
const NUM_JUMP_SOUNDS = 4;

function Frog(meshId, options) {
  var self = dali.Entity(options);
  self.setType('frog');

  var mat = frogMaterial;
  var texture = defaultMaterial;
  var model = dali.graphx.g3D.Model({
    meshId: meshId,
    eTransform: self.transform,
    skinDepth: vec3.fromValues(0.8, 0.8, 0.4),
    // print: true,
  });

  var renderer = dali.graphx.g3D.Renderable3D({
    'material': mat,
    'texture': texture,
    'model': model
  });

  self.addRenderable(renderer);

  var collider = dali.physx.BoxCollider();
  var body = dali.physx.EntityBody(self, {
    material: defaultPhysicsMaterial,
    initVel: new CANNON.Vec3(0, 0, 0),
    print: true,
    mass: 1,
    model: model,
    collider: collider,
    linDamp: 0.1,
  });

  var pos = self.transform.getPosition();
  ground.snap(pos);
  var pair = ground.quantize(pos.x, pos.z);
  var coord = {
    i: pair[0],
    j: pair[1]
  };
  var initPos = new CANNON.Vec3();
  initPos.copy(self.transform.getPosition());
  delete pair;
  pos = null;
  delete pos;

  self.enabled = false;
  self.jumping = false;

  var groundMax = ground.getGridBounds().max;
  var keyMap = new Map();

  var keys = [
    'KeyW',
    'KeyA',
    'KeyS',
    'KeyD'
  ];

  function updateIJ() {
    var position = self.transform.getPosition();
    var pair = ground.quantize(position.x, position.z);
    coord.i = pair[0], coord.j = pair[1];
    position = null;
    delete position;
    delete pair;
  }

  function updatePosition() {
    console.log('i: ' + coord.i + ', j: ' + coord.j);
    var pair = ground.localize(coord.i, coord.j);
    var position = self.transform.getPosition();
    position.x = pair[0];
    position.z = pair[2];
    position = null;
    delete position;
    delete pair;
  }

  for (var ki = 0; ki < keys.length; ki++) {
    keyMap.set(keys[ki], false);
  }

  var keyCode, timeAtJump;
  function handlePressDown(code) {
    if (!self.jumping) {
      var axis, next;

      if (code == 'KeyW' && coord.j < groundMax.j - 1) {
        axis = 'z';
        next = 1;
      } else if (code == 'KeyA' && coord.i > 0) {
        axis = 'x';
        next = -1;
      } else if (code == 'KeyS' && coord.j > 0) {
        axis = 'z';
        next = -1;
      } else if (code == 'KeyD' && coord.i < groundMax.i - 1) {
        axis = 'x';
        next = 1;
      } else return ;

      if (axis != null && next != null) {
        updateIJ();
        var jumpImpulse = jump(axis, next);
        var entityPos = self.transform.getPosition();
        entityPos.y += 0.01;
        body.transform.applyImpulse(jumpImpulse, entityPos);
        axis = (axis === 'x') ? 'z' : 'x';
        body.transform.velocity[axis] = 0.0;
        self.jumping = true;
        timeAtJump = performance.now();
      }

    }
  }

  var jumpSoundPtr = 0;
  const JUMP_Y = 2 * (JUMP_HEIGHT / JUMP_TIME) - (GRAVITY * JUMP_TIME * JUMP_TIME / 4);
  function jump(axis, next) {
    var clip = dali.resources.ResourceManager.main.getResource(HOST_DIRECTORY + 'FrogJump.mp3' + jumpSoundPtr);
    jumpSoundPtr = (jumpSoundPtr+1) % NUM_JUMP_SOUNDS;
    clip.getAudio().play();
    var impulse = new CANNON.Vec3();

    var coordAxis = (axis === 'x') ? 'i' : 'j';
    
    var nextCoord = {
      i: coord.i,
      j: coord.j,
    };
    nextCoord[coordAxis] += next;

    // console.log(coord);
    // console.log(nextCoord);

    var nextPos = ground.localize(nextCoord.i, nextCoord.j);
    nextPos = new CANNON.Vec3(nextPos[0], nextPos[1], nextPos[2]);
    var pos = self.transform.getPosition();

    // console.log(nextPos);
    // console.log(pos);

    var dx = nextPos[axis] - pos[axis];
    // if (dx < 0) dx -= 0.1;
    // if (dx > 0) dx += 0.1;
    impulse[axis] = dx / JUMP_TIME;
    impulse.y = JUMP_Y;
    // console.log(impulse);
    return impulse;
  }

  var dead = false, won = false;
  body.transform.addEventListener('collide', function(event) {
    if (event.body != null && event.target != null && event.body.entity != null && event.target.entity != null) {

      var targetType = event.target.entity.getType();
      var bodyType = event.body.entity.getType();
      
      console.log('Body: ' + bodyType);
      console.log('Target: ' + targetType);

      if (targetType === 'frog' && !transitioning) {

        if (bodyType === 'car') {
          dali.resources.ResourceManager.main
            .getResource(HOST_DIRECTORY + 'CarDeath.mp3')
            .getAudio().play();
        } else if (bodyType === 'water') {
          dali.resources.ResourceManager.main
            .getResource(HOST_DIRECTORY + 'WaterDeathNoice.mp3')
            .getAudio().play();
        } else if (bodyType === 'fire') {
          dali.resources.ResourceManager.main
            .getResource(HOST_DIRECTORY + 'FireCracking.mp3')
            .getAudio().play();
        } else if (bodyType === 'win') {
          dali.resources.ResourceManager.main
            .getResource(HOST_DIRECTORY + 'WinSound.mp3')
            .getAudio().play();
        }

        if (bodyType === 'car' || bodyType === 'fire' || bodyType ==='water') {
          dead = true;
        } else if (bodyType === 'win') {
          won = true;
        }


      }
    }
  });

  self.addEventListener('keydown', function(event) {
    if (keyMap.has(event.code) && !keyMap.get(event.code)) {
      keyMap.set(event.code, true);
      if (!dali.pause) {
        keyCode = event.code;
      }
    }
  });

  self.addEventListener('keyup', function(event) {
    if (keyMap.has(event.code) && keyMap.get(event.code)) {
      keyMap.set(event.code, false);
    }
  });

  var bounds = ground.getWorldBounds();
  self.update = function(dt) {
    if (keyCode != null && self.enabled) {
      handlePressDown(keyCode);
    }
    keyCode = null;

    updateIJ();

    if (self.jumping && (performance.now() - timeAtJump) / 1000 >= JUMP_TIME) {
      // console.log(body.transform.velocity);
      self.jumping = false;
      // updateIJ();
      updatePosition();
    }

    var pos = self.transform.getPosition();
    if (pos.x < bounds.min.x || pos.x > bounds.max.x || pos.z > bounds.max.z || pos.z < bounds.min.z)
      die();

    if (dead) {
      die();
      dead = false;
    }

    if (won) {
      win();
      won = false;
    }
  };

  self.reset = function() {
    transitioning = false;
  };

  var transitioning = false;
  var deaths = 0, points = 0;
  var scoreboard = document.getElementById('scoreboard');
  function die() {
    self.transform.setPosition(initPos);
    updateIJ();
    dali.pause = true;
    body.transform.velocity = new CANNON.Vec3();
    deaths++;
    makeScoreboardText();
    transitioning = true;
    alert('You died! Press ESC to unpause.');
  };

  function win() {
    self.transform.setPosition(initPos);
    updateIJ();
    dali.pause = true;
    body.transform.velocity = new CANNON.Vec3();
    points++;
    makeScoreboardText();
    transitioning = true;
    alert('You won! Press ESC to unpause');
  }

  function makeScoreboardText() {
    scoreboard.innerHTML = `
      <p>Deaths: ${deaths}     Wins: ${points}</p>
    `;
  }
  makeScoreboardText();

  return self;
}

function Generator(generate, timeLow, timeHigh, options) {
  var self = dali.Entity(options);
  self.setType('generator');

  ground.snap(self.transform.getPosition());

  var elapsed = timeHigh;
  self.update = function(dt) {
    elapsed += dt;

    // TODO get better random number generator
    if (elapsed > timeLow && Math.random() < ((elapsed - timeLow) / (timeHigh - timeLow))) { // lerp likelihood
      // console.log('elapsed: ' + elapsed);
      elapsed = 0.0;
      generate(self.transform);
    }

  };

  return self;
}

var carCount = 0;
function Mover(axis, meshId, _speed, options) {
  var self = dali.Entity(options);

  var speed = _speed;

  var texture;
  if (options != null && options.textureUrl != null && dali.isString(options.textureUrl))
    texture = dali.graphx.g3D.Texture({ url: options.textureUrl });
  else if (options.textureCreater != null && dali.isFunction(options.textureCreater)){
    texture = options.textureCreater();
  } else {
    texture = dali.graphx.g3D.Texture({
      r: Math.random() * 255, g: Math.random() * 255, b: Math.random() * 255, a: 255
    });
  }
  var model = dali.graphx.g3D.Model({
    meshId: meshId,
    eTransform: self.transform,
    skinDepth: options.skinDepth,
  });

  options = options || {};
  var renderer = dali.graphx.g3D.Renderable3D({
    'material': options.material || defaultMaterial,
    'texture': texture,
    'model': model
  });

  self.addRenderable(renderer);

  var vel = new CANNON.Vec3();
  vel[axis] = _speed;
  var collider = dali.physx.BoxCollider();
  var body = dali.physx.EntityBody(self, {
    initVel: vel,
    material: defaultPhysicsMaterial,
    mass: 0,
    // print: carCount == 0,
    print: true,
    type: CANNON.Body.KINEMATIC,
    model: model,
    collider: collider,
  });

  self.getBody = function() { return body; };

  // var updater = (function() {
  //   var _self = dali.Updatable();

  //   _self.update = function(dt) {
  //     var pos = self.transform.getPosition();
  //     pos[axis] += dt * speed;
  //   };

  //   return _self;
  // }) ();
  // self.addUpdatable(updater);
  return self;
}

function Log(axis, meshId, _speed, options) {
  var sign = _speed < 0 ? -1 : 1;
  var dir = Math.random() < 0.5 ? -1 : 1;
  options = options || {};
  options.material = treeMaterial;
  options.transform = options.transform || {};
  options.transform.options = options.transform.options || {};
  options.transform.options.axes = {
    z: dir * 90,
    x: 90
  };
  options.skinDepth = vec3.fromValues(0.2, 0.9, 0.6);
  options.textureCreater = function() {
    return dali.graphx.g3D.Texture({
      r: 195, g: 131, b: 76, a: 255
    });
  };

  var self = Mover(axis, meshId, _speed, options);
  self.setType('log');

  var vel = new CANNON.Vec3();
  vel[axis] = _speed;

  // self.getBody().transform.collisionResponse = false;

  return self;
}

function Car(axis, meshId, _speed, options) {
  var sign = _speed < 0 ? -1 : 1;
  options = options || {};
  options.transform = options.transform || {};
  options.transform.options = options.transform.options || {};
  options.transform.options.axes = {
    y: sign * 90,
  };
  options.skinDepth = vec3.fromValues(0.9, 0.8, 0.8);

  var self = Mover(axis, meshId, _speed, options);
  self.setType('car');
  var collider = dali.physx.BoxCollider();

  self.getBody().transform.collisionResponse = false;

  return self;
}

const HOST_DIRECTORY = "http://brix4dayz.github.io/img/frogger/";
var resources = {
  img: [
    'asphalt_texture407.jpg',
    'grass-textures.jpg',
    'water.jpg',
    'fire.jpg',
    // 'http://brix4dayz.github.io/img/profile.png', // CORS test
    // 'img/HandleTex.png',
    // 'img/w3.jpg'
  ],
  text: [
    // 'meta/test.json',
    'DoubleDamageFrog.obj',
    'Lincoln.obj',
    'tree.obj',
    // src: https://www.models-resource.com/pc_computer/roblox/model/12873/
  ],
  audio: [
    { cache: NUM_JUMP_SOUNDS, url: 'FrogJump.mp3'},
    'CarDeath.mp3',
    'WaterDeathNoice.mp3',
    'FireCracking.mp3',
    'WinSound.mp3',
  ],
};

for (var i = 0; i < resources.img.length; i++) {
  resources.img[i] = HOST_DIRECTORY + resources.img[i];
}

for (var i = 0; i < resources.text.length; i++) {
  resources.text[i] = HOST_DIRECTORY + resources.text[i];
}

for (var i = 0; i < resources.audio.length; i++) {
  if (dali.isString(resources.audio[i]))
    resources.audio[i] = HOST_DIRECTORY + resources.audio[i];
  else
    resources.audio[i].url = HOST_DIRECTORY + resources.audio[i].url;
}

var defaultPhysicsMaterial = dali.physx.PMaterial();

// MAIN
// ----------------------------------------------------------------
function main() {

  var prev, current, dt;
  dali.pause = false;
  function init() {
    prev = performance.now();
    requestAnimationFrame(loop);
  }

  function loop() {
    requestAnimationFrame(loop);
    // TODO apart of Time/Timeline
    

    if (!dali.pause) {
      current = performance.now();
      dt = current - prev;
      prev = current;
      dali.physx.update(dt / 2000);
      scene.update(dt / 1000);
      dali.physx.update(dt / 2000);
      // console.log(dt);
    }
    
    scene.requestRender();
    dali.graphx.render();
  }

  dali.SceneManager.addScene(dali.Scene());
  var scene = dali.SceneManager.next();

  window.dali.canvas = window.dali.canvas || document.getElementById('glCanvas');
  // loads WebGL
  dali.graphx.load();

  var shader = dali.graphx.g3D.ShaderProgram3D({
    default: true,
    fShader: dali.graphx.Shader({
      code: dali.graphx.g3D.fShaderCodeCartoon,
      type: dali.graphx.gl.FRAGMENT_SHADER
    }),
  });
  dali.graphx.addProgram(shader);

  var light = dali.graphx.g3D.Light({
    transform: {
      options: {
        position: {
          x: -2, y: 2.1, z: 0.0
        },
      },
      parent: null,
      base: null,
    },
    ambient: [0.2, 0.2, 0.2],
    diffuse: [0.6, 0.6, 0.6],
    specular: [0.3, 0.3, 0.3],
  });
  scene.addEntity(light);

  light = dali.graphx.g3D.Light({
    transform: {
      options: {
        position: {
          x: 2, y: 2.1, z: 0.0
        },
      },
      parent: null,
      base: null,
    },
    ambient: [0.2, 0.2, 0.2],
    diffuse: [0.6, 0.6, 0.6],
    specular: [0.3, 0.3, 0.3],
  });
  scene.addEntity(light);

  // init's Cannon world
  dali.physx.init();
  dali.physx.setGravity({
    x: 0.0, y: GRAVITY, z:0
  });
  dali.physx.defineMaterialContact(defaultPhysicsMaterial, defaultPhysicsMaterial, {
    friction: 0.1, restitution: 0.0
  });
  dali.physx.defineGroundContact(defaultPhysicsMaterial, {
    friction: 1000.0, restitution: 0.0
  });
  dali.physx.setGroundHeight(GROUND_HEIGHT);

  // load images, json, audio, etc.
    // add scene objects
  dali.resources.load(resources)
    .then(function() {

      var frogMesh = dali.graphx.g3D.TriMesh({
        url: HOST_DIRECTORY + 'DoubleDamageFrog.obj'
      });
      shader.addMesh(frogMesh);

      // for the ground, thin boxes
      var boxMesh = dali.graphx.g3D.BoxMesh({
        // width: 6,
        // height: 2,
        // depth: 2
        width: 1,
        height: 1,
        depth: 1
        
      });
      shader.addMesh(boxMesh);

      var carMesh = dali.graphx.g3D.TriMesh({
        url: HOST_DIRECTORY + 'Lincoln.obj'
      });
      shader.addMesh(carMesh);

      var logMesh = dali.graphx.g3D.TriMesh({
        url: HOST_DIRECTORY + 'tree.obj'
      });
      shader.addMesh(logMesh);

      // initalize shaders, meshes, buffers
      dali.graphx.init();

      // AABBs
      // boxMesh.initAABB();
      // frogMesh.initAABB();
      // carMesh.initAABB();

      // GROUND
      ground = GroundGrid(
        { x: 4.4, y: 0.0, z: 4.4},
        0.4,
        [0.0, 0.0, 0.0],
        [
          { zBound: 1, type: 'grass', texture: HOST_DIRECTORY + 'grass-textures.jpg'},
          { zBound: 5, type: 'asphalt', texture: HOST_DIRECTORY + 'asphalt_texture407.jpg'},
          { zBound: 6, type: 'grass', texture: HOST_DIRECTORY + 'grass-textures.jpg' },
          { zBound: 10, type: 'water', texture: HOST_DIRECTORY + 'water.jpg' },
          { zBound: 11, type: 'fire', texture: HOST_DIRECTORY + 'fire.jpg', type1: 'win', texture1: HOST_DIRECTORY + 'grass-textures.jpg' },
        ],
        boxMesh.dGUID
      );
      scene.addEntity(ground);


      // CAR GENERATORS
      function createCarGenerator(axis, speed, maxGroup, modelLength, offset) {
        var sign = speed < 0 ? -1 : 1;
        maxGroup = maxGroup || 1;
        modelLength = modelLength || 0;
        return function (transform) {
          var groupSize = Math.random() * maxGroup;
          var generatorPos = transform.getPosition();
          var carPos = {
            x: generatorPos.x, y: generatorPos.y, z: generatorPos.z
          };
          carPos[axis] -= sign * modelLength;
          for (var i = 0; i < groupSize; i++) {
            carPos[axis] -= sign * offset;
            var car = Car(axis, carMesh.dGUID, speed, {
              transform: {
                options: {
                  position: {
                    x: carPos.x, y: carPos.y, z: carPos.z
                  },
                  scale: {
                    x: 0.07, y: 0.07, z: 0.07
                  },
                }
              }
            });
            carPos[axis] -= sign * modelLength;

            var bounds = ground.getWorldBounds();

            // make car destroy itself after it crosses the opposite bounds
            car.addUpdatable((function(car) {
              var self = dali.Updatable();

              self.update = function(dt) {
                var position = car.transform.getPosition();
                if ((speed < 0 && position[axis] < bounds.min[axis]) ||
                    (speed > 0 && position[axis] > bounds.max[axis])) {
                  
                  scene.removeEntity(car);
                  delete car;
                }
              };

              return self;
            }) (car));

            scene.addEntity(car);
            carCount++;
          }
        };
      }

      o = Generator(createCarGenerator('x', -1.2, 3, 0.6, 0.25), 3.0, 6.0, {
        transform: {
          options: {
            position: {
              x: 2, y: 0.0, z: -0.8
            },
          }
        }
      });
      scene.addEntity(o);

      o = Generator(createCarGenerator('x', -1, 1, 0.6, 0.25), 2.0, 3.5, {
        transform: {
          options: {
            position: {
              x: 2, y: 0.0, z: -1.8 
            },
          }
        }
      });
      scene.addEntity(o);

      o = Generator(createCarGenerator('x', 1.3, 3, 0.6, 0.25), 3.0, 5.0, {
        transform: {
          options: {
            position: {
              x: -2, y: 0.0, z: -0.5
            },
          }
        }
      });
      scene.addEntity(o);

      o = Generator(createCarGenerator('x', 1.1, 2, 0.6, 0.25), 2.5, 4.5, {
        transform: {
          options: {
            position: {
              x: -2, y: 0.0, z: -1.2
            },
          }
        }
      });
      scene.addEntity(o);

      // LOG GENERATORS
      function createLogGenerator(axis, speed, trunkSize, maxSize, minSize) {
        var sign = speed < 0 ? -1 : 1;
        maxSize = maxSize || 3;
        minSize = minSize || 3;
        trunkSize = trunkSize || 0;
        return function (transform) {
          var size = Math.random() * (maxSize - minSize) + minSize;
          var generatorPos = transform.getPosition();
          var trunkPos = {
            x: generatorPos.x, y: generatorPos.y, z: generatorPos.z
          };
          trunkPos[axis] -= sign * trunkSize * size;
          var log = Log(axis, logMesh.dGUID, speed, {
            // textureUrl: 'img/w3.jpg',
            transform: {
              options: {
                position: trunkPos,
                scale: {
                  x: trunkSize, y: trunkSize * size, z: trunkSize
                },
              }
            }
          });
          trunkPos[axis] -= sign * trunkSize;

          var bounds = ground.getWorldBounds();

          // make car destroy itself after it crosses the opposite bounds
          log.addUpdatable((function(log) {
            var self = dali.Updatable();

            self.update = function(dt) {
              var position = log.transform.getPosition();
              if ((speed < 0 && position[axis] < bounds.min[axis]) ||
                  (speed > 0 && position[axis] > bounds.max[axis])) {
                
                scene.removeEntity(log);
                delete log;
              }
            };

            return self;
          }) (log));

          scene.addEntity(log);
        };
      }

      o = Generator(createLogGenerator('x', 0.9, 0.07, 4), 2.7, 4.3, {
        transform: {
          options: {
            position: {
              x: -2, y: 0.0, z: 0.3
            },
          }
        }
      });
      scene.addEntity(o);

      o = Generator(createLogGenerator('x', -1.2, 0.07, 3, 2), 2, 3, {
        transform: {
          options: {
            position: {
              x: 2, y: 0.0, z: 0.6
            },
          }
        }
      });
      scene.addEntity(o);

      o = Generator(createLogGenerator('x', 1.3, 0.07, 2, 2), 1.7, 2.5, {
        transform: {
          options: {
            position: {
              x: -2, y: 0.0, z: 1.0
            },
          }
        }
      });
      scene.addEntity(o);

      o = Generator(createLogGenerator('x', -1.5, 0.07, 2, 1), 1.2, 2.0, {
        transform: {
          options: {
            position: {
              x: 2, y: 0.0, z: 1.4
            },
          }
        }
      });
      scene.addEntity(o);

      // PLAYER AND FROG

      // Setup follow camera to look at frog
      var cameraPosition = {
        x: 0.0, y: 1.5, z: -2.0,
      };
      var at = vec3.fromValues(-cameraPosition.x,
                               -cameraPosition.y,
                               -cameraPosition.z);
      vec3.normalize(at, at);
      var right = vec3.fromValues(1, 0, 0);
      var up = vec3.create();
      vec3.cross(up, at, right);
      vec3.normalize(up, up);

      // var player = Player({
      //   transform: {
      //     options: {
      //       position: {
      //         x: 0.0, y: 0.0, z: -2.0,
      //       },
      //       scale: {
      //         x: 1.0, y: 1.0, z: 1.0
      //       },
      //     }
      //   }
      // });
      // scene.addEntity(player);

      var frog = Frog(frogMesh.dGUID, {
        transform: {
          options: {
            position: {
              x: 0.0, y: 0.1, z: -2.0,
            },
            scale: {
              x: 0.2, y: 0.2, z: 0.2
            },
          },
          // parent: player.transform
        }
      });
      scene.addEntity(frog);

      // ESC to pause

      dali.SceneManager.addEventListener('keydown', function(keyEvent) {
        if (keyEvent.code === 'Escape') {
          if (!dali.pause) {
            dali.pause = true;
          } else {
            frog.reset();
            prev = performance.now();
            dali.pause = false;
          }
        }   
      });

      // CAMERAS

      var cameraFollow = dali.graphx.g3D.PerspectiveCamera({
        transform: {
          options: {
            position: cameraPosition,
            // scale: {
            //   x: 5.0, y: 5.0, z: 5.0,
            // }
          },
          parent: frog.transform
        },
        lookAt: at,
        lookUp: up,
        eyeDistance: 0.5,
        fovY: 0.5 * Math.PI,
      });

      var cameraTop = dali.graphx.g3D.PerspectiveCamera({
        transform: {
          options: {
            position: {
              x: 0.0, y: 1.1, z: 0.0,
            },
          },
        },
        lookAt: [0, -1, 0],
        lookUp: [0, 0, 1],
        eyeDistance: 0.5,
        fovY: 0.5 * Math.PI,
      });

      var mainCamera = cameraFollow;

      scene.addEntity(cameraTop);
      scene.addEntity(cameraFollow);
      shader.setCamera(mainCamera);

      function swapCamera() {
        mainCamera = mainCamera === cameraFollow ? cameraTop : cameraFollow;
        shader.setCamera(mainCamera);
      }

      var pressed = false;
      // camera swapping on Space
      scene.addEventListener('keydown', function(event) {
        if (event.code === 'Space') {
          if (!pressed) {
            pressed = true;
            swapCamera();
          }
        }
      });

      shader.addEventListener('keyup', function(keyEvent) {
        if (event.code === 'Space') {
          if (pressed) {
            pressed = false;
            swapCamera();
          }
        }
      });

      init();
      setTimeout(function() {
        frog.enabled = true;
      }, 1600);
  }).catch(function (err) {
    console.error(err);
  });

};
