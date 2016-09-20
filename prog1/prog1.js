function drawSpheres(inputSpheres, context) {
    var w = context.canvas.width,
        h = context.canvas.height,
        imgData = context.createImageData(w,h),
        ratio = w / h,
        size = 1;

    var eye = new Vector(1.5, 0.5, 0.5);
    var lookat = new Vector(-1, 0, 0);
    var lookup = new Vector(0, 1, 0);

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

    var light = {
        'position': new Vector(2,4,-0.5),
        'ambient': new Vector(1,1,1),
        'diffuse': new Vector(1,1,1),
        'specular': new Vector(1,1,1),
    };

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
    log(pixels3D[pixels3D.length - 1][pixels3D[pixels3D.length - 1].length - 1]);
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
