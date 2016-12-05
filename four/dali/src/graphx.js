
// Rendering engine and interface

(function () {

// WebGL Utilities and Wrappers
// ----------------------------------------------------------------------
  var gl = null;
  var graphx = window.dali.graphx;
  // TODO globals from previous hws

  // set up the webGL environment
  graphx.init = function() {
    // Get the canvas and context
    var canvas = document.getElementById("myWebGLCanvas"); // get the js canvas
    gl = canvas.getContext("webgl"); // get a webgl object from it
    graphx.gl = gl;

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

  } // end init

  function loadModels() {
    // TODO
  }

  function loadShaders() {
    // TODO
  }

  graphx.load = function() {
    loadShaders();
    loadModels();
  };

  graphx.render = function() {
    /**
     * for each program in shaderPrograms
     *    get all opaque drawables that requested to draw associated with program
     *    for each model of drawables
     *      bind model position/normal/uv buffers to attributes
     *      for each texture of textures assoicated with model
     *        for each drawable with texture, model, shader
     *          render
     *    repeat for transparent objects with z-buffering off
     */

  };

  // SHADER
  graphx.Shader = function(options, base) {
    var self = window.dali.Object(base);
    self.setType('shader');

    var glShader;

    if (options == null || options.type == null || options.code == null)
      throw 'Missing shader options: ' + options;

    if (options.type == gl.VERTEX_SHADER) self.setType('vertex');
    else if (options.type == gl.FRAGMENT_SHADER) self.setType('fragment');
    else throw 'Invalid shader type: ' + options.type + ' must be WebGL shader type';

    if (!window.dali.isString(options.code))
      throw 'Invalid code: ' + options.code + 'must be a string';

    glShader = gl.createShader(options.type);
    gl.shaderSource(glShader, options.code);
    gl.compileShader(glShader);

    if (!gl.getShaderParameter(glShader, gl.COMPILE_STATUS)) { // bad shader compile
      var log = gl.getShaderInfoLog(glShader);
      gl.deleteShader(glShader);
      throw 'Error during shader compile: ' + log;
    }

    self.attachToProgram = function(glProgram) {
      // TODO error check for object type
      gl.attachShader(glProgram, glShader);
    };

    return self;
  };

  // SHADERPROGRAM
  // WRAPS GL'S SHADER PROGRAM AND CONTAINS PTRS
  graphx.ShaderProgram = function(options, base) {
    var self = window.dali.Object(base);
    self.setType('shaderprogram');

    var vShader;
    var fShader;
    var glProgram = gl.createProgram();

    if (options == null)
      throw 'Invalid options: ' + options;

    if (options.vShader == null || options.vShader.inherit == null || /vertex/i.test(options.vShader.inherit))
      throw 'Vertex Shader error: ' + options.vShader;
    vShader = options.vShader;
    vShader.attachToProgram(glProgram);

    if (options.fShader == null || options.fShader.inherit == null || /fragment/i.test(options.fShader.inherit))
      throw 'Fragment Shader error: ' + options.fShader;
    fShader = options.fShader;
    fShader.attachToProgram(glProgram);

    gl.linkProgram(glProgram);

    if (!gl.getProgramParameter(glProgram, gl.LINK_STATUS)) {
      var log = gl.getProgramLog(glProgram);
      gl.deleteProgram(glProgram);
      throw 'Error during shader program linking: ' + log;
    }

    // TODO get attrib and uniform pointers
    // TODO create setters for attrib buffers and uniforms
    // ...

    return self;
  };

  graphx.Color = function(options) {
    var self = {};

    function setColor(array, field) {
      if (!window.dali.isString(field)) throw 'Invalid key for setField in Material';
      if (!window.dali.isNumber(array[0]) || !window.dali.isNumber(array[1]) || !window.dali.isNumber(array[2]))
        throw 'Invalid type for element in array: ' + array;
      // TODO check values
      self[field] = vec3.fromValues(array[0], array[1], array[2]);
    }

    function setColorFromOptions(field, options) {
      if (options[field] != null && window.dali.isArray(options[field]) && options[field].length == 3)
        setColor(options[field], field);
      else
        setColor([1, 1, 1], field);
    }

    function setDefaults() {
      setColor([1, 1, 1], 'ambient');
      setColor([1, 1, 1], 'diffuse');
      setColor([1, 1, 1], 'specular');
    }

    if (options == null)
      setDefaults();

    setColorFromOptions('ambient', options);
    setColorFromOptions('diffuse', options);
    setColorFromOptions('specular', options);

    return self;
  };

  const DEFAULT_MATERIAL_SHININESS = 1.0;
  graphx.Material = function(options, base) {
    var self = window.dali.Object(graphx.Color(options));
    self.setType('material');

    function setExponent(n) {
      if (n != null && window.dali.isNumber(n))
        self.n = n;
      else
        self.n = DEFAULT_MATERIAL_SHININESS;
    }

    if (options == null) setExponent();
    else setExponent(options.n);

    return self;
  };

// 3D Graphics 
// -----------------------------------------------------------

  graphx.g3D.ShaderProgram3D = function(options, base) {
    var self = graphx.ShaderProgram(options, base);
    self.setType('shaderprogram3d');

    return self;
  };

  // CAMERA ENTITY
  graphx.g3D.Camera = function(options, base) {
    var self = window.dali.Entity(options, base);
    self.setType('camera3d');

    var handedness;
    var projection;
    var lookUp, lookAt;
    var eyeDistance;
    var hpMatrix = mat4.create(); // handedness-projection matrix
    var vMatrix = mat4.create(); // view
    self.hpvMatrix = mat4.create();

    function setHandedness(array) {
      if (array == null || !window.dali.isArray(array) || array.length != 3) array = [-1, 1, 1];
      handedness = vec3.fromValues(array[0], array[1], array[2]); 
    }

    function setProjection(options) {
      options = options || {};
      projection = {
        fovY: options.fovY || 0.5 * Math.PI,
        near: options.near || 1,
        far: options.far || 10,
        aspect: gl.canvas.width / gl.canvas.height,
      };
    }

    function resizeAspect() {
      if (projection == null) setProjection();
      else
        projection.aspect = gl.canvas.width / gl.canvas.height;
    }

    function setView(options) {
      if (options == null) options = {};

      if (options.lookAt != null && window.dali.isArray(options.lookAt) && options.lookAt.length == 3)
        lookAt = vec3.fromValues(options.lookAt[0], options.lookAt[1], options.lookAt[2]);
      else
        lookAt = vec3.fromValues(0, 0, 1);

     if (options.lookUp != null && window.dali.isArray(options.lookUp) && options.lookUp.length == 3)
        lookUp = vec3.fromValues(options.lookUp[0], options.lookUp[1], options.lookUp[2]);
      else
        lookUp = vec3.fromValues(0, 1, 0);

      self.transform.setRotationFromAxes({
        at: lookAt,
        up: lookUp
      });

      eyeDistance = options.eyeDistance || 1.0;       
    }

    self.updateHandProjMatrix = function() {
      var hMatrix = mat4.create();
      var pMatrix = mat4.create();

      mat4.fromScaling(hMatrix, handedness);
      
      resizeAspect();
      mat4.perspective(pMatrix, projection.fovY, projection.aspect, projection.near, projection.far);
      
      mat4.multiply(hpMatrix, hMatrix, pMatrix);
    };

    self.updateViewMatrix = function() {
      var Transform = self.transform.toMatrix();

      var Up = vec4.fromValues(lookUp[0], lookUp[1], lookUp[2], 0.0);
      vec4.transformMat4(Up, Up, Transform);
      vec4.normalize(Up, Up);

      var Eye = self.transform.getPosition().vec3();

      var Center = vec4.fromValues(lookAt[0], lookAt[1], lookAt[2], 0.0);
      vec4.transformMat4(Center, Center, Transform);
      vec4.normalize(Center, Center);
      vec3.scale(Center, Center, eyeDistance);
      vec3.add(Center, Eye, Center);

      // console.log(Eye);
      // console.log(Center);
      // console.log(Up);

      mat4.lookAt(vMatrix, Eye, Center, Up);
      mat4.multiply(self.hpvMatrix, hpMatrix, vMatrix);
    };

    function init(options) {
      options = options || {};
      
      setHandedness(options.handedness);
      setProjection(options);
      self.updateHandProjMatrix();
      setView(options);
      self.updateViewMatrix();
    }
    init(options);

    self.update = function(dt) {
      // set up handedness, projection and view
      self.updateViewMatrix();
    };

    return self;
  };

  graphx.g3D.Light = function(options, base) {
    var self = window.dali.Entity(options, base);
    self.setType('light3d');
    self.color = graphx.Color(options);

    // TODO

    return self;
  };

  graphx.g3D.Texture = function(options, base) {
    var self = window.dali.Object(base);
    self.setType('texture3d');

    if (options == null) throw 'Invalid options: ' + options;

    // TODO edit
    // used for loading images to be used as textures
    function loadTexture(obj, url) {
      return new Promise(function(resolve, reject) {
        obj.glTexture = gl.createTexture();
        obj.img = new Image();
        obj.img.crossOrigin = "anonymous";
        obj.img.onload = function () {
          console.log(url);
          // test if the image has a transparent pixel using imgData
          var canvas = document.createElement("canvas");
          var ctx = canvas.getContext("2d");

          canvas.width = obj.img.width;
          canvas.height = obj.img.height;

          ctx.drawImage(obj.img, 0, 0);
          var imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
          obj.isTranslucentTexture = false;
          for (var i = 0; i < imgData.length; i+=4) {
            if (imgData[i + 3] < 255) {
                obj.isTranslucentTexture = true;
                break;
            }
          }

          ctx.clearRect(0, 0, canvas.width, canvas.height);
          delete canvas;
          delete ctx;

          gl.bindTexture(gl.TEXTURE_2D, obj.glTexture);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, obj.img);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
          gl.generateMipmap(gl.TEXTURE_2D);
          gl.bindTexture(gl.TEXTURE_2D, null);

          resolve(true);
        };
        obj.img.onerror = function() {
            reject({ status: "Failed to load texture: " + url });
        }
        obj.img.src = url;
      });
    }

    // creates a "texture" of a solid color. used to create the blank, default texture
    // 0 - 255
    function createSolidTexture(r, g, b, a) {
      if (!dali.isNumber(r) || !dali.isNumber(g) || !dali.isNumber(b) || !dali.isNumber(a))
        throw 'Invalid arguments to createSolidTexture';
      var data = new Uint8Array([r, g, b, a]);
      glTexture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, glTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.bindTexture(gl.TEXTURE_2D, null);
    }

    var glTexture;
    if (options.url != null) {
      // TODO
    } else if (options.r != null && options.g != null && options.b != null && options.a != null) {
      createSolidTexture(options.r, options.g, options.b, options.a);
    }

    return self;
  };

  // MODEL FOR DRAWERS
  graphx.g3D.Model = function(options, base) {
    var self = window.dali.Object(base);
    self.setType('model');

    if (options == null)
      throw 'No options given for model';

    if (options.mesh == null || options.mesh.inherit == null || !/mesh/i.test(options.mesh.inherit))
      throw 'Invalid mesh object: ' + options.mesh;

    var mesh = options.mesh;
    var transform = mat4.create();

    // TODO make model transform from initial position, rotation, scale of model

    return self;
  };

  // MESH
  graphx.g3D.Mesh = function(options, base) {
    var self = window.dali.Object(base);
    self.setType('mesh');


    var bufferInfo;
    /** TODO createBufferInfo object
     *     var arrays = {
     *       position: { numComponents: 3, data: [0, 0, 0, 10, 0, 0, 0, 10, 0, 10, 10, 0], },
     *       texcoord: { numComponents: 2, data: [0, 0, 0, 1, 1, 0, 1, 1],                 },
     *       normal:   { numComponents: 3, data: [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],     },
     *       indices:  { numComponents: 3, data: [0, 1, 2, 1, 2, 3],                       },
     *     };
     * 
     *  Creates an BufferInfo like this
     *
     *     bufferInfo = {
     *       numElements: 4,        // or whatever the number of elements is
     *       indices: WebGLBuffer,  // this property will not exist if there are no indices
     *       attribs: {
     *         a_position: { buffer: WebGLBuffer, numComponents: 3, },
     *         a_normal:   { buffer: WebGLBuffer, numComponents: 3, },
     *         a_texcoord: { buffer: WebGLBuffer, numComponents: 2, },
     *       },
     *     };
     *
     */
    self.createBufferInfo = function(data) {
      data = data.data || data;


    };

    function createAttribs(data) {

    }

    return self;
  };

  // PLANEMESH

  // CUBEMESH

  // SPHEREMESH
  graphx.g3D.SphereMesh = function(options, base) {
    var self = window.dali.Mesh(base);
    self.setType('spheremesh');

    // TODO

    return self;
  };

  // TRIMESH
  graphx.g3D.TriMesh = function(options, base) {
    var self = window.dali.Mesh(base);
    self.setType('trimesh');

    // TODO

    return self;
  };

  graphx.g3D.Text = function(options, base) {
    var self = window.dali.Object(base);
    self.setType('text3d');

    // TODO

    return self;
  };

  // 2D Graphics for Sprites and UI
  // ------------------------------------------------------------

  graphx.g2D.ShaderProgram2D = function(options, base) {
    var self = graphx.ShaderProgram(options, base);
    self.setType('shaderprogram2d');

    // TODO

    return self;
  };

  graphx.g2D.Text = function(options, base) {
    var self = window.dali.Object(base);
    self.setType('text2d');

    // TODO

    return self;
  };

  graphx.g2D.Sprite = function(options, base) {
    var self = window.dali.Object(base);
    self.setType('sprite');

    // TODO

    return self;
  };

}) ();

