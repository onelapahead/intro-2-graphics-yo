
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
    lookAt: [0, 0, 1],
    lookUp: [0, 1, 0],
    eyeDistance: 1.0
  });
  scene.addEntity(camera);

  var light = dali.graphx.g3D.Light({
    transform: {
      options: {
        position: {
          x: 1.0, y: 0.5, z: 0.75
        },
      },
      parent: null,
      base: null,
    },
    ambient: [0.6, 0.0, 0.0],
    diffuse: [0.6, 0.6, 0.6],
    specular: [0.6, 0.6, 0],
  });
  console.log(light);
  scene.addEntity(light);
  
  // initalize shader programs, b/c none were added,
  // creates default 3d per-pixel lighting shader
  dali.graphx.init();

  // Test camera rotation
  var rot = camera.transform.getRotation().quat();
  console.log(rot);
  quat.rotateY(rot, rot, Math.PI * 0.5);
  camera.transform.setRotationFromQuat(rot);
  camera.update(1);
  console.log(camera);

  for (var i = 0; i < 10; i++) {
    var o = dali.Entity({secret: i});
    scene.addEntity(o);
    var c = dali.Renderable();
    o.addRenderable(c);
    c = dali.Updatable();
    o.addUpdatable(c);
    console.log(o.getType());
  }

  scene.requestRender();
  dali.graphx.render();
  scene.update(1);

  // init();
};
