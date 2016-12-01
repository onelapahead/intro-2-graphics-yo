
// PROTOTYPE ADD-ONS
String.prototype.hashCode = function() {
  var hash = 0, i, chr, len;
  if (this.length === 0) return hash;
  for (i = 0, len = this.length; i < len; i++) {
    chr   = this.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

// DALÍ
var dalí = {
  entities: new Map(),
};

// GUID GENERATOR
(function() {

  var counter = 0;
  const N = 24;
  const T = 999;

  // src: http://stackoverflow.com/questions/10073699/pad-a-number-with-leading-zeros-in-javascript
  function pad(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
  }

  // src: http://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
  function guid() {
    if (counter > T) counter = 0;
    return Array(N+1).join((Math.random(performance.now()).toString(36)+'00000000000000000').slice(2, 18)).slice(0, N) + pad(counter++, 3);
  }

  window.dalí.guid = guid;

}) ();

// BASE OBJECT
dalí.Object = function(base) {
  var obj = base || {};

  obj.guid = dalí.guid();
  obj.type = 'dalí.Object';

  return obj;
};

// GAME ENTITY -- COLLECTION OF UPDATABLES AND DRAWABLES
dalí.Entity = function (base) {
  var obj = dalí.Object(base);
  obj.type += '.Entity';

  if (dalí.entities.has(obj.guid))
    throw 'GUID collision';

  dalí.entities.set(obj.guid, obj);

  var updatables = new Map();
  var drawables = new Map();
  function addComponent(component) {
    // TODO error check

  }

  function update(dt) {
    // TODO
  }

  function draw() {
    // TODO
  }

  // TODO add cannon.Transform

  return obj;
};

// A DRAWABLE COMPONENT
dalí.Drawable = function (base) {
  var obj = dalí.Object(base);
  obj.type += '.Drawable';

  // TODO draw order, draw, etc.

  return obj;
};

// AN UPDATABLE COMPONENT
dalí.Updatable = function (base) {
  var obj = dalí.Object(base);
  obj.type += '.Updatable';

  // TODO object order

  obj.update = function(dt) {
    throw "Not yet implemented update";
  };

  return obj;

};

// MODEL FOR DRAWERS
dalí.Model = function(base) {
  var obj = dalí.Object(base);
  // TODO

  return obj;
};

// CAMERA ENTITY
dalí.Camera = function(base) {
  var obj = dalí.Entity(base);
};

// Time/Timeline
(function () {

}) ();

// Physics engine interface
(function () {

}) ();

// Rendering engine and interface
(function () {
  // main camera, eye, project and view matrices
  // textures, models, shaders
}) ();

// EventManager
(function () {

  function EventManager() {
    // TODO
  }

}) ();


