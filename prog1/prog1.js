function drawSpheres(inputSpheres, context) {
    var w = context.canvas.width,
        h = context.canvas.height,
        imgData = context.createImageData(w,h),
        ratio = w / h,
        size = 1;

    var eye = new Vector(0.5, 0.5, -0.5);
    var lookat = new Vector(0, 0, 1);
    var lookup = new Vector(0, 1, 0);

    var windowDistance = 0.5;

    var windowDimensions = new Vector(ratio * size, size, 0);
    var windowCenter = eye.add(lookat.mult(windowDistance));
    var half = windowDimensions.div(2.0);
    var wLL = windowCenter.sub(half);
    var wLR = windowCenter.sub(new Vector(-half.x, half.y, 0));
    var wUR = windowCenter.add(half);
    var wUL = windowCenter.add(new Vector(-half.x, half.y, 0));
    console.log(wUL);
    console.log(wUR);
    console.log(wLL);
    console.log(wLR);
    delete half;

    var light = {
        'position': new Vector(2,4,-0.5),
        'ambient': new Vector(1,1,1),
        'diffuse': new Vector(1,1,1),
        'specular': new Vector(1,1,1),
    }

    var pixels3D = [];

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
            var params = {
                'eye': eye,
                'light': light,
                'pixel': {
                    'view': { 'i': i, 'j': j },
                    'position': pixels3D[j][i],
                },
                'spheres': inputSpheres,
                'imgData': imgData,
            };
            castRayAndDraw(params);
            i++;
        }
        j++;
    }
    log(pixels3D[0][0]);
    context.putImageData(imgData, 0, 0);
}

/* run -- here is where execution begins after window load */
function run(inputSpheres) {
    // Get the canvas and context
    var canvas = document.getElementById("viewport"); 
    var context = canvas.getContext("2d");

    // TESTS
    // Vector.basicTest();

    drawSpheres(inputSpheres, context);
}

function main() {
    // Anything else we want to do before....
    loadSpheres();
}
