
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

  var shaderQueue = []; // TODO make it a heap
  var shaders = window.dali.ObjectManager('shaderprogram');
  var shader3d;

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
      if (!window.dali.isString(field)) throw 'Invalid key for setField in Material';
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
  graphx.Material = function(options, base) {
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
        console.log(buffer);
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        // gl.enableVertexAttrib(aLoc);
        gl.enableVertexAttribArray(aLoc);
        gl.vertexAttribPointer(aLoc, attribs[aName], gl.FLOAT, false, 0, 0);
      };
    }

    self.setAttrib = function(aName, buffer) {
      // TODO error check
      console.log(aName);
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
        console.log('Setting some lights ' + light.transform.getPosition().vec3());
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
          // TODO
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

    var meshMap = new Map();
    self.addMesh = function(mesh) {
      if (!window.dali.isDaliObj(mesh) || !mesh.isType('mesh'))
        throw 'Invalid mesh object: ' + mesh;
      if (meshMap.has(mesh.dGUID))
        throw 'Mesh GUID collision ' + mesh.dGUID;
      meshMap.set(mesh.dGUID, mesh);
    };

    self.requestRender = function(options) {
      if (options == null || options.isOpaque == null || options.meshId == null || options.request == null)
        throw 'Invalid render request options: ' + options;

      console.log(options.request);

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
  // TODO Camera base class, children: Perspective, Orthographic
  graphx.g3D.Camera = function(options, base) {
    var self = window.dali.Entity(options, base);
    self.setType('camera3d');

    if (mainCamera3d == null || options.main) mainCamera3d = self;

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
      mat4.ortho(pMatrix, -1, 1, -1, 1, projection.near, projection.far);

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

      console.log(Eye);
      console.log(Center);
      console.log(Up);

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

    self.reset = function(options) {
      init(options);
    };

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

  // graphx.load must be called first
  graphx.g3D.Texture = function(options, base) {
    var self = window.dali.Object(base);
    self.setType('texture3d');

    if (options == null) throw 'Invalid options: ' + options;

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
    } else throw 'Invalid options: ' + options;

    self.isTranslucent = function() {
      return false; // TODO check for transparency in image using hidden canvas
    };

    self.getTexture = function() {
      return glTexture;
    };

    return self;
  };

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
    else material = graphx.Material(); // default material

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

    // TODO make model transform from initial position, rotation, scale of model
    mat4.fromRotationTranslationScaleOrigin(
      transform, 
      options.rotation,
      options.position || vec3.fromValues(0, 0, 0),
      options.scale || vec3.fromValues(1, 1, 1),
      vec3.fromValues(0, 0, 0) // TODO change to position?
    );

    self.getTransform = function() {
      var parent = eTransform.toMatrix();
      mat4.multiply(parent, transform, parent);
      return parent;
    };

    return self;
  };

  // MESH
  // prereq: load
  graphx.g3D.Mesh = function(options, base) {
    var self = window.dali.Object(base);
    self.setType('mesh');

    var bufferInfo;
    /**
     *     var arrays = {
     *       position: { numComponents: 3, data: [0, 0, 0, 10, 0, 0, 0, 10, 0, 10, 10, 0], },
     *       aVertexTextureCoords: { numComponents: 2, data: [0, 0, 0, 1, 1, 0, 1, 1],     },
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

    self.initBuffers = function() {
      var data = self.triangleData();
      createBufferInfo(data);
    };

    function createBufferInfo(data) {
      data = data.data || data;
      bufferInfo = {};
      bufferInfo.attribs = createAttribs(data);
      bufferInfo.size = data.indices.data.length;
      bufferInfo.indices = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bufferInfo.indices);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(data.indices.data), gl.STATIC_DRAW);
      console.log(bufferInfo);
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

    return self;
  };

  // PLANEMESH

  graphx.g3D.PlaneMesh = function(options, base) {
    var self = graphx.g3D.Mesh(base);
    self.setType('planemesh');
    
    // TODO make generatable

    self.triangleData = function() {
      return {
        aVertexPosition: {
          size: 3,
          data: [
            -0.5, 0, -0.5, // LL
            -0.5, 0, 0.5, // UL
            0.5, 0, -0.5, // LR
            0.5, 0, 0.5 // UR
          ],
        },
        aVertexNormal: {
          size: 3,
          data: [
            0, 1, 0, // LL
            0, 1, 0, // UL
            0, 1, 0, // LR
            0, 1, 0 // UR
          ],
        },
        aVertexTextureCoords: {
          size: 2,
          data: [
            0, 0, // LL
            0, 1, // UL
            1, 0, // LR
            1, 1 // UR
          ],
        },
        indices: {
          size: 3,
          data: [
            0, 1, 2, // triangle1
            3, 2, 1 // triangle2
          ],
        },
      };
    };
    return self;
  };

  // CUBEMESH

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
    // TODO
  };

  // TRIMESH
  graphx.g3D.TriMesh = function(options, base) {
    var self = graphx.g3D.Mesh(base);
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
  #define MAX_LIGHTS ` + dali.graphx.g3D.MAX_LIGHTS + ` // allowed max
  uniform vec3 uLightPositions[MAX_LIGHTS]; // array of light positions
  uniform vec3 uProductsAmbient[MAX_LIGHTS];
  uniform vec3 uProductsDiffuse[MAX_LIGHTS];
  uniform vec3 uProductsSpecular[MAX_LIGHTS];
  uniform float uShininess;

  // geometry properties
  varying vec3 vWorldPos; // world xyz of fragment
  varying vec3 vVertexNormal; // normal of fragment

  varying highp vec2 vTextureCoords; // interpolated uv
  uniform sampler2D uTexture; // texture sampler
  uniform float uAlpha; // material alpha

  void main(void) {
    vec3 color = vec3(0.0, 0.0, 0.0);

    vec3 E = normalize(uEyePosition - vWorldPos);
    vec3 n = normalize(vVertexNormal);
    for (int i = 0; i < MAX_LIGHTS; i++) {
      if (i >= uNumLights) break;
      vec3 L = normalize(uLightPositions[i] - vWorldPos);
      vec3 H = normalize(L + E);

      vec3 Idiff = uProductsDiffuse[i] * max(dot(n, L), 0.0);
      Idiff = clamp(Idiff, 0.0, 1.0);

      vec3 Ispec = uProductsSpecular[i] * pow(max(dot(n, H), 0.0), uShininess);
      Ispec = clamp(Ispec, 0.0, 1.0);

      color = clamp(color + uProductsAmbient[i] + Idiff + Ispec, 0.0, 1.0);
    }

    gl_FragColor = vec4(color, uAlpha) * texture2D(uTexture, vec2(vTextureCoords.s, vTextureCoords.t));
  }
`;