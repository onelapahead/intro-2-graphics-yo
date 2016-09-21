function drawSpheres(inputLights, inputSpheres, context) {
    var w = context.canvas.width,
        h = context.canvas.height,
        imgData = context.createImageData(w,h),
        ratio = w / h,
        size = 1;

    var eye = new Vector(-0.5, 0.5, 1.5);
    var lookat = new Vector(1, 0, -1);
    lookat = lookat.unit();
    var lookup = new Vector(0, 1, 0);
    lookup = lookup.unit();

    var horizontal = lookup.cross(lookat);

    var windowDistance = 0.5;

    var up = lookup.mult(size);
    var right = horizontal.mult(ratio * size);
    console.log(right);

    var halfRight = up.add(right).div(2);
    var halfLeft = up.sub(right).div(2);

    var windowCenter = eye.add(lookat.mult(windowDistance));
    var wLL = windowCenter.sub(halfRight);
    var wLR = windowCenter.sub(halfLeft);
    var wUR = windowCenter.add(halfRight);
    var wUL = windowCenter.add(halfLeft);
    console.log(wUL);
    console.log(wUR);
    console.log(wLL);
    console.log(wLR);
    delete half;

    var pixels3D = [];
    var rayCaster = new RayCaster(inputLights, inputSpheres, imgData);

    var dt = 1 / (h - 1);
    var ds = 1 / (w - 1);
    var lerpLeft = new Lerp(wUL, wLL);
    var lerpRight = new Lerp(wUR, wLR);
    var j = 0;
    for (var t = 0; t < 1.0; t += dt) {
        var i = 0;
        var lerpAcross = new Lerp(lerpLeft.interpolate(t), lerpRight.interpolate(t));
        pixels3D[j] = [];
        for (var s = 0; s <= 1.0; s += ds) {
            pixels3D[j][i] = lerpAcross.interpolate(s);
            // console.log(pixels3D[j][i]);
            rayCaster.castRayAndDraw(eye, {
                'view': { 'i': i, 'j': j },
                'position': pixels3D[j][i],
            });
            i++;
        }
        j++;
    }
    log(pixels3D[0][0]);
    log(pixels3D[pixels3D.length - 1][pixels3D[pixels3D.length - 1].length - 1]);
    context.putImageData(imgData, 0, 0);
}

/* run -- here is where execution begins after window load */
function run(inputLights, inputSpheres, inputTriangles) {
    // Get the canvas and context
    var canvas = document.getElementById("viewport"); 
    var context = canvas.getContext("2d");

    // TESTS
    // Vector.basicTest();

    drawSpheres(inputLights, inputSpheres, context);
}


// helpful notes: http://www.cs.cornell.edu/courses/cs4620/2011fa/lectures/08raytracingWeb.pdf
function main() {
    const INPUT_TRIANGLES_URL =
        "https://ncsucgclass.github.io/prog1/triangles.json";
    const INPUT_LIGHTS_URL =
        "https://ncsucgclass.github.io/prog1/lights.json";
    const INPUT_SPHERES_URL =
            "https://ncsucgclass.github.io/prog1/spheres.json";

    var spheres, lights, triangles;
    loadResource(INPUT_SPHERES_URL) // load the spheres
        .then(function (data) {
            spheres = JSON.parse(data);
            var sphere = null;
            for (var i = 0; i < spheres.length; i++) {
              sphere = spheres[i];
              var center = new Vector(sphere.x, sphere.y, sphere.z);
              sphere.center = center;
              delete sphere.x;
              delete sphere.y;
              delete sphere.z;
              sphere.ambient = new Vector(sphere.ambient[0], sphere.ambient[1], sphere.ambient[2]);
              sphere.diffuse = new Vector(sphere.diffuse[0], sphere.diffuse[1], sphere.diffuse[2]);
              sphere.specular = new Vector(sphere.specular[0], sphere.specular[1], sphere.specular[2]);
            }
            console.log("loaded spheres...");
            return loadResource("http://pastebin.com/raw/u69sdEiS   ");
        }).then(function (data) { // load the lights
            lights = JSON.parse(data);
            for (var i = 0; i < lights.length; i++) {
                lights[i] = new Light(lights[i]);
            }
            console.log("loaded lights...");
            return loadResource(INPUT_TRIANGLES_URL);
        }).then(function(data) { // load the triangles and start rendering
            // triangles = JSON.parse(data); // TODO
            console.log("loaded triangles...");
            run(lights, spheres, triangles);
        }).catch(function(err) {
            console.error("Failed to load all the resources: ", err.status);
        });
}
