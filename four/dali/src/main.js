
function main() {

  var prev, current, dt;

  function init() {
    prev = performance.now();
    requestAnimationFrame(loop);
  }

  function loop() {
    requestAnimationFrame(loop);
    
    // TODO apart of Time/Timeline
    current = performance.now();
    dt = current - prev;
    prev = current;

  }

  dali.SceneManager.addScene(dali.Scene());
  var scene = dali.SceneManager.next();

  // loads WebGL
  dali.graphx.load();

  var camera = dali.graphx.g3D.Camera({
    transform: {
      options: {
        position: {
          x: 0.5, y:0.5, z: -0.5,
        },
      }
    },
    lookAt: [0, 0, 1],
    lookUp: [0, 1, 0],
    eyeDistance: 0.5,
    fovY: 0.5 * Math.PI,
  });
  scene.addEntity(camera);

  var shader = dali.graphx.g3D.ShaderProgram3D({
    default: true,
  });
  dali.graphx.addProgram(shader);

  var light = dali.graphx.g3D.Light({
    transform: {
      options: {
        position: {
          x: 2, y: 4.0, z: -0.5
        },
      },
      parent: null,
      base: null,
    },
    ambient: [1.0, 1.0, 1.0],
    diffuse: [1, 1, 1],
    specular: [1, 1, 1],
  });
  console.log(light);
  scene.addEntity(light);
  
  var sphereMesh = dali.graphx.g3D.SphereMesh();
  shader.addMesh(sphereMesh);

  // initalize shader programs, b/c none were added,
  // creates default 3d per-pixel lighting shader
  dali.graphx.init();

  // Test camera rotation
  var rot = camera.transform.getRotation().quat();
  // console.log(rot);
  // quat.rotateY(rot, rot, Math.PI * 0.5);
  // camera.transform.setRotationFromQuat(rot);
  // camera.update(1);
  // console.log(camera);

  var o = dali.Entity({
    transform: {
      options: {
        position: {
          x: 0.5, y: 0.5, z: 0.5,
        },
        scale: {
          x: 0.15, y: 0.15, z: 0.15
        },
      }
    }
  });
  var mat = dali.graphx.Material({
    ambient: [0.1, 0.1, 0.1],
    diffuse: [0.6, 0.6, 0.0],
    specular: [0.3, 0.3, 0.3],
    alpha: 1.0,
    shininess: 9.0,
  });
  var texture = dali.graphx.g3D.Texture({
    r: 255, b: 255, g: 255, a: 255
  });
  var model = dali.graphx.g3D.Model({
    meshId: sphereMesh.dGUID,
    eTransform: o.transform,
  });

  var renderer = dali.graphx.g3D.Renderable3D({
    'material': mat,
    'texture': texture,
    'model': model
  });

  o.addRenderable(renderer);
  scene.addEntity(o);

  // for (var i = 0; i < 10; i++) {
  //   var o = dali.Entity({secret: i});
  //   scene.addEntity(o);
  //   var c = dali.Renderable();
  //   o.addRenderable(c);
  //   c = dali.Updatable();
  //   o.addUpdatable(c);
  //   console.log(o.getType());
  // }

  scene.update(1);
  scene.requestRender();
  dali.graphx.render();

  // init();
};
