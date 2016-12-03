
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

  for (var i = 0; i < 10; i++) {
    var o = dali.Entity({secret: i});
    scene.addEntity(o);
    var c = dali.Drawable();
    o.addDrawable(c);
    c = dali.Updatable();
    o.addUpdatable(c);
    console.log(o.getType());
  }

  scene.draw();
  scene.update(1);

  // init();
};
