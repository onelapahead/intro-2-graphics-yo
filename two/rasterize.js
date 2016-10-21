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
        gl.uniformMatrix4fv(transformLocation, false, models[i].transform);

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
  if (selected !== null) {
    var speed = 1.0;
    var rotateSpeed = 1.0;
    var mvmt = [0.0, 0.0, 0.0];
    var rotate = [0.0, 0.0, 0.0];

    var shift = downKeys[16];

    if (downKeys['K'.charCodeAt(0)]) {
      if (shift)
        rotate[1] += rotateSpeed;
      else
        mvmt[0] += speed;
    }

    if (downKeys[186]) { // semicolon
      if (shift)
        rotate[1] -= rotateSpeed;
      else
        mvmt[0] -= speed;
    }

    if (downKeys['O'.charCodeAt(0)]) {
      if (shift)
        rotate[0] += rotateSpeed;
      else
        mvmt[2] += speed;
    }

    if (downKeys['L'.charCodeAt(0)]) {
      if (shift)
        rotate[0] -= rotateSpeed;
      else
        mvmt[2] -= speed;
    }

    if (downKeys['I'.charCodeAt(0)]) {
      if (shift)
        rotate[2] += rotateSpeed;
      else
        mvmt[1] += speed;
    }

    if (downKeys['P'.charCodeAt(0)]) {
      if (shift)
        rotate[2] -= rotateSpeed;
      else
        mvmt[1] -= speed;
    }

    if (downKeys[8]) { // backspace
      mvmt = [0.0, 0.0, 0.0];
      mat4.identity(selected.transform);
    }

    mvmt = new vec3.fromValues(mvmt[0], mvmt[1], mvmt[2]);
    vec3.scale(mvmt, mvmt, dt);

    var translate = mat4.create();
    mat4.fromTranslation(translate, mvmt);

    mat4.multiply(selected.transform, translate, selected.transform);
    mat4.multiply(selected.center, translate, selected.center);

    var rotation = mat4.create();
    var temp = mat4.create();
    translate = vec3.create();
    vec3.negate(translate, vec3.fromValues(selected.center[0], selected.center[1], selected.center[2]));
    mat4.fromTranslation(rotation, translate);
    mat4.fromXRotation(temp, rotate[0] * dt);
    mat4.multiply(rotation, temp, rotation);
    mat4.fromYRotation(temp, rotate[1] * dt);
    mat4.multiply(rotation, temp, rotation);
    mat4.fromZRotation(temp, rotate[2] * dt);
    mat4.multiply(rotation, temp, rotation);
    translate = vec3.fromValues(selected.center[0], selected.center[1], selected.center[2]);
    mat4.fromTranslation(temp, translate);
    mat4.multiply(rotation, temp, rotation);

    mat4.multiply(selected.transform, rotation, selected.transform);

  }
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
    var rawSpheres = JSON.parse(data);
    var sphere;
    for (var i = 0; i < rawSpheres.length; i++) {
      sphere = new Sphere(rawSpheres[i], 32, 32);
      models.push(sphere.model);
      //console.log(rawSphere.model);
      spheres.push(sphere.model);
    }
    spherePtr = 0;

    return loadResource(INPUT_TRIANGLES_URL);
  }).then (function (data) {
    var rawTriangles = JSON.parse(data);
    for (var i = 0; i < rawTriangles.length; i++) {
      rawTriangles[i].material.shininess = 1.0;
      rawTriangles[i].transform = mat4.create();
      mat4.identity(rawTriangles[i].transform);
      calculateCOM(rawTriangles[i]);
      models.push(rawTriangles[i]);
      triangles.push(rawTriangles[i]);
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