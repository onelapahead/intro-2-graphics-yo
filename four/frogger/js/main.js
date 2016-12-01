
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

  for (var i = 0; i < 10; i++) {
    var o = dalí.Entity({secret: i});
    var c = dalí.Drawable();
    o.addDrawable(c);
    console.log(o.getType());
  }

  for (let entity of dalí.entities.values()) {
    entity._update();
  }

  // init();
}
