
var defaultMaterial = dali.graphx.Material({
  ambient: [0.1, 0.1, 0.1],
  diffuse: [1.0, 1.0, 1.0],
  specular: [1.0, 1.0, 1.0],
  alpha: 1.0,
  shininess: 32.0,
});

function Ground(textureUrl, meshId ,options) {
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

  self.addRenderable(renderer);

  return self;
}

function Frog(meshId, options) {
  var self = dali.Entity(options);
  var mat = dali.graphx.Material({
    ambient: [0.1, 0.1, 0.1],
    diffuse: [0.2, 0.7, 0.3],
    specular: [0.3, 0.3, 0.3],
    alpha: 1.0,
    shininess: 9.0,
  });
  var texture = dali.graphx.g3D.Texture({
    r: 255, b: 255, g: 255, a: 255
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

function Generator() {
//TODO
}

function Log() {
//TODO
}

function Car(meshId, options) {
  var self = dali.Entity(options);

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
      pos.x -= dt;
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

  document.onkeydown = function(keyEvent) {
    console.log('yeah');
    if (keyEvent.code === 'Escape') {
      console.log("STOP");
      stop = true;
    }   
  };

  var resources = {
    img: [
      './img/asphalt_texture407.jpg',
      './img/grass-textures.jpg',
      './img/water.jpg',
      './img/fire.jpg'
    ],
    text: [
      './meta/test.json',
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
  //         x: 0.5, y: 0.5, z: -1.5,
  //       },
  //     }
  //   },
  //   lookAt: [0, 0, 1],
  //   lookUp: [0, 1, 0],
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
          x: 2.0, y: 4.0, z: -0.5
        },
      },
      parent: null,
      base: null,
    },
    ambient: [1.0, 1.0, 1.0],
    diffuse: [1, 1, 1],
    specular: [1, 1, 1],
  });
  scene.addEntity(light);
  
  var sphereMesh = dali.graphx.g3D.SphereMesh();
  shader.addMesh(sphereMesh);

  var roadMesh = dali.graphx.g3D.PlaneMesh({
    width: 10,
    height: 5,
  });
  shader.addMesh(roadMesh);

  var grassMesh = dali.graphx.g3D.PlaneMesh({
    width: 10,
    height: 1,
  });
  shader.addMesh(grassMesh);

  var waterMesh = dali.graphx.g3D.PlaneMesh({
    width: 10,
    height: 3,
  });
  shader.addMesh(waterMesh);

  var fireMesh = dali.graphx.g3D.PlaneMesh({
    width: 2,
    height: 2,
  });
  shader.addMesh(fireMesh);

  var carMesh = dali.graphx.g3D.BoxMesh({
    // width: 6,
    // height: 2,
    // depth: 2
    width: 1,
    height: 1,
    depth: 1
    
  });
  shader.addMesh(carMesh);

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
  dali.resources.load(resources)
  .then(function() {
    // add scene objects

    var o = Frog(sphereMesh.dGUID, {
      transform: {
        options: {
          position: {
            x: 0.5, y: 0.1, z: -0.8,
          },
          scale: {
            x: 0.05, y: 0.05, z: 0.05
          },
        }
      }
    });
    scene.addEntity(o);

    var camera = dali.graphx.g3D.PerspectiveCamera({
      transform: {
        options: {
          position: {
            x: 0, y: 0.75, z: -1.0,
          },
        },
        parent: o.transform,
      },
      lookAt: [0, 0, 1],
      lookUp: [0, 1, 0],
      eyeDistance: 0.5,
      fovY: 0.5 * Math.PI,
    });
    scene.addEntity(camera);
    shader.setCamera(camera);

    o = Ground('./img/grass-textures.jpg', grassMesh.dGUID, {
      transform: {
        options: {
          position: {
            x: 0.5, y: 0, z: -0.8,
          },
          scale: {
            x: 6.0, y: 1.0, z: 0.4
          },
        }
      }
    });
    scene.addEntity(o);


    o = Ground('./img/asphalt_texture407.jpg', roadMesh.dGUID, {
      transform: {
        options: {
          position: {
            x: 0.5, y: 0, z: 0.01,
          },
          scale: {
            x: 6.0, y: 1.0, z: 1.2
          },
        }
      }
    });
    scene.addEntity(o);


    o = Ground('./img/grass-textures.jpg', grassMesh.dGUID, {
      transform: {
        options: {
          position: {
            x: 0.5, y: 0, z: 0.77,
          },
          scale: {
            x: 6.0, y: 1.0, z: 0.3
          },
        }
      }
    });
    scene.addEntity(o);


    o = Ground('./img/water.jpg', waterMesh.dGUID, {
      transform: {
        options: {
          position: {
            x: 0.5, y: 0, z: 1.2,
          },
          scale: {
            x: 6.0, y: 1.0, z: 0.6
          },
        }
      }
    });
    scene.addEntity(o);


    for (var i = -2.4; i < 3.6; i+=0.6) {
      o = Ground('./img/fire.jpg', fireMesh.dGUID, {
        transform: {
          options: {
            position: {
              x: i + 0.15, y: 0.1, z: 1.77,
            },
            scale: {
              x: 0.3, y: 1.0, z: 0.3
            },
          }
        }
      });
      scene.addEntity(o);   
    }

    o = Ground('./img/grass-textures.jpg', grassMesh.dGUID, {
      transform: {
        options: {
          position: {
            x: 0.5, y: 0.0, z: 1.85
          },
          scale: {
            x: 6.0, y: 1.0, z: 0.3
          }
        }
      }
    });
    scene.addEntity(o);

    o = Car(carMesh.dGUID, {
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
