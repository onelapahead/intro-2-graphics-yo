
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
    console.log(dt);

  }

  for (var i = 0; i < 10; i++) {
    var o = dalí.Entity({secret: i});
    console.log(o);
  }

  console.log(dalí.entities);

  init();
}
