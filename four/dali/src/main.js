
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

  dali.graphx.init();

  var vShader = dali.graphx.Shader({
    type: dali.graphx.gl.VERTEX_SHADER,
    code: dali.graphx.g3D.vShaderCodeDefault,
  });

  var fShader = dali.graphx.Shader({
    type: dali.graphx.gl.FRAGMENT_SHADER,
    code: dali.graphx.g3D.fShaderCodeDefault,
  });

  var program = dali.graphx.g3D.ShaderProgram3D({
    'vShader': vShader,
    'fShader': fShader
  });
  program.createSetters();
  console.log(program.uniformSetters);
  console.log(program.attribSetters);

  var camera = dali.graphx.g3D.Camera({
    lookAt: [0, 0, 1],
    lookUp: [0, 1, 0],
    eyeDistance: 1.0
  });

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

  program.init();
  program.render();
  
  // Test camera rotation
  // var rot = camera.transform.getRotation().quat();
  // quat.rotateY(rot, rot, Math.PI * 0.5);
  // camera.transform.setRotationFromQuat(rot);
  // camera.update(1);
  // console.log(camera);

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
  scene.update(1);

  // init();
};
