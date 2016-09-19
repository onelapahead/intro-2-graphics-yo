/* classes */ 
// Color constructor
class Color {
    constructor(r,g,b,a) {
        try {
            if ((typeof(r) !== "number") || (typeof(g) !== "number") || (typeof(b) !== "number") || (typeof(a) !== "number"))
                throw "color component not a number";
            else if ((r<0) || (g<0) || (b<0) || (a<0)) 
                throw "color component less than 0";
            else if ((r>255) || (g>255) || (b>255) || (a>255)) 
                throw "color component bigger than 255";
            else {
                this.r = r; this.g = g; this.b = b; this.a = a; 
            }
        } // end try
        
        catch (e) {
            console.log(e);
        }
    } // end Color constructor

        // Color change method
    change(r,g,b,a) {
        try {
            if ((typeof(r) !== "number") || (typeof(g) !== "number") || (typeof(b) !== "number") || (typeof(a) !== "number"))
                throw "color component not a number";
            else if ((r<0) || (g<0) || (b<0) || (a<0)) 
                throw "color component less than 0";
            else if ((r>255) || (g>255) || (b>255) || (a>255)) 
                throw "color component bigger than 255";
            else {
                this.r = r; this.g = g; this.b = b; this.a = a; 
            }
        } // end throw
        
        catch (e) {
            console.log(e);
        }
    } // end Color change method
} // end color class

/* utility functions */

// draw a pixel at x,y using color
function drawPixel(imagedata,x,y,color) {
    try {
        if ((typeof(x) !== "number") || (typeof(y) !== "number"))
            throw "drawpixel location not a number";
        else if ((x<0) || (y<0) || (x>=imagedata.width) || (y>=imagedata.height))
            throw "drawpixel location outside of image";
        else if (color instanceof Color) {
            var pixelindex = (y*imagedata.width + x) * 4;
            imagedata.data[pixelindex] = color.r;
            imagedata.data[pixelindex+1] = color.g;
            imagedata.data[pixelindex+2] = color.b;
            imagedata.data[pixelindex+3] = color.a;
        } else 
            throw "drawpixel color is not a Color";
    } // end try
    
    catch(e) {
        console.log(e);
    }
} // end drawPixel

function loadSpheres() {
    var req = new XMLHttpRequest();
    const INPUT_SPHERES_URL = 
        "https://ncsucgclass.github.io/prog1/spheres.json";

    function complete(evt) {
        var inputSpheres = JSON.parse(req.response);
        var sphere = null;
        for (var i = 0; i < inputSpheres.length; i++) {
          sphere = inputSpheres[i];
          var center = new Vector(sphere.x, sphere.y, sphere.z);
          sphere.center = center;
          delete sphere.x;
          delete sphere.y;
          delete sphere.z;
          sphere.ambient = new Vector(sphere.ambient[0], sphere.ambient[1], sphere.ambient[2]);
          sphere.diffuse = new Vector(sphere.diffuse[0], sphere.diffuse[1], sphere.diffuse[2]);
          sphere.specular = new Vector(sphere.specular[0], sphere.specular[1], sphere.specular[2]);
          sphere.n = 10;
        }
        run(inputSpheres);
    }

    function failed(evt) {
        console.log('shit failed yo...');
    }

    req.addEventListener('load', complete);
    req.addEventListener('error', failed);

    req.open('GET', INPUT_SPHERES_URL);
    req.send();
}

function log(str) {
  var cons = document.getElementById("console");
  cons.innerHTML += str.toString();
}
