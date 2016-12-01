
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

// DALÍ 'FRAMEWORK' OBJECT
var dalí = {
  entities: new Map(),
  drawables: new Map(),
  updatables: new Map(),
  util: {},
  // colliders: new Map(), etc...?
};

dalí.util.isString = function (obj) {
  return (Object.prototype.toString.call(obj) === '[object String]');
};

// GUID GENERATOR
(function() {

  var counter = 0;
  const N = 24;
  const T = 999;

  // src: http://stackoverflow.com/questions/10073699/pad-a-number-with-leading-zeros-in-javascript
  function pad(n, width) {
    const z = '0';
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
  var self = base || {};

  var type = null;

  self.guid = dalí.guid();
  self.dalí = true;
  self.inherit = 'dalí';
  self.setType = function(_type) {
    type = _type;
    self.inherit += '.' + type;
  };
  self.getType = function () { return type; }
  self.setType('object');

  return self;
};

// OBJECT LOOKUP MANAGER
dalí.ObjectManager = function(objType, base) {
  var self = dalí.Object(base);
  if (!dalí.util.isString(objType)) throw 'Invalid object type for objType argument';
  var regex = new RegExp(objType.toLowerCase(), 'i');

  var objects = new Map();

  function checkType(type) {
    if (dalí.util.isString(type) && !objects.has(type))
      objects.set(type, new Map());
  }

  self.add = function (object) {
    if (object && object.dalí && regex.test(object.inherit)) {
      checkType(object.getType());
      var guidMap = objects.get(object.getType());
      if (guidMap.has(object.guid))
        throw 'GUID collision';
      guidMap.set(object.guid, object);
      return ;
    }
    throw ('Cannot insert: ' + object);
  };

  self.getObj = function (type, guid) {
    if (type && dalí.util.isString(type) && objects.has(type)) {
      if (guid && dalí.util.isString(guid) && objects.has(guid))
        return objects.get(type).get(guid);
      else {
        var first = objects.get(type).values().next();
        if (!first.done) return first.value;
      }
    }
    throw ('Does not contain an Object of the \'' + type + '\' type');
  };

  self.getObjs = function(type) {
    if (type && dalí.util.isString(type) && objects.has(type))
      return objects.get(type).values();
    throw ('Does not contain an Object of the \'' + type + '\' type');
  };

  self.all = function() {
    return objects.values();
  };

  return self;

};

// GAME ENTITY -- COLLECTION OF UPDATABLES AND DRAWABLES
dalí.Entity = function (base) {
  var self = dalí.Object(base);
  self.setType('entity');

  // TODO????
  if (dalí.entities.has(self.guid))
    throw 'GUID collision';
  dalí.entities.set(self.guid, self);

  var updatables = dalí.ObjectManager('updatable');
  var drawables = dalí.ObjectManager('drawable');

  self.addUpdatable = function (comp) { updatables.add(comp); }
  self.addDrawable = function (comp) { drawables.add(comp); }

  function _update(dt) {
    for (let components of updatables.all()) {
      for (let component of components.values()) {
        component.update(dt);
      }
    }
    self.update(dt);
  }
  self._update = _update;
  self.update = function(dt) {}; // framework function -- not required

  function _draw() {
    for (let components of drawables.all()) {
      for (let component of components.values()) {
        component.draw();
      }
    }
  }
  self._draw = _draw;

  // TODO add cannon.Transform

  return self;
};

// TRANSFORM -- STORE POSITION, ORIENTATION, AND SIZE OF ENTITY
// ------------ EITHER POINTS TO SAME OBJECTS USED BY UNDERLYING
// ------------ CANNON BODY (PHYSICS), OR ITS OWN IF IT DOESN'T
// ------------ INTERACT (CAMERAS, UI, etc.)
dalí.EntityTransform = function (options, base, parent) {
  var self = dalí.Object(base);
  self.setType('entitytransform');

  // parent EntityTransform for object hierarchies
  self.parent = parent || null;

  // TODO position -- Vec3, rotation -- Quaterion, scale -- Vec3
  // Uses Cannon math classes

  // TODO outputs glMatrix's mat4, for rendering
  function toMatrix() {
    throw "Not yet implemented toMatrix";
  }

  return self;
};

// A DRAWABLE COMPONENT
dalí.Drawable = function (base) {
  var self = dalí.Object(base);
  self.setType('drawable');

  // TODO draw order, draw, etc.

  return self;
};

// AN UPDATABLE COMPONENT
dalí.Updatable = function (base) {
  var self = dalí.Object(base);
  self.setType('updatable');

  // TODO object order

  self.update = function(dt) {
    // required to implement
    console.log('year');
    throw "Not yet implemented update";
  };

  return self;

};

// MODEL FOR DRAWERS
dalí.Model = function(base) {
  var self = dalí.Object(base);
  self.setType('model');
  // TODO

  return self;
};

// CAMERA ENTITY
dalí.Camera = function(base) {
  var self = dalí.Entity(base);
  self.setType('camera');
};

// Time/Timeline
(function () {

}) ();

// Physics engine interface
(function () {

  // Wrapper(s) for Cannon's Body object(s)
  function EntityBody() {
    // TODO
  }


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


