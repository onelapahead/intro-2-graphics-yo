/* GLOBAL CONSTANTS AND VARIABLES */

/* assignment specific globals */
const WIN_Z = 0;  // default graphics window z coord in world space
const WIN_LEFT = 0; const WIN_RIGHT = 1;  // default left and right x coords in world space
const WIN_BOTTOM = 0; const WIN_TOP = 1;  // default top and bottom y coords in world space
const INPUT_TRIANGLES_URL = "https://ncsucgclass.github.io/prog2/triangles.json"; // triangles file loc
const INPUT_SPHERES_URL = "https://ncsucgclass.github.io/prog2/spheres.json"; // spheres file loc
var oEye = new vec3.fromValues(0.5,0.5,-0.5); // default eye position in world space
var oLookAt = new vec3.fromValues(0.0, 0.0, 1.0);
var oLookUp = new vec3.fromValues(0.0, 1.0, 0.0);
var Eye = vec3.create();
var LookAt = vec3.create();
var LookUp = vec3.create();
var Target = vec3.create();
var Origin = new vec3.fromValues(0.0, 0.0, 0.0);

function resetCamera() {
  vec3.copy(Eye, oEye);
  vec3.copy(LookAt, oLookAt);
  vec3.normalize(LookAt, LookAt);
  vec3.copy(LookUp, oLookUp);
  vec3.normalize(LookUp, LookUp);
}
resetCamera();

var models = [];
var spheres = [];
var triangles = [];
var spherePtr = 0, trianglePtr = 0;
var selected = null;
var selectionState = null;
var start, dt;

var downKeys = new Array(128);

var Light = {
    position: new vec3.fromValues(2.0, 4.0, -0.5),
    ambient: new vec3.fromValues(1.0, 1.0, 1.0),
    diffuse: new vec3.fromValues(1.0, 1.0, 1.0),
    specular: new vec3.fromValues(1.0, 1.0, 1.0),
    positionView: vec3.create(),
};

var Highlight = {
  ambient: new vec3.fromValues(0.5, 0.5, 0.0),
  diffuse: new vec3.fromValues(0.5, 0.5, 0.0),
  specular: new vec3.fromValues(0.0, 0.0, 0.0),
  shininess: 1.0,
};

/* webgl globals */
var gl = null; // the all powerful gl object. It's all here folks!
var vertexBuffer; // this contains vertex coordinates in triples
var triangleBuffer; // this contains indices into vertexBuffer in triples
var normalBuffer;
var triBufferSize = 0; // the number of indices in the triangle buffer
var vertexPositionAttrib, // where to put position for vertex shader
    vertexNormalAttrib,
    lightProductLocation,
    viewProjectionLocation,
    viewLocation,
    normalLocation,
    lightLocation;

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
function loadTriangles() {
    if (models != String.null) {
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

        for (var whichSet=0; whichSet<models.length; whichSet++) {
            vec3.set(indexOffset,vtxBufferSize,vtxBufferSize,vtxBufferSize); // update vertex offset

            // set up the vertex coord array
            for (whichSetVert=0; whichSetVert<models[whichSet].vertices.length; whichSetVert++) {
                normToAdd = models[whichSet].normals[whichSetVert];
                vtxToAdd = models[whichSet].vertices[whichSetVert];
                coordArray.push(vtxToAdd[0],vtxToAdd[1],vtxToAdd[2]);
                normArray.push(normToAdd[0], normToAdd[1], normToAdd[2]);
            } // end for vertices in set
            
            // set up the triangle index array, adjusting indices across sets
            for (whichSetTri=0; whichSetTri<models[whichSet].triangles.length; whichSetTri++) {
                vec3.add(triToAdd,indexOffset,models[whichSet].triangles[whichSetTri]);
                indexArray.push(triToAdd[0],triToAdd[1],triToAdd[2]);
            } // end for triangles in set

            vtxBufferSize += models[whichSet].vertices.length; // total number of vertices
            triBufferSize += models[whichSet].triangles.length; // total number of tris
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
            float shininess;
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
            vec3 n = normalize(N);

            vec3 Idiff = lightProduct.diffuse * max(dot(n, L), 0.0);
            Idiff = clamp(Idiff, 0.0, 1.0);

            vec3 Ispec = lightProduct.specular * pow(max(dot(n, H), 0.0), 4.0 * lightProduct.shininess);
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
                lightProductLocation.shininess = gl.getUniformLocation(shaderProgram, "lightProduct.shininess");

                lightLocation = {};
                lightLocation.position = gl.getUniformLocation(shaderProgram, "light.position");
                lightLocation.ambient = gl.getUniformLocation(shaderProgram, "light.ambient");
                lightLocation.diffuse = gl.getUniformLocation(shaderProgram, "light.diffuse");
                lightLocation.specular = gl.getUniformLocation(shaderProgram, "light.specular");

                viewLocation = gl.getUniformLocation(shaderProgram, "view");
                normalLocation = gl.getUniformLocation(shaderProgram, "normalMatrix");
                viewProjectionLocation = gl.getUniformLocation(shaderProgram, "viewProjection");
            } // end if no shader program link errors
        } // end if no compile errors
    } // end try 
    
    catch(e) {
        console.log(e);
    } // end catch
} // end setup shaders

