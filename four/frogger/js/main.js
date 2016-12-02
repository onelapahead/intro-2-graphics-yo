
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

  dalí.SceneManager.addScene(dalí.Scene());
  var scene = dalí.SceneManager.next();

  for (var i = 0; i < 10; i++) {
    var o = dalí.Entity({secret: i});
    scene.addEntity(o);
    var c = dalí.Drawable();
    o.addDrawable(c);
    c = dalí.Updatable();
    o.addUpdatable(c);
    console.log(o.getType());
  }

  scene.draw();
  scene.update(1);

  // init();
}
