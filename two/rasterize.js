/* GLOBAL CONSTANTS AND VARIABLES */

/* assignment specific globals */
const WIN_Z = 0;  // default graphics window z coord in world space
const WIN_LEFT = 0; const WIN_RIGHT = 1;  // default left and right x coords in world space
const WIN_BOTTOM = 0; const WIN_TOP = 1;  // default top and bottom y coords in world space
const INPUT_TRIANGLES_URL = "https://ncsucgclass.github.io/prog2/triangles.json"; // triangles file loc
const INPUT_SPHERES_URL = "https://ncsucgclass.github.io/prog2/spheres.json"; // spheres file loc
var Eye = new vec3.fromValues(0.5,0.5,-0.5); // default eye position in world space
var LookAt = new vec3.fromValues(0.0, 0.0, 1.0);
var LookUp = new vec3.fromValues(0.0, 1.0, 0.0);
var WindowDistance = 0.5;

var Light = {
    position: new vec3.fromValues(2.0, 4.0,-0.5),
    ambient: new vec3.fromValues(1.0, 1.0, 1.0),
    diffuse: new vec3.fromValues(1.0, 1.0, 1.0),
    specular: new vec3.fromValues(1.0, 1.0, 1.0),
};

/* webgl globals */
var gl = null; // the all powerful gl object. It's all here folks!
var vertexBuffer; // this contains vertex coordinates in triples
var triangleBuffer; // this contains indices into vertexBuffer in triples
var normalBuffer;
var triBufferSize = 0; // the number of indices in the triangle buffer
var vertexPositionAttrib; // where to put position for vertex shader
var vertexNormalAttrib;
var lightProductLocation, viewProjectionPosition, viewLocation, normalLocation, lightLocation;

// ASSIGNMENT HELPER FUNCTIONS

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

// set up the webGL environment
function setupWebGL() {

    // Get the canvas and context
    var canvas = document.getElementById("myWebGLCanvas"); // create a js canvas
    gl = canvas.getContext("webgl"); // get a webgl object from it
    
    try {
      if (gl == null) {
        throw "unable to create gl context -- is your browser gl ready?";
      } else {
        gl.clearColor(0.0, 0.0, 0.0, 1.0); // use black when we clear the frame buffer
        gl.clearDepth(1.0); // use max when we clear the depth buffer
        gl.enable(gl.DEPTH_TEST); // use hidden surface removal (with zbuffering)
      }
    } // end try
    
    catch(e) {
      console.log(e);
    } // end catch
 
} // end setupWebGL

// read triangles in, load them into webgl buffers
function loadTriangles(inputTriangles) {
    if (inputTriangles != String.null) {
        var whichSetVert; // index of vertex in current triangle set
        var whichSetTri; // index of triangle in current triangle set
        var coordArray = []; // 1D array of vertex coords for WebGL
        var normArray = []; // 1D array of norm coords for WebGL
        var indexArray = []; // 1D array of vertex indices for WebGL
        var vtxBufferSize = 0; // the number of vertices in the vertex buffer
        var vtxToAdd = []; // vtx coords to add to the coord array
        var normToAdd = null;
        var indexOffset = vec3.create(); // the index offset for the current set
        var triToAdd = vec3.create(); // tri indices to add to the index array

        for (var whichSet=0; whichSet<inputTriangles.length; whichSet++) {
            vec3.set(indexOffset,vtxBufferSize,vtxBufferSize,vtxBufferSize); // update vertex offset

            // set up the vertex coord array
            for (whichSetVert=0; whichSetVert<inputTriangles[whichSet].vertices.length; whichSetVert++) {
                normToAdd = inputTriangles[whichSet].normals[whichSetVert];
                vtxToAdd = inputTriangles[whichSet].vertices[whichSetVert];
                coordArray.push(vtxToAdd[0],vtxToAdd[1],vtxToAdd[2]);
                normArray.push(normToAdd[0], normToAdd[1], normToAdd[2]);
            } // end for vertices in set
            
            // set up the triangle index array, adjusting indices across sets
            for (whichSetTri=0; whichSetTri<inputTriangles[whichSet].triangles.length; whichSetTri++) {
                vec3.add(triToAdd,indexOffset,inputTriangles[whichSet].triangles[whichSetTri]);
                indexArray.push(triToAdd[0],triToAdd[1],triToAdd[2]);
            } // end for triangles in set

            vtxBufferSize += inputTriangles[whichSet].vertices.length; // total number of vertices
            triBufferSize += inputTriangles[whichSet].triangles.length; // total number of tris
        } // end for each triangle set 
        triBufferSize *= 3; // now total number of indices

        // console.log("coordinates: "+coordArray.toString());
        // console.log("numverts: "+vtxBufferSize);
        // console.log("indices: "+indexArray.toString());
        // console.log("numindices: "+triBufferSize);
        
        // send the vertex coords to webGL
        vertexBuffer = gl.createBuffer(); // init empty vertex coord buffer
        gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffer); // activate that buffer
        gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(coordArray),gl.STATIC_DRAW); // coords to that buffer

        normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normArray), gl.STATIC_DRAW);

        // send the triangle indices to webGL
        triangleBuffer = gl.createBuffer(); // init empty triangle index buffer
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleBuffer); // activate that buffer
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indexArray),gl.STATIC_DRAW); // indices to that buffer
    } // end if triangles found
} // end load triangles

