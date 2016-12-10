
var defaultMaterial = dali.graphx.Material({
  ambient: [0.1, 0.1, 0.1],
  diffuse: [1.0, 1.0, 1.0],
  specular: [0.8, 0.8, 0.8],
  alpha: 1.0,
  shininess: 32.0,
});

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

  var numX = dimensions.x / step,
      numZ = dimensions.z / step;

  self.quantize = function(position) {
    // TODO
  };

  self.localize = function(pair) {
    var i = pair[0], j = pair[1];
    // TODO
  };

  console.log(step);
  console.log(numX);
  console.log(numZ);
  var sections = _sections;

  var tiles = [];

  var ll = {
    x: center[0] - 0.5 * dimensions.x,
    z: center[2] - 0.5 * dimensions.z,
  };

  /**
   * Grid consists of "sections", a group of consecutive
   * rows of the same texture and collision action.
   * Sections are defined using their lower z-bound, 
   */
  var section = sections[0];
  var secPtr = 0, texture;
  for (var i = 0; i < numX; i++) {
    tiles.push([]);
    secPtr = 0;
    section = sections[secPtr++];
    for (var j = 0; j < numZ; j++) {
      if (j === section.zBound && secPtr < sections.length) {
        section = sections[secPtr++];
      }
      if (secPtr == sections.length && i % 2 == 0)
        texture = section.texture1;
      else
        texture = section.texture;

      tiles[i].push(Ground(texture, boxMeshId, {
        transform: { 
          options: {
            position: {
              x: ll.x + i * step + step/2,
              y: -0.05,
              z: ll.z + j * step + step/2,
            },
            scale: {
              x: step * 1.44,
              y: 0.1,
              z: step * 1.44,
            }
          }
        },
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

function Ground(textureUrl, meshId, options) {
  var self = dali.Entity(options);

  var texture = dali.graphx.g3D.Texture({
      url: textureUrl
  });
  var model = dali.graphx.g3D.Model({
    meshId: meshId,
    eTransform: self.transform,
  });

  var renderer = dali.graphx.g3D.Renderable3D({
    'material': defaultMaterial,
    'texture': texture,
    'model': model
  });

  // TODO collision rxn

  self.addRenderable(renderer);

  return self;
}

function Player(options) {
  var self = dali.Entity(options);



  return self;
}

function Frog(textureUrl, meshId, options) {
  var self = dali.Entity(options);
  // var mat = dali.graphx.Material({
  //   ambient: [0.1, 0.1, 0.1],
  //   diffuse: [0.2, 0.7, 0.3],
  //   specular: [0.3, 0.3, 0.3],
  //   alpha: 1.0,
  //   shininess: 9.0,
  // });
  var mat = defaultMaterial;
  var texture = dali.graphx.g3D.Texture({
    url: textureUrl
  });
  var model = dali.graphx.g3D.Model({
    meshId: meshId,
    eTransform: self.transform,
  });

  var renderer = dali.graphx.g3D.Renderable3D({
    'material': mat,
    'texture': texture,
    'model': model
  });

  self.addRenderable(renderer);

  var updater = (function() {
    var _self = dali.Updatable();

    _self.update = function(dt) {
      var pos = self.transform.getPosition();
      pos.z += 0.25 * dt;
    };

    return _self;
  }) ();
  self.addUpdatable(updater);
  return self;
}

function Generator(object, meshId, speedLow, speedHigh, options) {
//TODO
  var self = dali.Entity(options);

  return self;
}

function Mover(meshId, _speed, options) {
  var self = dali.Entity(options);

  var speed = _speed;

  var texture;
  if (options != null && options.textureUrl != null && dali.isString(options.textureUrl))
    texture = dali.graphx.g3D.Texture({ url: options.textureUrl });
  else {
    texture = dali.graphx.g3D.Texture({
      r: Math.random() * 255, g: Math.random() * 255, b: Math.random() * 255, a: 255
    });
  }
  var model = dali.graphx.g3D.Model({
    meshId: meshId,
    eTransform: self.transform,
  });

  var renderer = dali.graphx.g3D.Renderable3D({
    'material': defaultMaterial,
    'texture': texture,
    'model': model
  });

  self.addRenderable(renderer);

  var updater = (function() {
    var _self = dali.Updatable();

    _self.update = function(dt) {
      var pos = self.transform.getPosition();
      pos.x += dt * speed;
    };

    return _self;
  }) ();
  self.addUpdatable(updater);
  return self;
}

function Log(meshId, _speed, options) {
  var sign = _speed < 0 ? -1 : 1;
  options = options || {};
  options.transform = options.transform || {};
  options.transform.options = options.transform.options || {};
  options.transform.options.axes = {
    z: sign * 90,
  };

  var self = Mover(meshId, _speed, options);
  self.setType('log');

  return self;
}

function Car(meshId, _speed, options) {
  var sign = _speed < 0 ? -1 : 1;
  options = options || {};
  options.transform = options.transform || {};
  options.transform.options = options.transform.options || {};
  options.transform.options.axes = {
    y: sign * 90,
  };

  var self = Mover(meshId, _speed, options);
  self.setType('car');
  return self;
}


function main() {

  var prev, current, dt;
  var pause = false;
  function init() {
    prev = performance.now();
    requestAnimationFrame(loop);
  }

  function loop() {
    requestAnimationFrame(loop);
    // TODO apart of Time/Timeline
    
    if (!pause) {
      current = performance.now();
      dt = current - prev;
      prev = current;
      scene.update(dt / 1000);
    }
    
    scene.requestRender();
    dali.graphx.render();
  }

  // ESC to pause

  dali.SceneManager.addEventListener('keydown', function(keyEvent) {
    if (keyEvent.code === 'Escape') {
      if (!pause) {
        pause = true;
      } else {
        prev = performance.now();
        pause = false;
      }
    }   
  });

  var resources = {
    img: [
      'img/asphalt_texture407.jpg',
      'img/grass-textures.jpg',
      'img/water.jpg',
      'img/fire.jpg',
      // 'http://brix4dayz.github.io/img/profile.png', // CORS test
      'img/HandleTex.png',
      'img/w3.jpg'
    ],
    text: [
      'meta/test.json',
      'meta/DoubleDamageFrog.obj',
      'meta/Lincoln.obj',
      'meta/tree.obj',
      // src: https://www.models-resource.com/pc_computer/roblox/model/12873/
    ]
  };

  dali.SceneManager.addScene(dali.Scene());
  var scene = dali.SceneManager.next();

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
          x: -1.5, y: 2.1, z: 0.0
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
          x: 1.5, y: 2.1, z: 0.0
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

  // load images, json, audio, etc.
    // add scene objects
  dali.resources.load(resources)
    .then(function() {

      var frogMesh = dali.graphx.g3D.TriMesh({
        url: 'meta/DoubleDamageFrog.obj'
      });
      shader.addMesh(frogMesh);

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
        url: 'meta/Lincoln.obj'
      });
      shader.addMesh(carMesh);

      var logMesh = dali.graphx.g3D.TriMesh({
        url: 'meta/tree.obj'
      });
      shader.addMesh(logMesh);

      // initalize shader programs, b/c none were added,
      // creates default 3d per-pixel lighting shader
      dali.graphx.init();
      boxMesh.initAABB();
      frogMesh.initAABB();
      carMesh.initAABB();

      var frogPosition = {
        x: 0.0, y: 0.0, z: -1.5,
      };

      var cameraPosition = {
        x: 0.0, y: 1.0, z: -2.0,
      };

      var at = vec3.fromValues(-cameraPosition.x,
                               -cameraPosition.y,
                               -cameraPosition.z);
      vec3.normalize(at, at);
      var right = vec3.fromValues(1, 0, 0);
      var up = vec3.create();
      vec3.cross(up, at, right);
      vec3.normalize(up, up);

      console.log(at);
      console.log(up);
      console.log(right);

      var o = Frog('img/HandleTex.png', frogMesh.dGUID, {
        transform: {
          options: {
            position: frogPosition,
            scale: {
              x: 0.2, y: 0.2, z: 0.2
            },
          }
        }
      });
      scene.addEntity(o);

      var camera1 = dali.graphx.g3D.PerspectiveCamera({
        transform: {
          options: {
            position: cameraPosition
          },
          parent: o.transform
        },
        lookAt: at,
        lookUp: up,
        eyeDistance: 0.5,
        fovY: 0.5 * Math.PI,
      });

      var camera = dali.graphx.g3D.PerspectiveCamera({
        transform: {
          options: {
            position: {
              x: 0.0, y: 1.5, z: 0.0,
            },
          },
          // parent: o.transform,
        },
        lookAt: [0, -1, 0],
        lookUp: [0, 0, 1],
        eyeDistance: 0.5,
        fovY: 0.5 * Math.PI,
      });

      var mainCamera = camera1;

      scene.addEntity(camera);
      scene.addEntity(camera1);
      shader.setCamera(mainCamera);

      // camera swapping on Shift
      shader.addEventListener('keydown', function(event) {
        if (event.code === 'Space') {
          mainCamera = mainCamera === camera1 ? camera : camera1;
          shader.setCamera(mainCamera);
        }
      });

      var ground = GroundGrid(
        { x: 4, y: 0, z: 4},
        0.4,
        [0.0, 0.0, 0.0],
        [
          { zBound: 1, texture: 'img/grass-textures.jpg'},
          { zBound: 4, texture: 'img/asphalt_texture407.jpg'},
          { zBound: 5, texture: 'img/grass-textures.jpg' },
          { zBound: 9, texture: 'img/water.jpg' },
          { zBound: 10, texture: 'img/fire.jpg', texture1: 'img/grass-textures.jpg' },
        ],
        boxMesh.dGUID
      );
      scene.addEntity(ground);

      o = Car(carMesh.dGUID, -0.5, {
        transform: {
          options: {
            position: {
              x: 1.8, y: 0.0, z: -0.8
            },
            scale: {
              x: 0.07, y: 0.07, z: 0.07
            },
          }
        }
      });
      scene.addEntity(o);

      o = Car(carMesh.dGUID, -0.5, {
        // textureUrl: 'img/car.gif',
        transform: {
          options: {
            position: {
              x: 1.8, y: 0.0, z: -0.4
            },
            scale: {
              x: 0.07, y: 0.07, z: 0.07
            },
          }
        }
      });
      scene.addEntity(o);

      o = Log(logMesh.dGUID, 0.5, {
        textureUrl: 'img/w3.jpg',
        transform: {
          options: {
            position: {
              x: -1.0, y: 0.05, z: 1.2
            },
            scale: {
              x: 0.07, y: 0.21, z: 0.07
            },
          }
        }
      });
      scene.addEntity(o);

      init();
  }).catch(function (err) {
    console.error(err);
  });

};
