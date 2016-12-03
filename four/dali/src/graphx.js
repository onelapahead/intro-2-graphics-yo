
// Rendering engine and interface
(function () {

  var gl = null;
  // TODO globals from previous hws

  // CAMERA ENTITY
  window.dali.Camera = function(base) {
    var self = dali.Entity(base);
    self.setType('camera');
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

  // SHADER
  window.dali.Shader = function(options, base) {
    var self = window.dali.Object(base);
    self.setType('shader');

    // TOOD

    return self;
  };

  // MODEL FOR DRAWERS
  window.dali.Model = function(base) {
    var self = window.dali.Object(base);
    self.setType('model');
    // TODO

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