// render the loaded model
function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // clear frame/depth buffers

    var ratio = gl.canvas.width / gl.canvas.height;
    var view = mat4.create();
    mat4.lookAt(view, Eye, Target, LookUp);
    var projection = mat4.create();
    mat4.perspective(projection, Math.PI / 4, ratio, 0.5, 1.5);
    var viewProjection = mat4.create();
    mat4.multiply(viewProjection, projection, view);

    var normal = mat4.create();
    mat4.invert(normal, view);
    mat4.transpose(normal, normal);

    vec3.transformMat4(Light.positionView, Light.position, view);
    gl.uniform3fv(lightLocation.position, Light.positionView);
    gl.uniform3fv(lightLocation.ambient, Light.ambient);
    gl.uniform3fv(lightLocation.diffuse, Light.diffuse);
    gl.uniform3fv(lightLocation.specular, Light.specular);

    gl.uniformMatrix4fv(viewLocation, false, view);
    gl.uniformMatrix4fv(normalLocation, false, normal);
    gl.uniformMatrix4fv(viewProjectionLocation, false, viewProjection);  // for mat4 or mat4 array

    var trianglePtr = 0;
    var material;
    for (var i = 0; i < models.length; i++) {
        var lightProduct = {};
        lightProduct.ambient = vec3.create();
        if (models[i] !== selected)
          material = models[i].material;
        else
          material = Highlight;
        vec3.multiply(lightProduct.ambient, Light.ambient, material.ambient);

        lightProduct.diffuse = vec3.create();
        vec3.multiply(lightProduct.diffuse, Light.diffuse, material.diffuse);

        lightProduct.specular = vec3.create();
        vec3.multiply(lightProduct.specular, Light.specular, material.specular);

        lightProduct.shininess = material.shininess;

        gl.uniform3fv(lightProductLocation.ambient, lightProduct.ambient);
        gl.uniform3fv(lightProductLocation.diffuse, lightProduct.diffuse);
        gl.uniform3fv(lightProductLocation.specular, lightProduct.specular);
        gl.uniform1f(lightProductLocation.shininess, lightProduct.shininess);

        // vertex buffer: activate and feed into vertex shader
        gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffer); // activate
        gl.vertexAttribPointer(vertexPositionAttrib,3,gl.FLOAT,false,0,0); // feed

        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        gl.vertexAttribPointer(vertexNormalAttrib, 3, gl.FLOAT, false, 0, 0);

        // triangle buffer: activate and render
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,triangleBuffer); // activate
        gl.drawElements(gl.TRIANGLES,models[i].triangles.length * 3,gl.UNSIGNED_SHORT,trianglePtr * 2); // render
        trianglePtr += models[i].triangles.length * 3;
    }

} // end render triangles

