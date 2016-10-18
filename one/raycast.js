/**
 * Homework 1: Raycasting
 * author: Hayden Fuss
 * description:
 *      A JS program that uses the HTML5 canvas to display 3D scence rendered using ray casting.
 *      The program loads in two JSON files containing data about the spheres and lights in the 
 *      scene. Shading is done using a Blinn-Phong model. Multiple lights and shadows are supported
 *      as well as arbitrary screen sizes and viewing setups.
 * date: 09/23/2016
 */

// Code from Dr. Watson
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

/** A wrapper class for converting the given light object and arrays into Vectors. */
class Light {
    constructor(params) {
        this.position = new Vector(params.x, params.y, params.z);
        this.ambient = new Vector(params.ambient[0], params.ambient[1], params.ambient[2]);
        this.diffuse = new Vector(params.diffuse[0], params.diffuse[1], params.diffuse[2]);
        this.specular = new Vector(params.specular[0], params.specular[1], params.specular[2]);
    }
}

/* utility functions */

// Code from Dr. Watson
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

/** Function for loading a URL resource, like the JSON files. */
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

/** A simple Vector class. */
class Vector {
    constructor(x,y,z) {
        try {
            if (((typeof(x)) !== "number") || ((typeof(y)) !== "number") || ((typeof(z)) !== "number")) {
                console.log(typeof(x));
                throw "vector component not a number";
            } else
                this.x = x; this.y = y; this.z = z; 
        } // end try
        catch (e) {
            console.log(e);
        }
    }

    add(v) {
        return new Vector(this.x+v.x, this.y+v.y, this.z+v.z);
    }

    sub(v) {
        return new Vector(this.x-v.x, this.y-v.y, this.z-v.z);
    }

    mult(c) {
        if (c instanceof Vector) {
          return new Vector(this.x*c.x, this.y*c.y, this.z*c.z);
        }
        return new Vector(this.x*c, this.y*c, this.z*c);
    }

    div(c) {
        return new Vector(this.x/c, this.y/c, this.z/c);
    }

    dot(v) {
        return this.x*v.x + this.y*v.y + this.z*v.z;
    }

    cross(v) {
        return new Vector(
            this.y*v.z - this.z*v.y,
            this.z*v.x - this.x*v.z,
            this.x*v.y - this.y*v.x
        );
    }

    toString() {
        return '{ ' + this.x +  ', ' + this.y + ', ' + this.z + ' }'; 
    }

    get mag() {
      return Math.sqrt(this.magSq);
    }

    get magSq() {
      return this.x * this.x + this.y * this.y + this.z * this.z;
    }

    unit() {
      return this.div(this.mag);
    }

    static basicTest() {
        var a = new Vector(0,0,0);
        var b = a.sub(new Vector(1,1,1));
        var c = b.div(-0.5);

        log(a);
        log(b);
        log(c);

        var v = new Vector(1,0,0);
        var x = v.cross(new Vector(0,1,0));
        log(x);
        log(v.dot(x));

        log(b.unit());
    }
}

/** A bilinear interpolation class made from two Vectors. Used for pixels and rays. */
class Lerp {
  constructor(a,b) {
    this.a = a;
    this.d = b.sub(a);
  }

  interpolate(t) {
    return this.a.add(this.d.mult(t));
  }
}

/** CONSTANTS */
const EPSILON = 0.00001; // Used for checking if zero
const BIAS = 0.01; // Used for shadow rays to prevent self-intersection

/** 
 * The class that does all the work. Given a list of lights and spheres
 * it populates the image data with the scene. 
 */
class RayCaster {
  constructor(lights, spheres, imgData) {
    this.lights = lights;
    this.spheres = spheres;
    this.imgData = imgData;
  }

  /** For casting eye rays and putting a color at a given pixel. */
  castRayAndDraw(eye, pixel) {
    var ray = new Lerp(eye, pixel.position);

    var intersection = this.castRay(ray, true);

    if (typeof(intersection.i) !== 'undefined') {
      var sphere = this.spheres[intersection.i];
      var c = this.blinnPhongShader(sphere, ray, intersection.t);
      drawPixel(this.imgData, pixel.view.i, pixel.view.j, c);
    } else {
      drawPixel(this.imgData, pixel.view.i, pixel.view.j, new Color(0,0,0,255));
    }
  }

  /** 
   * Casts a ray given a Lerp. closest determines if it looking for 
   * the closest intersection or any intersion. The first mode is used for
   * eye rays, the second mode is used for shadow rays.
   */ 
  castRay(ray, closest) {
    var intersection = { 't': Number.MAX_VALUE };
    var n = this.spheres.length;
    for (var i = 0; i < n; i++) {
      var a = ray.d.dot(ray.d);
      var ec = ray.a.sub(this.spheres[i].center);
      var b = 2 * ray.d.dot(ec);
      var c = ec.dot(ec) - this.spheres[i].r * this.spheres[i].r;
      var disc = b*b - 4*a*c;
      var t = null;
      if (disc < -EPSILON) {
        continue; // no intersection
      } else if (disc > EPSILON) {
        var t0 = (-b + Math.sqrt(disc)) / (2 * a);
        var t1 = (-b - Math.sqrt(disc)) / (2 * a);
        if (t1 < t0)
          t = t1;
        else
          t = t0;
      } else {
        t = -b / (2 * a);
      }
      if (t < intersection.t && t >= 0.0) {
        intersection.t = t;
        intersection.i = i;
        if (!closest) break;
      }
    }
    return intersection;
  }