// define vertex shader in essl using es6 template strings
dali.graphx.g3D.vShaderCodeDefault = `
  attribute vec3 aVertexPosition; // vertex position
  attribute vec3 aVertexNormal; // vertex normal
  attribute vec2 aVertexTextureCoords; // vertex uv

  uniform mat4 umMatrix; // the model matrix
  uniform mat4 upvmMatrix; // the project view model matrix

  varying vec3 vWorldPos; // interpolated world position of vertex
  varying vec3 vVertexNormal; // interpolated normal for frag shader
  varying highp vec2 vTextureCoords; // interpolated uv

  void main(void) {

      // vertex position
      vec4 vWorldPos4 = umMatrix * vec4(aVertexPosition, 1.0);
      vWorldPos = vec3(vWorldPos4.x,vWorldPos4.y,vWorldPos4.z);
      gl_Position = upvmMatrix * vec4(aVertexPosition, 1.0);

      // vertex normal (assume no non-uniform scale)
      vec4 vWorldNormal4 = umMatrix * vec4(aVertexNormal, 0.0);
      vVertexNormal = normalize(vec3(vWorldNormal4.x,vWorldNormal4.y,vWorldNormal4.z));

      vTextureCoords = aVertexTextureCoords;
  }
`;

// define fragment shader in essl using es6 template strings
dali.graphx.g3D.fShaderCodeDefault = `
  precision mediump float; // set float to medium precision

  // eye location
  uniform vec3 uEyePosition; // the eye's position in world

  // lights informations
  uniform int uNumLights; // actual number of lights
  #define MAX_LIGHTS 20 // allowed max
  uniform vec3 uLightPositions[MAX_LIGHTS]; // array of light positions

  struct material {
    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
    float shininess;
  };
  uniform material uLightProducts[MAX_LIGHTS]; // array of lightProducts (material * light)

  // geometry properties
  varying vec3 vWorldPos; // world xyz of fragment
  varying vec3 vVertexNormal; // normal of fragment

  varying highp vec2 vTextureCoords; // interpolated uv
  uniform sampler2D uTexture; // texture sampler
  uniform float uAlpha; // material alpha

  void main(void) {
    vec3 color = vec3(0.0, 0.0, 0.0);
    for (int i = 0; i < MAX_LIGHTS; i++) {
      if (i >= uNumLights) break;
      vec3 L = normalize(uLightPositions[i] - vWorldPos);
      vec3 E = normalize(uEyePosition - vWorldPos);
      vec3 H = normalize(L + E);
      vec3 n = normalize(vVertexNormal);

      vec3 Idiff = uLightProducts[i].diffuse * max(dot(n, L), 0.0);
      Idiff = clamp(Idiff, 0.0, 1.0);

      vec3 Ispec = uLightProducts[i].specular * pow(max(dot(n, H), 0.0), 4.0 * uLightProducts[i].shininess);
      Ispec = clamp(Ispec, 0.0, 1.0);

      color = clamp(color + uLightProducts[i].ambient + Idiff + Ispec, 0.0, 1.0);
    }

    gl_FragColor = vec4(color, uAlpha) * texture2D(uTexture, vec2(vTextureCoords.s, vTextureCoords.t));
  }
`;