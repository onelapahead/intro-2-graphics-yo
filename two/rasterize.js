
// ASSIGNMENT HELPER FUNCTION
// helpful source for promisifying http request:
// http://stackoverflow.com/questions/30008114/how-do-i-promisify-native-xhr
function loadResource(url) {
    return new Promise(function(resolve, reject) {
        var req = new XMLHttpRequest();
        req.open('GET', url);

        req.onload = function () {
            if (this.status == 200 && this.status < 300) {
                resolve(req.response);
            } else {
                reject({
                    status: req.status,
                    statusText: req.statusText
                });
            }
        };

        req.onerror = function() {
            reject({
                status: req.status,
                statusText: req.statusText
            });
        };
        req.send();
    });
}

/* MAIN -- HERE is where execution begins after window load */
function main() {

  function loop(now) {
    dt = now - start;
    start = now;
    
    update(dt / 1000);
    render();

    window.requestAnimationFrame(loop);
  }

  function init() {
    setupWebGL(); // set up the webGL environment
    loadBuffers(); // load models' triangle data into buffers
    setupShaders(); // setup the webGL shaders
    camera.update();
    start = performance.now();
    loop(start);
  }

  function loadLights(data) {
    var rawLights = JSON.parse(data);
    var light;
    for (var i = 0; i < rawLights.length; i++) {
      light = Light(rawLights[i]);
      lights.push(light);
    }
    return loadResource(INPUT_SPHERES_URL);
  }

  function loadSpheres(data) {
    var rawSpheres = JSON.parse(data);
    var sphere;
    for (var i = 0; i < rawSpheres.length; i++) {
      sphere = Sphere(rawSpheres[i], 32, 32);
      models.push(sphere.model);
      //console.log(rawSphere.model);
      spheres.push(sphere.model);
    }
    spherePtr = 0;

    return loadResource(INPUT_TRIANGLES_URL);
  }

  function loadTriangles(data) {
    var rawTriangles = JSON.parse(data);
    var model;
    for (var i = 0; i < rawTriangles.length; i++) {
      model = Model(rawTriangles[i]);
      model.material.shininess = model.material.n;
      delete model.material.n;
      models.push(model);
      triangles.push(model);
    }
    trianglePtr = 0;

    init();
  }

  loadResource(INPUT_LIGHTS_URL)
    .then(loadLights)
    .then(loadSpheres)
    .then(loadTriangles)
  .catch(function (err) {
    console.error(err);
  });
  
} // end main
