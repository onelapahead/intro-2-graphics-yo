
// TODO
// ----------------------------------
// Parsing .mtl files
// Bump mapping
// Directional lights
// UI/2D shaders and objects
// Text
// Light octree per object
// Some priority queues
// Translucent objects
// BSP for transparent objects?
// Mesh boundaries and correcting mesh centers


// Rendering engine and interface
// helpful source: http://webglfundamentals.org/webgl/lessons/webgl-boilerplate.html
(function () {

// WebGL Utilities and Wrappers
// ----------------------------------------------------------------------
  var gl = null;
  var graphx = window.dali.graphx;

  // set up the webGL environment
  graphx.load = function() {
    // Get the canvas and context
    gl = dali.canvas.getContext("webgl"); // get a webgl object from it
    graphx.gl = gl;

    try {
      if (gl == null) {
        throw "unable to create gl context -- is your browser gl ready?";
      } else {
        gl.clearColor(0.0, 0.0, 0.0, 1.0); // use black when we clear the frame buffer
        gl.clearDepth(1.0); // use max when we clear the depth buffer
        gl.enable(gl.DEPTH_TEST); // use hidden surface removal (with zbuffering)
      
        gl.getExtension("OES_standard_derivatives");
        gl.getExtension("EXT_shader_texture_lod");

      }
    } // end try
    catch(e) {
      console.log(e);
    } // end catch

  } // end init

  var shaderQueue = []; // TODO make it a heap
  var shaders = window.dali.ObjectManager('shaderprogram');
  var shader3d;

  graphx.g3D._getDefaultShader = function() { return shader3d; };

  // prereq: load, addProgram
  graphx.init = function() {
    if (shader3d == null) {
      shader3d = graphx.g3D.ShaderProgram3D();
      graphx.addProgram(shader3d);
    }

    for (var shaderInfo of shaderQueue) {
      shaders.getObj(shaderInfo.guid).init();
    }
  };

  // prereq: init
  graphx.render = function() {
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // clear frame/depth buffers

    var shader;
    for (var shaderInfo of shaderQueue) {
      shader = shaders.getObj(shaderInfo.guid);
      shader.render();
      shader.clearRequests();
    }
  };

  // prereq: load
  graphx.addProgram = function(program, priority) {
    if (priority == null || !window.dali.isNumber(priority)) priority = 0;
    shaders.add(program);
    for (var i = 0; i <= shaderQueue.length; i++) {
      if (i == shaderQueue.length || shaderQueue[i].priority > priority) {
        shaderQueue.splice(
          i,
          0, 
          { 'priority': priority, guid: program.dGUID }
        );
        break;
      }
    }
  };

  // prereq: init
  function requestRender(options, shaderGuid) {
    // TODO error check
    var shader = shaders.getObj(shaderGuid);
    shader.requestRender(options);
  };

  graphx.Color = function(options) {
    var self = {};

    function setColor(array, field) {
      if (!window.dali.isString(field)) throw 'Invalid key for setField in GMaterial';
      if (!window.dali.isNumber(array[0]) || !window.dali.isNumber(array[1]) || !window.dali.isNumber(array[2]))
        throw 'Invalid type for element in array: ' + array;
      // TODO check values
      self[field] = vec3.fromValues(array[0], array[1], array[2]);
    }

    function setColorFromOptions(field, options) {
      if (options != null && options[field] != null && window.dali.isArray(options[field]) && options[field].length == 3)
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

  const DEFAULT_MATERIAL_SHININESS = 20.0;
  graphx.GMaterial = function(options, base) {
    var self = window.dali.Object(graphx.Color(options));
    self.setType('material');

    options = options || {};

    self.shininess = options.shininess || DEFAULT_MATERIAL_SHININESS;
    self.alpha = options.alpha || 1.0;

    self.isTranslucent = function() {
      return self.alpha < 1.0;
    };

    return self;
  };

  // SHADER
  // prereq: load
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
  // prereq: load
  graphx.ShaderProgram = function(options, base) {
    var self = window.dali.Object(base);
    self.setType('shaderprogram');

    var vShader;
    var fShader;
    var glProgram = gl.createProgram();

    if (options == null)
      throw 'Invalid options: ' + options;

    if (options.vShader == null || options.vShader.inherit == null || !options.vShader.isType('vertex'))
      throw 'Vertex Shader error: ' + options.vShader;
    vShader = options.vShader;
    vShader.attachToProgram(glProgram);

    if (options.fShader == null || options.fShader.inherit == null || !options.fShader.isType('fragment'))
      throw 'Fragment Shader error: ' + options.fShader;
    fShader = options.fShader;
    fShader.attachToProgram(glProgram);

    gl.linkProgram(glProgram);

    if (options.attribs == null)
      throw 'Attribs info error';
    var attribs = options.attribs;

    if (options.uniforms == null)
      throw 'Uniform info error';
    var uniforms = options.uniforms;

    if (!gl.getProgramParameter(glProgram, gl.LINK_STATUS)) {
      var log = gl.getProgramLog(glProgram);
      gl.deleteProgram(glProgram);
      throw 'Error during shader program linking: ' + log;
    }

    self.use = function() {
      gl.useProgram(glProgram);
    };

    var uniformFunctions = {};
    function setUniformFunctions() {
      uniformFunctions[gl.FLOAT] = function (loc, arr) { gl.uniform1f(loc, arr); };
      uniformFunctions[gl.INT] = function (loc, arr) { gl.uniform1i(loc, arr); };
      uniformFunctions[gl.FLOAT_VEC3] = function (loc, arr) { gl.uniform3fv(loc, arr); };
      uniformFunctions[gl.FLOAT_MAT4] = function(loc, arr) {
        gl.uniformMatrix4fv(loc, false, arr);
      };
      uniformFunctions[gl.SAMPLER_2D] = function(loc, texture) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform1i(loc, 0);
      };
    }

    self.createSetters = function() {
      self.use();

      setUniformFunctions();
      createAttribSetters();
      createUniformSetters();
    };

    var attribSetters = {};
    function createAttribSetters() {
      for (var name in attribs) {
        if (!attribs.hasOwnProperty(name)) continue;
        aLoc = gl.getAttribLocation(glProgram, name);
        attribSetters[name] = createAttribSetter(aLoc, name);
      }
    }

    function createAttribSetter(aLoc, aName) {
      return function (buffer) {
        // console.log(buffer);
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        // gl.enableVertexAttrib(aLoc);
        gl.enableVertexAttribArray(aLoc);
        gl.vertexAttribPointer(aLoc, attribs[aName], gl.FLOAT, false, 0, 0);
      };
    }

    self.setAttrib = function(aName, buffer) {
      // TODO error check
      // console.log(aName);
      attribSetters[aName](buffer);
    };

    var uniformSetters = {};
    function createUniformSetters() {
      var uLoc;
      for (var name in uniforms) {
        name = name.replace(/\[[0-9]+\]/, '');
        if (window.dali.isNumber(uniforms[name])) {
          uLoc = gl.getUniformLocation(glProgram, name);
          uniformSetters[name] = createUniformSetter(uLoc, uniforms[name]);
        } else if (window.dali.isObject(uniforms[name])) {
          var obj = uniforms[name];
          for (var i = 0; i < obj.length; i++) {
            uLoc = gl.getUniformLocation(glProgram, name + '[' + i + ']');
            uniformSetters[name  + '[' + i + ']'] = createUniformSetter(uLoc, obj.type);
          }
        } else {
          throw 'Invalid unform info';
        }
      }
    }

    function createUniformSetter(uLoc, uType) {
      return function(v) {
        uniformFunctions[uType](uLoc, v);
      };
    }

    self.setUniform = function(uName, v) {
      // TODO error check
      uniformSetters[uName](v);
    };

    self.init = function() {
      throw 'Not yet implemented ' + self.inherit + '.init';      
    };

    self.render = function() {
      throw 'Not yet implemented ' + self.inherit + '.render';
    };

    self.requestRender = function() {
      throw 'Not yet implemented ' + self.inherit + '.requestRender';
    };

    self.clearRequests = function() {
      throw 'Not yet implemented ' + self.inherit + '.clearRequests';
    };

    return self;
  };

  // 3D Graphics
  // -----------------------------------------------------------

  // graphx.load() must be called first
  graphx.g3D.MAX_LIGHTS = 20;
  graphx.g3D.ShaderProgram3D = function(options, base) {
    options = options || {};
    options.attribs = options.attribs || {};
    options.attribs.aVertexPosition = 3;
    options.attribs.aVertexNormal = 3;
    options.attribs.aVertexTextureCoords = 2;

    options.uniforms = options.uniforms || {};
    options.uniforms.umMatrix = gl.FLOAT_MAT4;
    options.uniforms.upvmMatrix = gl.FLOAT_MAT4;
    options.uniforms.uEyePosition = gl.FLOAT_VEC3;
    options.uniforms.uNumLights = gl.INT;
    options.uniforms.uAlpha = gl.FLOAT;
    options.uniforms.uTexture = gl.SAMPLER_2D;
    options.uniforms.uProductsAmbient = { length: graphx.g3D.MAX_LIGHTS, type: gl.FLOAT_VEC3 };
    options.uniforms.uProductsDiffuse = { length: graphx.g3D.MAX_LIGHTS, type: gl.FLOAT_VEC3 };
    options.uniforms.uProductsSpecular = { length: graphx.g3D.MAX_LIGHTS, type: gl.FLOAT_VEC3 };
    options.uniforms.uShininess = gl.FLOAT;
    options.uniforms.uLightPositions = { length: graphx.g3D.MAX_LIGHTS, type: gl.FLOAT_VEC3 };

    if (!window.dali.isDaliObj(options.vShader) || !options.vShader.isType('vertex')) {
      options.vShader = graphx.Shader({
        type: gl.VERTEX_SHADER,
        code: graphx.g3D.vShaderCodeDefault
      });
    }

    if (!window.dali.isDaliObj(options.fShader) || !options.fShader.isType('fragment')) {
      options.fShader = graphx.Shader({
        type: gl.FRAGMENT_SHADER,
        code: graphx.g3D.fShaderCodeDefault
      });
    }

    var self = graphx.ShaderProgram(options, base);
    self.setType('shaderprogram3d');

    self.setToDefault = function() {
      shader3d = self;
    };

    if (options.default != null && options.default == true)
      self.setToDefault();

    var camera;
    self.init = function() {
      if (mainCamera3d == null && camera == null)
        self.setCamera(graphx.g3D.Camera());
      else if (camera == null)
        self.setCamera(mainCamera3d);
      self.createSetters();

      for (var mesh of meshMap.values()) {
        mesh.initBuffers();
      }
    };

    self.setCamera = function(_camera) {
      if (window.dali.isDaliObj(_camera) && _camera.isType('camera3d')) {
        camera = _camera;
      } else console.log('Cannot use ' + _camera + ' object for 3D camera');
    };

    self.render = function() {
      self.use();
      self.setUniform('uEyePosition', camera.transform.getPosition().vec3());

      var lights = light3ds.iterator();
      var light;
      self.setUniform('uNumLights', light3ds.size());
      for (var i = 0; i < light3ds.size(); i++) {
        light = lights.next().value;
        // console.log('Setting some lights ' + light.transform.getPosition().vec3());
        self.setUniform('uLightPositions[' + i + ']', light.transform.getPosition().vec3());
      }

      gl.depthMask(true); // z-buffer on
      var map = requests.opaque;
      var mesh, queue, bufferInfo;
      var material, texture, mMatrix;
      var hpvmMatrix = mat4.create();
      var ambient = vec3.create();
      var diffuse = vec3.create();
      var specular = vec3.create();

      for (var meshId of map.keys()) {
        mesh = meshMap.get(meshId);
        bufferInfo = mesh.getBufferInfo();
        for (var key in bufferInfo.attribs) {
          if (bufferInfo.attribs.hasOwnProperty(key)) {
            self.setAttrib(key, bufferInfo.attribs[key].buffer);
          }
        }

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufferInfo.indices);

        queue = map.get(meshId);
        for (var request of queue) {
          material = request.material;
          texture = request.texture;
          mMatrix = request.transform;

          mat4.multiply(hpvmMatrix, camera.hpvMatrix, mMatrix);

          self.setUniform('umMatrix', mMatrix);
          self.setUniform('upvmMatrix', hpvmMatrix);
          self.setUniform('uShininess', material.shininess);
          self.setUniform('uAlpha', material.alpha);
          self.setUniform('uTexture', texture.getTexture());

          lights = light3ds.iterator();
          for (var i = 0; i < light3ds.size(); i++) {
            light = lights.next().value;

            vec3.multiply(ambient, light.color.ambient, material.ambient);
            vec3.multiply(diffuse, light.color.diffuse, material.diffuse);
            vec3.multiply(specular, light.color.specular, material.specular);

            self.setUniform('uProductsAmbient[' + i + ']', ambient);
            self.setUniform('uProductsDiffuse[' + i + ']', diffuse);
            self.setUniform('uProductsSpecular[' + i + ']', specular);
          }

          gl.drawElements(gl.TRIANGLES, bufferInfo.size, gl.UNSIGNED_SHORT, 0);

        }
      };
    };

    var requests = {
      // TODO add some sort of mesh priority queue
      opaque: new Map(),
      translucent: new Map()
    };

    // TODO decouple mesh cache from shader....
    var meshMap = new Map();
    self.addMesh = function(mesh) {
      if (!window.dali.isDaliObj(mesh) || !mesh.isType('mesh'))
        throw 'Invalid mesh object: ' + mesh;
      if (meshMap.has(mesh.dGUID))
        throw 'Mesh GUID collision ' + mesh.dGUID;
      meshMap.set(mesh.dGUID, mesh);
    };

    self._getMesh = function(id) { return meshMap.get(id); };

    self.requestRender = function(options) {
      if (options == null || options.isOpaque == null || options.meshId == null || options.request == null)
        throw 'Invalid render request options: ' + options;

      // console.log(options.request);

      var map;
      if (options.isOpaque)
        map = requests.opaque;
      else
        map = requests.translucent;

      if (!map.has(options.meshId))
        map.set(options.meshId, []);

      // TODO error check for request
      /**
       * request
       * { texture, material, transform }
       */
      map.get(options.meshId).push(options.request);
    };

    self.clearRequests = function() {
      for (var key of requests.opaque.keys()) {
        requests.opaque.set(key, []);
      }
      for (var key of requests.translucent.keys()) {
        requests.translucent.set(key, []);
      }
    };

    return self;
  };

  // graphx.load must be called first
  var mainCamera3d;
  // CAMERA ENTITY
    graphx.g3D.Camera = function(options, base) {
    var self = window.dali.Entity(options, base);
    self.setType('camera3d');

    if (mainCamera3d == null || options.main) mainCamera3d = self;

    var oEye = vec3.clone(self.transform.getPosition().vec3());
    oEye = vec4.fromValues(oEye[0], oEye[1], oEye[2], 1.0);
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
        left: options.left || -1,
        right: options.right || 1,
        bottom: options.bottom || -1,
        top: options.top || 1,
        fovY: options.fovY || 0.25 * Math.PI,
        near: options.near || 0.1,
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

      // self.transform.setRotationFromAxes({
      //   at: lookAt,
      //   up: lookUp
      // });

      eyeDistance = options.eyeDistance || 0.5;       
    }

    self.updateHandProjMatrix = function() {
      var hMatrix = mat4.create();
      var pMatrix = mat4.create();

      mat4.fromScaling(hMatrix, handedness);
      
      resizeAspect();
      // mat4.perspective(pMatrix, projection.fovY, projection.aspect, projection.near, projection.far);
      // mat4.ortho(pMatrix, -1, 1, -1, 1, projection.near, projection.far);
      self.setProjection(pMatrix, projection);

      mat4.multiply(hpMatrix, hMatrix, pMatrix);
    };

    self.setProjection = function(pMatrix, projection) {
      throw 'Not yet implemented ' + self.getType() + '.setProjection';
    };

    self.updateViewMatrix = function() {
      var Transform = self.transform.toMatrix();

      var Up = vec4.fromValues(lookUp[0], lookUp[1], lookUp[2], 0.0);
      vec4.transformMat4(Up, Up, Transform);
      vec4.normalize(Up, Up);

      var Eye = vec4.create();
      vec4.transformMat4(Eye, oEye, Transform);

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
      setView(options);
    }
    init(options);

    self.update = function(dt) {
      // set up handedness, projection and view
      self.updateViewMatrix();
    };

    self.reset = function(options) {
      init(options);
    };

    return self;
  };

  graphx.g3D.PerspectiveCamera = function(options, base) {
    var self = graphx.g3D.Camera(options, base);
    self.setType('perspective');

    self.setProjection = function(pMatrix, projection) {
      mat4.perspective(pMatrix, projection.fovY, projection.aspect, projection.near, projection.far);
    };
    self.updateHandProjMatrix();
    self.updateViewMatrix();

    return self;
  };

  graphx.g3D.OrthographicCamera = function(options, base) {
    var self = graphx.g3D.Camera(options, base);
    self.setType('orthographic');

    self.setProjection = function(pMatrix, projection) {
      mat4.ortho(
        pMatrix,
        projection.left, projection.right,
        projection.bottom, projection.right,
        projection.near, projection.far
      );
    };
    self.updateHandProjMatrix();
    self.updateViewMatrix();

    return self;
  };

  var light3ds = window.dali.ObjectManager('light3d');
  graphx.g3D.Light = function(options, base) {
    var self = window.dali.Entity(options, base);
    self.setType('light3d');
    self.color = graphx.Color(options);
    if (light3ds.size() < graphx.g3D.MAX_LIGHTS)
      light3ds.add(self);
    else throw 'Cannot add more lights...';

    return self;
  };

  var texture3ds = window.dali.ObjectManager('texture3d'); // texture cache for url-image-based textures
  // graphx.load must be called first
  graphx.g3D.Texture = function(options, base) {
    var self = window.dali.Object(base);
    self.setType('texture3d');
    if (options == null) throw 'Invalid texture1 options: ' + options;

    // creates a "texture" of a solid color. used to create the blank, default texture
    // 0 - 255
    function createSolidTexture(r, g, b, a) {
      if (!dali.isNumber(r) || !dali.isNumber(g) || !dali.isNumber(b) || !dali.isNumber(a))
        throw 'Invalid arguments to createSolidTexture';
      var data = new Uint8Array([r, g, b, a]);
      if (a < 255) isTranslucent = true;
      glTexture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, glTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.bindTexture(gl.TEXTURE_2D, null);
    }

    var isTranslucent = false;
    function createImageTexture(img) {
      isTranslucent = 
      glTexture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, glTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.bindTexture(gl.TEXTURE_2D, null);      
    }

    var glTexture;
    if (options.url != null) {
      if (texture3ds.hasObj(options.url)) // if already made texture from URL...
        return texture3ds.getObj(options.url); // return cached texture

      // create image texture and cache it
      self.dGUID = options.url;
      var img = window.dali.resources.ResourceManager.main.getResource(options.url);
      createImageTexture(img.getImg());
      isTranslucent = img.isTranslucent;
      texture3ds.add(self);
    } else if (options.r != null && options.g != null && options.b != null && options.a != null) {
      createSolidTexture(options.r, options.g, options.b, options.a);
    } else throw 'Invalid texture2 options: ' + options;

    self.isTranslucent = function() {
      return isTranslucent;
    };

    self.getTexture = function() {
      return glTexture;
    };

    return self;
  };

  // TODO combine this with model.....
  // graphx.init() must be called before creating renderables
  graphx.g3D.Renderable3D = function(options, base) {
    var self = window.dali.Renderable(base);
    self.setType('renderable3d');

    if (options == null) throw 'Undefined options: ' + options;

    var model, texture, material, shaderGuid;
    if (window.dali.isDaliObj(options.model) && options.model.isType('model'))
      model = options.model;
    else throw 'No model given: ' + options;

    if (window.dali.isDaliObj(options.texture) && options.texture.isType('texture3d'))
      texture = options.texture;
    else texture = graphx.g3D.Texture({r: 255, g: 255, b: 255, a: 255 }); // default texture

    if (window.dali.isDaliObj(options.material) && options.material.isType('material'))
      material = options.material;
    else material = graphx.GMaterial(); // default material

    if (shaders.hasObj(options.shaderGuid))
      shaderGuid = options.shaderGuid;
    else
      shaderGuid = shader3d.dGUID;

    self.requestRender = function() {
      var opts = {
        isOpaque: !material.isTranslucent() && !texture.isTranslucent(),
        meshId: model.meshId,
        request: {
          transform: model.getTransform(),
          'texture': texture,
          'material': material
        },
      };
      requestRender(opts, shaderGuid);
    };

    self.setMaterial = function(_material) {
      material = _material;
    };

    return self;
  };

  // MODEL FOR DRAWERS
  // Meshes must be made before models
  // prereq: init
  graphx.g3D.Model = function(options, base) {
    var self = window.dali.Object(base);
    self.setType('model');

    if (options == null)
      throw 'No options given for model';

    if (!window.dali.isString(options.meshId))
      throw 'Invalid meshId: ' + options.meshId;

    self.meshId = options.meshId;

    if (!window.dali.isDaliObj(options.eTransform) || !options.eTransform.isType('entitytransform'))
      throw 'Invalid entity transform object: ' + options.eTransform;

    var eTransform = options.eTransform;
    var transform = mat4.create();

    if (options.rotation == null) {
      var up = vec3.fromValues(0, 1, 0);
      var at = vec3.fromValues(0, 0, 1);

      var right = vec3.create();
      vec3.cross(right, up, at);

      var rot = quat.create();
      quat.setAxes(rot, at, right, up);

      options.rotation = rot;
    }

    options.skinDepth = options.skinDepth || vec3.fromValues(1.0, 1.0, 1.0);

    // TODO get center from init AABB
    mat4.fromRotationTranslationScaleOrigin(
      transform, 
      options.rotation,
      options.position || vec3.fromValues(0, 0, 0),
      options.scale || vec3.fromValues(1, 1, 1),
      vec3.fromValues(0, 0, 0) // TODO change to position?
    );

    self.getTransform = function(print) {
      var _transform = eTransform.toMatrix();
      mat4.multiply(_transform, _transform, transform);
      return eTransform.toMatrix(print);
    };

    // HACK: ASSUME MESH IS WITH DEFAULT SHADER
    // TODO fix this when decoupling mesh from shader
    var AABB, AABS;
    var mesh = shader3d._getMesh(self.meshId);
    var t = self.getTransform(options.print);

    AABB = mesh.getUpdatedAABB(t, options.skinDepth, options.print);
    AABS = mesh.getUpdatedAABS(t, options.skinDepth, options.print);
    // AABB = mesh.getUpdatedAABB(transform);
    // AABS = mesh.getUpdatedAABS(transform);
    if (options.print) {
      console.log('Bounding box for mesh: ' + self.meshId);
      console.log(AABB);
    }

    mesh = null;
    delete t;
    delete mesh;

    self.getAABB = function() {
      return AABB;
    };

     self.getAABS = function() {
      return AABS;
     };

    return self;
  };

  // MESH
  // prereq: load
  graphx.g3D.Mesh = function(options, base) {
    var self = window.dali.Object(base);
    self.setType('mesh');

    var bufferInfo;

    // if ((options == null || options.default == null ||
    //      options.default != false) && shader3d != null) {
    //   console.log('yeah');
    //   shader3d.addMesh(self);
    // }

    var triangles;
    self.initBuffers = function() {
      triangles = self.triangleData();
      createBufferInfo();

      initAABB();
      initAABS();
    };

    function createBufferInfo() {
      bufferInfo = {};
      bufferInfo.attribs = createAttribs(triangles);
      bufferInfo.size = triangles.indices.data.length;
      bufferInfo.indices = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufferInfo.indices);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(triangles.indices.data), gl.STATIC_DRAW);
      // console.log(bufferInfo);
      return bufferInfo;
    };

    function createAttribs(data) {
      var out = {};
      for (var key in data) {
        if (data.hasOwnProperty(key) && key != 'indices') {
          out[key] = createBuffer(data[key]);
        }
      }
      return out;
    }

    function createBuffer(obj) {
      var out = {};
      out.buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, out.buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(obj.data), gl.STATIC_DRAW);
      out.size = obj.size;
      return out;
    }

    self.triangleData = function() {
      throw 'Not yet implemented ' + self.getType() + '.triangleData';
    };

    self.getBufferInfo = function () { return bufferInfo; };

    // n - number of vertices
    var AABB, AABS;

    // self.setAABB = function(_AABB) {
    //   // TODO error check
    //   oAABB = _AABB;
    // };

    // self.setAABS = function(_AABS) {
    //   // TODO error check
    //   AABS = _AABS;
    // };
    var possible;
    if (options != null)
      possible = options.url;
    // O(n)
    var initAABB = function() {
      // TODO if mesh isnt centered,
      // generate translation matrix for Model

      var vertices = triangles.aVertexPosition.data;
      var vertexList = [];
      for (var i = 0; i < vertices.length; i += 3) {
        var temp = [];
        for (var o = 0; o < 3; o++) {
          temp.push(vertices[i + o]);
        }
        vertexList.push(temp);
      }
      AABB = calculateAABB(vertexList);
      console.log(possible);
      console.log(AABB);
    };

    function calculateAABB(data) {
      var out = {
        min: vec3.fromValues(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY),
        max: vec3.fromValues(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY)
      };

      for (var i = 0; i < data.length; i++) {
        var vertex = data[i];
        for (var o = 0; o < 3; o++) {
          if (vertex[o] < out.min[o])
            out.min[o] = vertex[o];
          if (vertex[o] > out.max[o])
            out.max[o] = vertex[o];
        }
      }

      return out;
    }

    // O(1) - update
    self.getUpdatedAABB = function(transform, skinDepth, print) {
      // TODO Use transform to rotate oAABB
      // determine AABB from 8-vertices of
      // rotated oAABB
      var scale = mat4.create();
      mat4.fromScaling(scale, skinDepth);
      var box = [];
      var min = AABB.min;
      var max = AABB.max;
      box.push(vec3.fromValues(min[0], min[1], min[2]))
      box.push(vec3.fromValues(max[0], min[1], min[2]));
      box.push(vec3.fromValues(max[0], min[1], max[2]));
      box.push(vec3.fromValues(min[0], min[1], max[2]));
      box.push(vec3.fromValues(min[0], max[1], min[2]));
      box.push(vec3.fromValues(max[0], max[1], min[2]));
      box.push(vec3.fromValues(max[0], max[1], max[2]));
      box.push(vec3.fromValues(min[0], max[1], max[2]));

      mat4.multiply(transform, transform, scale);
      for (var i = 0; i < box.length; i++) {
        vec3.transformMat4(box[i], box[i], transform);
        if (print) {
          console.log('i: ' + i);
          console.log(box[i]);
        }
      }

      box = calculateAABB(box);
      if (print)
        console.log(box);
      box.center = vec3.create();
      vec3.add(box.center, box.min, box.max);
      vec3.scale(box.center, box.center, 0.5);
      return box;
    };

    // O(n)
    var initAABS = function() {
      // TODO vertex scan of largest distance
    };

    // O(1) - doesn't require updating, its a sphere
    self.getUpdatedAABS = function(transform) { 
      // TODO
    };

    return self;
  };

  // PLANEMESH
  graphx.g3D.PlaneMesh = function(options, base) {
    var self = graphx.g3D.Mesh(base);
    self.setType('planemesh');    

    var width = options.width || 1; // in boxes
    var height = options.height || 1; // in boxes
    self.dGUID = self.getType() + '.' + width + '.' + height;

    self.triangleData = function() {
      var data = {
        aVertexPosition: {
          size: 3,
          data: []
        },
        aVertexNormal: {
          size: 3,
          data: []
        },
        aVertexTextureCoords: {
          size: 3,
          data: []
        },
        indices: {
          size: 3,
          data: [],
        }
      };

      var triIndex = 0;
      var dw = 1.0 / width;
      var dh = 1.0 / height;

      for (var i = -0.5; i < 0.5; i += dw) {
        for (var j = -0.5; j < 0.5; j+= dh) {
          data.aVertexPosition.data.push(i, 0, j);
          data.aVertexPosition.data.push(i + dw, 0, j);
          data.aVertexPosition.data.push(i + dw, 0, j + dh);
          data.aVertexPosition.data.push(i, 0, j + dh);
        
          for (var v = 0; v < 4; v++) {
            data.aVertexNormal.data.push(0, 1, 0);
          }

          data.aVertexTextureCoords.data.push(0,0);
          data.aVertexTextureCoords.data.push(1,0);
          data.aVertexTextureCoords.data.push(1,1);
          data.aVertexTextureCoords.data.push(0,1);

          data.indices.data.push(triIndex, triIndex+1, triIndex+2);
          data.indices.data.push(triIndex+2, triIndex+3, triIndex);
          triIndex += 4;
        }
      }
      return data;
    };
    return self;
  };

  // SPHEREMESH
  graphx.g3D.SphereMesh = function(options, base) {
    var self = graphx.g3D.Mesh(base);
    self.setType('spheremesh');
    options = options || {};
    var numBands = options.numBands || 32;
    if (numBands % 2 != 0) numBands++;
    self.dGUID = self.getType() + '.' + numBands;

    self.triangleData = function() {
      var data = {
        aVertexPosition: { size: 3, data: [] },
        aVertexNormal: { size: 3, data: [] },
        aVertexTextureCoords: { size: 2, data: [] },
        indices: { size: 3, data: [] }
      };

      // make vertices and aVertexNormals
      for (var latNumber = 0; latNumber <= numBands; latNumber++) {
        var theta = latNumber * Math.PI / numBands;
        var sinTheta = Math.sin(theta);
        var cosTheta = Math.cos(theta);

        for (var longNumber = 0; longNumber <= numBands; longNumber++) {
          var phi = longNumber * 2 * Math.PI / numBands;
          var sinPhi = Math.sin(phi);
          var cosPhi = Math.cos(phi);

          var x = cosPhi * sinTheta;
          var y = cosTheta;
          var z = sinPhi * sinTheta;
          var u = (longNumber / numBands);
          var v = (latNumber / numBands);

          data.aVertexTextureCoords.data.push(u, v);
          data.aVertexPosition.data.push(x, y, z);
        }
      }
      data.aVertexNormal.data = data.aVertexPosition.data.slice(); // for this sphere, vertices = normals; return these

      // make triangles, from south pole to middle latitudes to north pole
      for (var latNumber = 0; latNumber < numBands; latNumber++) {
        for (var longNumber = 0; longNumber < numBands; longNumber++) {
          var first = (latNumber * (numBands + 1)) + longNumber;
          var second = first + numBands + 1;
          data.indices.data.push(first, second, first + 1);
          data.indices.data.push(second, second + 1, first + 1);
        }
      }
      return data;
    };

    return self;
  };

  graphx.g3D.BoxMesh = function(options, base) {
    var self = graphx.g3D.Mesh(base);
    self.setType('boxmesh');
    options = options || {};
    var width = options.width || 1,
        height = options.height || 1,
        depth = options.depth || 1;

    self.triangleData = function() {
      var triangles = {
        aVertexPosition: { size: 3, data: [] },
        aVertexNormal: { size: 3, data: [] },
        aVertexTextureCoords: { size: 2, data: [] },
        indices: { size: 3, data: [] }
      };

      var triIndex = 0;
      var dw = 1.0 / width, dh = 1.0 / height, dl = 1.0 / depth;

      // top and bottom
      for (var l = -0.5; l <= 0.5; l++) {
        for (var i = -0.5; i < 0.5; i += dw) {
          for (var j = -0.5; j < 0.5; j+= dh) {
            triangles.aVertexPosition.data.push(i, l, j);
            triangles.aVertexPosition.data.push(i + dw, l, j);
            triangles.aVertexPosition.data.push(i + dw, l, j + dh);
            triangles.aVertexPosition.data.push(i, l, j + dh);
          
            var sign = l < 0 ? -1 : 1;

            for (var v = 0; v < 4; v++) {
              triangles.aVertexNormal.data.push(0, sign, 0);
            }

            triangles.aVertexTextureCoords.data.push(0,0);
            triangles.aVertexTextureCoords.data.push(1,0);
            triangles.aVertexTextureCoords.data.push(1,1);
            triangles.aVertexTextureCoords.data.push(0,1);

            triangles.indices.data.push(triIndex, triIndex+1, triIndex+2);
            triangles.indices.data.push(triIndex, triIndex+2, triIndex+3);
            triIndex += 4;
          }
        }
      }

       // left and right
      for (var i = -0.5; i <= 0.5; i++) {
        for (var l = -0.5; l < 0.5; l += dl) {
          for (var j = -0.5; j < 0.5; j+= dh) {
            triangles.aVertexPosition.data.push(i, l, j);
            triangles.aVertexPosition.data.push(i, l + dl, j);
            triangles.aVertexPosition.data.push(i, l + dl, j + dh);
            triangles.aVertexPosition.data.push(i, l, j + dh);
          
            var sign = i < 0 ? -1 : 1;

            for (var v = 0; v < 4; v++) {
              triangles.aVertexNormal.data.push(sign, 0, 0);
            }

            triangles.aVertexTextureCoords.data.push(0,0);
            triangles.aVertexTextureCoords.data.push(1,0);
            triangles.aVertexTextureCoords.data.push(1,1);
            triangles.aVertexTextureCoords.data.push(0,1);

            triangles.indices.data.push(triIndex, triIndex+1, triIndex+2);
            triangles.indices.data.push(triIndex+2, triIndex+3, triIndex);
            triIndex += 4;
          }
        }
      }

      // front and back
      for (var j = -0.5; j <= 0.5; j++) {
        for (var l = -0.5; l < 0.5; l += dl) {
          for (var i = -0.5; i < 0.5; i += dw) {
            triangles.aVertexPosition.data.push(i, l, j);
            triangles.aVertexPosition.data.push(i, l + dl, j);
            triangles.aVertexPosition.data.push(i + dw, l + dl, j);
            triangles.aVertexPosition.data.push(i + dw, l, j);
          
            var sign = j < 0 ? -1 : 1;

            for (var v = 0; v < 4; v++) {
              triangles.aVertexNormal.data.push(0, 0, sign);
            }

            triangles.aVertexTextureCoords.data.push(0,0);
            triangles.aVertexTextureCoords.data.push(1,0);
            triangles.aVertexTextureCoords.data.push(1,1);
            triangles.aVertexTextureCoords.data.push(0,1);

            triangles.indices.data.push(triIndex, triIndex+1, triIndex+2);
            triangles.indices.data.push(triIndex, triIndex+2, triIndex+3);
            triIndex += 4;
          }
        }
      }

      return triangles;
    };

    return self;
  };

  // adapted from frenchtoast747's webgl-obj-loader
  // built its own buffers, so I needed to just get
  // the parsing .obj function
  //
  // goes through a list of vertices, uvs, and normals
  // then goes through list of faces, and maps vertex,
  // uv, and normal to the same index... building the
  // object that the Mesh bufferInfo object likes
  //
  // src:
  //   https://github.com/frenchtoast747/webgl-obj-loader/blob/master/webgl-obj-loader.js
  var MESH_FILE_RE = /\.[obj]/i;
  var VERTEX_RE = /^v\s/;
  var NORMAL_RE = /^vn\s/;
  var TEXTURE_RE = /^vt\s/;
  var FACE_RE = /^f\s/;
  var WHITESPACE_RE = /\s+/;
  // TRIMESH
  graphx.g3D.TriMesh = function(options, base) {
    var self = graphx.g3D.Mesh(options, base);
    self.setType('trimesh');

    if (options == null || options.url == null || !window.dali.isString(options.url))
      throw 'Invalid trimesh options: ' + options;

    if (!MESH_FILE_RE.test(options.url))
      throw 'Unsupported mesh file format ' + options.url;

    var objText = window.dali.resources
      .ResourceManager.main.getResource(options.url)
      .getText();

    self.triangleData = function() {
      // .obj parser
      // TODO add other file formats
      var triangles = {
        aVertexPosition: { size: 3, data: [] },
        aVertexNormal: { size: 3, data: [] },
        aVertexTextureCoords: { size: 2, data: [] },
        indices: { size: 3, data: [] }
      };

      var tracker = {
        hashindices: {},
        index: 0,
      };

      var vertices = [], normals = [], uvs = [];
      // console.log(objText);

      var lines = objText.split('\n');

      for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim(); // remove whitespace

        var elements = line.split(WHITESPACE_RE);
        elements.shift(); // remove front

        if (VERTEX_RE.test(line)) {
          Array.prototype.push.apply(vertices, elements);
        } else if (TEXTURE_RE.test(line)) {
          Array.prototype.push.apply(uvs, elements);
        } else if (NORMAL_RE.test(line)) {
          Array.prototype.push.apply(normals, elements);
        } else if (FACE_RE.test(line)) {

          var quad = false, nElements = elements.length;
          for (var j = 0; j < nElements; j++) {

            if (j === 3 && !quad) {
              j = 2;
              quad = true;
            }

            if (elements[j] in tracker.hashindices) {
              triangles.indices.data.push(tracker.hashindices[elements[j]]);
            } else {

              var vertex = elements[j].split('/');

              var v0 = (vertex[0] - 1) * 3;
              triangles.aVertexPosition.data.push(+vertices[v0]);
              triangles.aVertexPosition.data.push(+vertices[v0 + 1]);
              triangles.aVertexPosition.data.push(+vertices[v0 + 2]);

              if (uvs.length) {
                var v1 = (vertex[1] - 1) * 2;
                triangles.aVertexTextureCoords.data.push(+uvs[v1]);
                triangles.aVertexTextureCoords.data.push(+uvs[v1 + 1]);
              }

              var v2 = (vertex[2] - 1) * 3;
              triangles.aVertexNormal.data.push(+normals[v2]);
              triangles.aVertexNormal.data.push(+normals[v2 + 1]);
              triangles.aVertexNormal.data.push(+normals[v2 + 2]);

              tracker.hashindices[elements[j]] = tracker.index;
              triangles.indices.data.push(tracker.index);
              tracker.index++;
            }

            if(j === 3 && quad) {
                // add v0/t0/vn0 onto the second triangle
                triangles.indices.data.push( tracker.hashindices[elements[0]]);
            }
          }
        }
      }
      return triangles;
    };

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