function updateCamera(dt) {
  var speed = 1.0;
  var rotateSpeed = 1.0;
  var mvmt = [0.0, 0.0, 0.0];
  var rotate = [0.0, 0.0, 0.0];

  var shift = downKeys[16];

  if (downKeys['A'.charCodeAt(0)]) {
    if (shift)
      rotate[1] += rotateSpeed;
    else
      mvmt[0] += speed;
  }

  if (downKeys['D'.charCodeAt(0)]) {
    if (shift)
      rotate[1] -= rotateSpeed;
    else
      mvmt[0] -= speed;
  }

  if (downKeys['W'.charCodeAt(0)]) {
    if (shift)
      rotate[0] += rotateSpeed;
    else
      mvmt[2] += speed;
  }

  if (downKeys['S'.charCodeAt(0)]) {
    if (shift)
      rotate[0] -= rotateSpeed;
    else
      mvmt[2] -= speed;
  }

  if (downKeys['Q'.charCodeAt(0)]) {
    if (shift)
      rotate[2] += rotateSpeed;
    else
      mvmt[1] += speed;
  }

  if (downKeys['E'.charCodeAt(0)]) {
    if (shift)
      rotate[2] -= rotateSpeed;
    else
      mvmt[1] -= speed;
  }

  if (downKeys[27]) { // escape
    mvmt = [0.0, 0.0, 0.0];
    resetCamera();
  }

  mvmt = new vec3.fromValues(mvmt[0], mvmt[1], mvmt[2]);
  vec3.scale(mvmt, mvmt, dt);

  vec3.add(Eye, Eye, mvmt);

  vec3.add(Target, Eye, LookAt);

  vec3.rotateX(Target, Target, Eye, rotate[0] * dt);
  vec3.rotateY(Target, Target, Eye, rotate[1] * dt);
  vec3.rotateZ(Target, Target, Eye, rotate[2] * dt);
  vec3.sub(LookAt, Target, Eye);

  vec3.rotateX(LookUp, LookUp, Origin, rotate[0] * dt);
  vec3.rotateY(LookUp, LookUp, Origin, rotate[1] * dt);
  vec3.rotateZ(LookUp, LookUp, Origin, rotate[2] * dt);
  vec3.normalize(LookUp, LookUp);
}

const UP = 38, LEFT = 37, RIGHT = 39, DOWN = 40, SPACE = 32;
function updateSelection(dt) {
  //TODO
}

function changeSelection(key) {
  if (key == UP) {
    if (selected != null && selectionState == "spheres") {
      spherePtr = (spherePtr + 1) % spheres.length;
    }
    selected = spheres[spherePtr];
    selectionState = "spheres";
  }

  if (key == DOWN) {
    if (selected != null && selectionState == "spheres") {
      spherePtr--;
      if (spherePtr < 0)
        spherePtr += spheres.length;
    }
    selected = spheres[spherePtr];
    selectionState = "spheres";
  }

  if (key == LEFT) {
    if (selected != null && selectionState == "triangles") {
      trianglePtr = (trianglePtr + 1) % triangles.length;
    }
    selected = triangles[trianglePtr];
    selectionState = "triangles";
  }

  if (key == RIGHT) {
    if (selected != null && selectionState == "triangles") {
      trianglePtr--;
      if (trianglePtr < 0)
        trianglePtr += triangles.length;
    }
    selected = triangles[trianglePtr];
    selectionState = "triangles";
  }

  if (key == SPACE) {
    selectionState = null;
    selected = null;
  }
}

function update(dt) {
  updateCamera(dt);
  updateSelection(dt);
}


/* MAIN -- HERE is where execution begins after window load */

function main() {

  window.addEventListener("keydown", function (event) {
      var prev = downKeys[event.keyCode];
      downKeys[event.keyCode] = true;
      if (!prev) {
        var keypress = new CustomEvent("mykeypress", {detail: event.keyCode});
        window.dispatchEvent(keypress);
      }
  }, false);

  window.addEventListener("keyup", function (event) {
      downKeys[event.keyCode] = false;
  }, false);

  window.addEventListener("mykeypress", function (event) {
    changeSelection(event.detail); 
  }, false);

  function loop(now) {
    dt = now - start;
    start = now;
    
    update(dt / 1000);
    render();

    window.requestAnimationFrame(loop);
  }

  setupWebGL(); // set up the webGL environment
  loadResource(INPUT_SPHERES_URL).then(function (data) {
    var objs = JSON.parse(data);
    var obj;
    for (var i = 0; i < objs.length; i++) {
      obj = new Sphere(objs[i], 32, 32);
      models.push(obj.model);
      //console.log(obj.model);
      spheres.push(obj.model);
    }
    spherePtr = 0;

    return loadResource(INPUT_TRIANGLES_URL);
  }).then (function (data) {
    var objs = JSON.parse(data);
    for (var i = 0; i < objs.length; i++) {
      objs[i].material.shininess = 1.0;
      models.push(objs[i]);
      triangles.push(objs[i]);
    }
    trianglePtr = 0;

    loadTriangles();
    setupShaders(); // setup the webGL shaders
    start = performance.now();
    loop(start);
  }).catch(function (err) {
    console.error(err);
  }); // load in the triangles from tri file
  
} // end main