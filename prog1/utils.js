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

// draw 2d projections read from the JSON file at class github
function drawInputSpheresUsingArcs(inputSpheres, context) {

    if (inputSpheres != String.null) { 
        var c = new Color(0,0,0,0); // the color at the pixel: black
        var w = context.canvas.width;
        var h = context.canvas.height;
        var n = inputSpheres.length; 
        //console.log("number of spheres: " + n);

        // Loop over the spheres, draw each in 2d
        for (var s=0; s<n; s++) {
            context.fillStyle = 
                "rgb(" + Math.floor(inputSpheres[s].diffuse[0]*255)
                +","+ Math.floor(inputSpheres[s].diffuse[1]*255)
                +","+ Math.floor(inputSpheres[s].diffuse[2]*255) +")"; // rand color
            context.beginPath();
            context.arc(
                Math.round(w*inputSpheres[s].x),
                Math.round(h*inputSpheres[s].y),
                Math.round(w*inputSpheres[s].r),
                0,2*Math.PI);
            context.fill();
            //console.log(context.fillStyle);
            //console.log("x: "+Math.round(w*inputSpheres[s].x));
            //console.log("y: "+Math.round(h*inputSpheres[s].y));
            //console.log("r: "+Math.round(w*inputSpheres[s].r));
        } // end for spheres
    } // end if spheres found
} // end draw input spheres
