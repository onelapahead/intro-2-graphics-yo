
// Rendering engine and interface
(function () {

  var gl = null;
  window.dali.gl = gl;
  // TODO globals from previous hws

  // set up the webGL environment
  function init() {
    // Get the canvas and context
    var canvas = document.getElementById("myWebGLCanvas"); // get the js canvas
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

  } // end init

  function loadModels() {
    // TODO
  }

  function loadShaders() {
    // TODO
  }

  window.dali.load = function() {
    loadShaders();
    loadModels();
  };

  window.dali.render = function() {
    // TODO
  };

  // SHADER
  window.dali.Shader = function(options, base) {
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
    gl.sourceShader(glShader, options.code);
    gl.compileShader(glShader);

    if (!gl.getShaderParameter(glShader, gl.COMPILE_STATUS)) { // bad shader compile
      var log = gl.getShaderInfoLog(glShader);
      gl.deleteShader(glShader);
      throw 'Error during shader compile: ' + log;
    }

    self.attachToProgram = function(shaderProgram) {
      // TODO error check for object type
      gl.attachShader(shaderProgram, glShader);
    };

    return self;
  };

  // SHADERMANAGER
  // WRAPS GL'S SHADER PROGRAM AND CONTAINS PTRS
  window.dali.ShaderManager = function(options, base) {
    var self = window.dali.Object(base);

    var shaders = window.dali.ObjectManager('shader');
    var program;

    // TODO

    return self;
  };

  // CAMERA ENTITY
  window.dali.Camera = function(base) {
    var self = window.dali.Entity(base);
    self.setType('camera');

    // TODO

    return self;
  };

  window.dali.Material = function(options, base) {
    var self = window.dali.Object(base);
    self.setType('material');

    // TODO

    return self;
  };

  window.dali.Light = function(options, base) {
    var self = window.dali.Entity(base);
    self.setType('light');

    // TODO

    return self;
  };

  window.dali.Texture = function(options, base) {
    var self = window.dali.Object(base);
    self.setType('texture');

    // TODO

    return self;
  };

  // MODEL FOR DRAWERS
  window.dali.Model = function(base) {
    var self = window.dali.Object(base);
    self.setType('model');
    // TODO

    var transform = mat4.create();

    return self;
  };

  // MESH
  window.dali.Mesh = function(options, base) {
    var self = window.dali.Object(base);
    self.setType('mesh');

    return self;
  };

  // TRIMESH
  window.dali.TriMesh = function(options, base) {
    var self = window.dali.Mesh(base);
    self.setType('trimesh');

    // TODO

    return self;
  };

}) ();