// setup the webGL shaders
function setupShaders() {
    // define fragment shader in essl using es6 template strings
    var fShaderCode = `
        precision mediump float;
        struct material {
            vec3 ambient;
            vec3 diffuse;
            vec3 specular;
        };

        struct lightSource {
            vec3 position;
            vec3 ambient;
            vec3 diffuse;
            vec3 specular;
        };

        uniform lightSource light;
        uniform material lightProduct;

        varying vec3 V;
        varying vec3 N;

        void main(void) {
            vec3 L = normalize(light.position - V);
            vec3 E = normalize(-V);
            vec3 H = normalize(L + E);

            vec3 Idiff = lightProduct.diffuse * max(dot(N, L), 0.0);
            Idiff = clamp(Idiff, 0.0, 1.0);

            vec3 Ispec = lightProduct.specular * pow(max(dot(N, H), 0.0), 4.0);
            Ispec = clamp(Ispec, 0.0, 1.0);

            gl_FragColor = vec4(lightProduct.ambient + Idiff + Ispec, 1.0); // triangle's diffuse color only
        }
    `;
    
    // define vertex shader in essl using es6 template strings
    var vShaderCode = `

        uniform mat4 viewProjection;
        uniform mat4 view;
        uniform mat4 normalMatrix;
        attribute vec3 vertexNormal;
        attribute vec3 vertexPosition;

        varying vec3 N;
        varying vec3 V;

        void main(void) {
            gl_Position = vec4(vertexPosition, 1.0);
            V = vec3(view * gl_Position);
            vec4 N4 = normalMatrix * vec4(vertexNormal, 1.0);
            N = normalize(N4.xyz);
            gl_Position = viewProjection * gl_Position;
        }
    `;
    
    try {
        // console.log("fragment shader: "+fShaderCode);
        var fShader = gl.createShader(gl.FRAGMENT_SHADER); // create frag shader
        gl.shaderSource(fShader,fShaderCode); // attach code to shader
        gl.compileShader(fShader); // compile the code for gpu execution

        // console.log("vertex shader: "+vShaderCode);
        var vShader = gl.createShader(gl.VERTEX_SHADER); // create vertex shader
        gl.shaderSource(vShader,vShaderCode); // attach code to shader
        gl.compileShader(vShader); // compile the code for gpu execution
            
        if (!gl.getShaderParameter(fShader, gl.COMPILE_STATUS)) { // bad frag shader compile
            throw "error during fragment shader compile: " + gl.getShaderInfoLog(fShader);  
            gl.deleteShader(fShader);
        } else if (!gl.getShaderParameter(vShader, gl.COMPILE_STATUS)) { // bad vertex shader compile
            throw "error during vertex shader compile: " + gl.getShaderInfoLog(vShader);  
            gl.deleteShader(vShader);
        } else { // no compile errors
            var shaderProgram = gl.createProgram(); // create the single shader program
            gl.attachShader(shaderProgram, fShader); // put frag shader in program
            gl.attachShader(shaderProgram, vShader); // put vertex shader in program
            gl.linkProgram(shaderProgram); // link program into gl context

            if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) { // bad program link
                throw "error during shader program linking: " + gl.getProgramInfoLog(shaderProgram);
            } else { // no shader program link errors
                gl.useProgram(shaderProgram); // activate shader program (frag and vert)
                vertexPositionAttrib = // get pointer to vertex shader input
                    gl.getAttribLocation(shaderProgram, "vertexPosition"); 
                gl.enableVertexAttribArray(vertexPositionAttrib); // input to shader from array

                vertexNormalAttrib = gl.getAttribLocation(shaderProgram, "vertexNormal");
                gl.enableVertexAttribArray(vertexNormalAttrib);

                lightProductLocation = {};
                lightProductLocation.ambient = gl.getUniformLocation(shaderProgram, "lightProduct.ambient");
                lightProductLocation.diffuse = gl.getUniformLocation(shaderProgram, "lightProduct.diffuse");
                lightProductLocation.specular = gl.getUniformLocation(shaderProgram, "lightProduct.specular");

                lightLocation = {};
                lightLocation.position = gl.getUniformLocation(shaderProgram, "light.position");
                lightLocation.ambient = gl.getUniformLocation(shaderProgram, "light.ambient");
                lightLocation.diffuse = gl.getUniformLocation(shaderProgram, "light.diffuse");
                lightLocation.specular = gl.getUniformLocation(shaderProgram, "light.specular");

                viewLocation = gl.getUniformLocation(shaderProgram, "view");
                normalLocation = gl.getUniformLocation(shaderProgram, "normalMatrix");
                viewProjectionPosition = gl.getUniformLocation(shaderProgram, "viewProjection");
            } // end if no shader program link errors
        } // end if no compile errors
    } // end try 
    
    catch(e) {
        console.log(e);
    } // end catch
} // end setup shaders