  blinnPhongShader(sphere, ray, t) {
    var point = ray.interpolate(t);
    var normal = point.sub(sphere.center);
    normal = normal.unit();

    var ambient = new Vector(0, 0, 0);
    var diffuse = new Vector(0, 0, 0);
    var specular = new Vector(0, 0, 0);

    // multiple lights
    for (var i = 0; i < this.lights.length; i++) {

      ambient = ambient.add(this.lights[i].ambient);

      // shadows
      // src for using bias to fix self-intersection problem:
      // http://www.scratchapixel.com/lessons/3d-basic-rendering/introduction-to-shading/ligth-and-shadows
      var shadowRay = new Lerp(point.add(normal.mult(BIAS)), this.lights[i].position);
      var intersection = this.castRay(shadowRay);

      if (typeof(intersection.i) === 'undefined') {
        var l = this.lights[i].position.sub(point);
        var v = ray.a.sub(point);
        l = l.unit();
        v = v.unit();
        var h = l.add(v);
        h = h.unit();

        var nl = normal.dot(l);
        var nh = normal.dot(h);
        if (nh < 0) nh = 0;
        if (nl < 0) nl = 0;
        // n' = 4n, n' is for Blinn-Phong, n is for Phong
        // src: https://en.wikipedia.org/wiki/Blinn–Phong_shading_model
        nh = Math.pow(nh, 4 * sphere.n);

        diffuse = diffuse.add(this.lights[i].diffuse.mult(nl));
        specular = specular.add(this.lights[i].specular.mult(nh));
      }
    }

    var coeff = ambient.mult(sphere.ambient).add(diffuse.mult(sphere.diffuse)).add(specular.mult(sphere.specular));
    if (coeff.x > 1.0) coeff.x = 1.0;
    if (coeff.y > 1.0) coeff.y = 1.0;
    if (coeff.z > 1.0) coeff.z = 1.0;
    return new Color(255*coeff.x, 255*coeff.y, 255*coeff.z, 255);
  }
}

/** GLOBALS */
var lights, spheres, context, w, h, imgData;
var eye = new Vector(0.5, 0.5, -0.5), lookat = new Vector(0, 0, 1), lookup = new Vector(0, 1, 0);

/** Draws the actual scene */
function draw() {
    w = context.canvas.width;
    h = context.canvas.height;
    var ratio = w / h,
        size = 1;
    imgData = context.createImageData(w,h);
    lookat = lookat.unit();
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
    var rayCaster = new RayCaster(lights, spheres, imgData);
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
    console.log(pixels3D[0][0]);
    console.log(pixels3D[pixels3D.length - 1][pixels3D[pixels3D.length - 1].length - 1]);

    context.putImageData(imgData, 0, 0);
}

/** Loads all the resources and calls the initial draw. */
function main() {
    const INPUT_TRIANGLES_URL =
        "https://ncsucgclass.github.io/prog1/triangles.json";
    const INPUT_LIGHTS_URL =
        "https://ncsucgclass.github.io/prog1/lights.json";
    const INPUT_SPHERES_URL =
            "https://ncsucgclass.github.io/prog1/spheres.json";

    // Get the canvas and context
    var canvas = document.getElementById("viewport"); 
    context = canvas.getContext("2d");

    w = context.canvas.width;
    h = context.canvas.height;

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
            return loadResource(INPUT_LIGHTS_URL);
        }).then(function (data) { // load the lights
            lights = JSON.parse(data);
            for (var i = 0; i < lights.length; i++) {
                lights[i] = new Light(lights[i]);
            }
            console.log("loaded lights...");
            draw();
        }).catch(function(err) {
            console.error("Failed to load all the resources: ", err);
        });
}

/** 
 * Called when the Render button is clicked and the HTML form is
 * submitted. The canvas is cleared, then inputs are validated
 * before calling draw.
 */
function render() {
    context.clearRect(0,0,w,h);
    try {
        var form = document.getElementById('ui');
        if (form.width.value == '') {
            throw "Invalid width";
        } else if (form.height.value == '') {
            throw "Invalid height";
        } else if (form.eye_x.value == '' || form.eye_y.value == '' || form.eye_z == '') {
            throw "Invalid xyz coordinates for eye";
        } else if (form.lookat_x.value == '' || form.lookat_y.value == '' || form.lookat_z == '') {
            throw "Invalid xyz coordinates for lookat";
        } else if (form.lookup_x.value == '' || form.lookup_y.value == '' || form.lookup_z == '') {
            throw "Invalid xyz coordinates for lookup";
        }

        context.canvas.width = Number(form.width.value);
        context.canvas.height = Number(form.height.value);
        eye = new Vector(Number(form.eye_x.value), Number(form.eye_y.value), Number(form.eye_z.value));        
        lookat = new Vector(Number(form.lookat_x.value), Number(form.lookat_y.value), Number(form.lookat_z.value));  
        lookup = new Vector(Number(form.lookup_x.value), Number(form.lookup_y.value), Number(form.lookup_z.value));  

        var check = lookat.dot(lookup);
        if (check < -EPSILON || check > EPSILON) {
            throw "Lookat vector is not normal to lookup";
        }

        draw();
    } catch (err) {
        alert(err);
    }
    return false;
}
