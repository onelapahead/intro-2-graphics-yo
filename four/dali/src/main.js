
var defaultMaterial = dali.graphx.Material({
  ambient: [0.1, 0.1, 0.1],
  diffuse: [1.0, 1.0, 1.0],
  specular: [1.0, 1.0, 1.0],
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
  var sections = _sections;

  var tiles = [];

  var ll = {
    x: center[0] - 0.5 * dimensions.x,
    z: center[2] - 0.5 * dimensions.z,
  };

  // { zBound, texture, action? }
  var section = sections[0];
  var secPtr = 0, texture;
  for (var i = 0; i <= numX; i++) {
    tiles.push([]);
    secPtr = 0;
    section = sections[secPtr++];
    for (var j = 0; j <= numZ; j++) {
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
              x: ll.x + i * step + step / 2,
              y: -0.1,
              z: ll.z + j * step + step / 2,
            },
            scale: {
              x: step,
              y: 0.1,
              z: step,
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

function Log() {
//TODO
}

function Car(meshId, _speed, options) {
  var self = dali.Entity(options);

  var speed = _speed;

  var texture = dali.graphx.g3D.Texture({
      r: 255, g: 0, b: 0, a: 255
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

  self.addRenderable(renderer);

  var updater = (function() {
    var _self = dali.Updatable();

    _self.update = function(dt) {
      var pos = self.transform.getPosition();
      pos.x -= dt * speed;
    };

    return _self;
  }) ();
  self.addUpdatable(updater);

  return self;
}


function main() {

  var prev, current, dt;
  var stop = false;
  function init() {
    prev = performance.now();
    requestAnimationFrame(loop);
  }

  function loop() {
    if (!stop)
      requestAnimationFrame(loop);
    
    // TODO apart of Time/Timeline
    current = performance.now();
    dt = current - prev;
    prev = current;

    scene.update(dt / 1000);
    scene.requestRender();
    dali.graphx.render();
  }

  // ESC to pause
  document.onkeydown = function(keyEvent) {
    console.log('yeah');
    if (keyEvent.code === 'Escape') {
      if (!stop) {
        stop = true;
      } else {
        prev = performance.now();
        stop = false;
        requestAnimationFrame(loop);
      }
    }   
  };

  var resources = {
    img: [
      './img/asphalt_texture407.jpg',
      './img/grass-textures.jpg',
      './img/water.jpg',
      './img/fire.jpg',
      // 'http://brix4dayz.github.io/img/profile.png', // CORS test
      './img/HandleTex.png'
    ],
    text: [
      './meta/test.json',
      './meta/DoubleDamageFrog.obj', 
      // src: https://www.models-resource.com/pc_computer/roblox/model/12873/
    ]
  };

  dali.SceneManager.addScene(dali.Scene());
  var scene = dali.SceneManager.next();

  // loads WebGL
  dali.graphx.load();

  // var camera = dali.graphx.g3D.PerspectiveCamera({
  //   transform: {
  //     options: {
  //       position: {
  //         x: 0.5, y: 1.0, z: 0.0,
  //       },
  //     },
  //     // parent: o.transform,
  //   },
  //   lookAt: [0, -1, 0],
  //   lookUp: [0, 0, 1],
  //   eyeDistance: 0.5,
  //   fovY: 0.5 * Math.PI,
  // });

  // scene.addEntity(camera);

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
          x: 0.0, y: 1.0, z: 0.0
        },
      },
      parent: null,
      base: null,
    },
    ambient: [1.0, 1.0, 1.0],
    diffuse: [0.6, 0.6, 0.6],
    specular: [0.3, 0.3, 0.3],
  });
  scene.addEntity(light);

  // light = dali.graphx.g3D.Light({
  //   transform: {
  //     options: {
  //       position: {
  //         x: 0.0, y: 1.0, z: 1.0
  //       },
  //     },
  //     parent: null,
  //     base: null,
  //   },
  //   ambient: [1.0, 1.0, 1.0],
  //   diffuse: [0.6, 0.6, 0.6],
  //   specular: [0.3, 0.3, 0.3],
  // });
  // scene.addEntity(light);

  // light = dali.graphx.g3D.Light({
  //   transform: {
  //     options: {
  //       position: {
  //         x: 1.0, y: 1.0, z: 1.0
  //       },
  //     },
  //     parent: null,
  //     base: null,
  //   },
  //   ambient: [1.0, 1.0, 1.0],
  //   diffuse: [0.6, 0.6, 0.6],
  //   specular: [0.3, 0.3, 0.3],
  // });
  // scene.addEntity(light);

  light = dali.graphx.g3D.Light({
    transform: {
      options: {
        position: {
          x: 1.0, y: 1.0, z: 0.0
        },
      },
      parent: null,
      base: null,
    },
    ambient: [1.0, 1.0, 1.0],
    diffuse: [0.6, 0.6, 0.6],
    specular: [0.3, 0.3, 0.3],
  });
  scene.addEntity(light);

  dali.resources.load(resources)
  .then(function() {

  var frogMesh = dali.graphx.g3D.TriMesh({
    url: './meta/DoubleDamageFrog.obj'
  });
  shader.addMesh(frogMesh);

  // var roadMesh = dali.graphx.g3D.PlaneMesh({
  //   width: 10,
  //   height: 5,
  // });
  // shader.addMesh(roadMesh);

  // var grassMesh = dali.graphx.g3D.PlaneMesh({
  //   width: 10,
  //   height: 1,
  // });
  // shader.addMesh(grassMesh);

  // var waterMesh = dali.graphx.g3D.PlaneMesh({
  //   width: 10,
  //   height: 3,
  // });
  // shader.addMesh(waterMesh);

  // var fireMesh = dali.graphx.g3D.PlaneMesh({
  //   width: 2,
  //   height: 2,
  // });
  // shader.addMesh(fireMesh);

  var boxMesh = dali.graphx.g3D.BoxMesh({
    // width: 6,
    // height: 2,
    // depth: 2
    width: 1,
    height: 1,
    depth: 1
    
  });
  shader.addMesh(boxMesh);

  // initalize shader programs, b/c none were added,
  // creates default 3d per-pixel lighting shader
  dali.graphx.init();

  // Test camera rotation
  // var rot = camera.transform.getRotation().quat();
  // console.log(rot);
  // quat.rotateY(rot, rot, Math.PI * 0.5);
  // camera.transform.setRotationFromQuat(rot);
  // camera.update(1);
  // console.log(camera);

  // load images, json, audio, etc.
    // add scene objects

    var o = Frog('./img/HandleTex.png', frogMesh.dGUID, {
      transform: {
        options: {
          position: {
            x: 1.0, y: 0.2, z: -1.0,
          },
          scale: {
            x: 0.2, y: 0.2, z: 0.2
          },
        }
      }
    });
    scene.addEntity(o);

    var camera = dali.graphx.g3D.PerspectiveCamera({
      transform: {
        options: {
          position: {
            x: 0.0, y: 0.75, z: -1.25,
          }
        },
        parent: o.transform
      },
      lookAt: [0, 0, 1],
      lookUp: [0, 1, 0],
      eyeDistance: 0.5,
      fovY: 0.5 * Math.PI,
    });
    scene.addEntity(camera);
    shader.setCamera(camera);

    var ground = GroundGrid(
      { x: 4, y: 0, z: 4},
      0.4,
      [1.0, 0, 0.0],
      [
        { zBound: 1, texture: './img/grass-textures.jpg'},
        { zBound: 4, texture: './img/asphalt_texture407.jpg'},
        { zBound: 5, texture: './img/grass-textures.jpg' },
        { zBound: 9, texture: './img/water.jpg' },
        { zBound: 10, texture: './img/fire.jpg', texture1: './img/grass-textures.jpg' },
      ],
      boxMesh.dGUID
    );
    scene.addEntity(ground);

    o = Car(boxMesh.dGUID, 0.5, {
      transform: {
        options: {
          position: {
            x: 1.8, y: 0.1, z: 0.5
          },
          scale: {
            x: 0.6, y: 0.2, z: 0.2
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