// render the loaded model
function render(inputTriangles) {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // clear frame/depth buffers

    gl.uniform3fv(lightLocation.position, Light.position);
    gl.uniform3fv(lightLocation.ambient, Light.ambient);
    gl.uniform3fv(lightLocation.diffuse, Light.diffuse);
    gl.uniform3fv(lightLocation.specular, Light.specular);

    var ratio = gl.canvas.width / gl.canvas.height;
    var Target = vec3.create();
    vec3.add(Target, Eye, LookAt);
    console.log(Target);
    var view = mat4.create();
    mat4.lookAt(view, Eye, Target, LookUp);
    var projection = mat4.create();
    mat4.perspective(projection, ratio, Math.PI / 3.2, 0.1, 10.0);
    var viewProjection = mat4.create();
    mat4.multiply(viewProjection, projection, view);

    var normal = mat4.create();
    mat4.invert(normal, view);
    mat4.transpose(normal, normal);

    gl.uniformMatrix4fv(viewLocation, false, view);
    gl.uniformMatrix4fv(normalLocation, false, normal);
    gl.uniformMatrix4fv(viewProjectionPosition, false, viewProjection);  // for mat4 or mat4 array

    var trianglePtr = 0;
    for (var i = 0; i < inputTriangles.length; i++) {
        var lightProduct = {};
        lightProduct.ambient = vec3.create();
        vec3.multiply(lightProduct.ambient, Light.ambient, inputTriangles[i].material.ambient);

        lightProduct.diffuse = vec3.create();
        vec3.multiply(lightProduct.diffuse, Light.diffuse, inputTriangles[i].material.diffuse);

        lightProduct.specular = vec3.create();
        vec3.multiply(lightProduct.specular, Light.specular, inputTriangles[i].material.specular);

        gl.uniform3fv(lightProductLocation.ambient, lightProduct.ambient);
        gl.uniform3fv(lightProductLocation.diffuse, lightProduct.diffuse);
        gl.uniform3fv(lightProductLocation.specular, lightProduct.specular);

        // vertex buffer: activate and feed into vertex shader
        gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffer); // activate
        gl.vertexAttribPointer(vertexPositionAttrib,3,gl.FLOAT,false,0,0); // feed

        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        gl.vertexAttribPointer(vertexNormalAttrib, 3, gl.FLOAT, false, 0, 0);

        // triangle buffer: activate and render
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,triangleBuffer); // activate
        gl.drawElements(gl.TRIANGLES,inputTriangles[i].triangles.length * 3,gl.UNSIGNED_SHORT,trianglePtr * 2); // render
        trianglePtr += inputTriangles[i].triangles.length * 3;
    }

} // end render triangles


/* MAIN -- HERE is where execution begins after window load */

function main() {
  
  setupWebGL(); // set up the webGL environment
  loadResource(INPUT_TRIANGLES_URL).then(function (data) {
    var triangles = JSON.parse(data);
    loadTriangles(triangles);
    setupShaders(); // setup the webGL shaders
    render(triangles); // draw the triangles using webGL
  }).catch(function (err) {
    console.error(err);
  }); // load in the triangles from tri file
  
} // end main