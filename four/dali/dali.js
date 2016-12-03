'use strict';

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
var dali = {};

dali.isString = function (obj) {
  return (Object.prototype.toString.call(obj) === '[object String]');
};

// GUID GENERATOR
(function() {

  var counter = 0;
  const N = 9;
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

  // BASE OBJECT
  window.dali.Object = function(base) {
    // private
    var self = base || {};
    var type;

    // public
    self.dGUID = guid();
    self.inherit = 'dali';
    self.setType = function(_type) {
      type = _type;
      self.inherit += '.' + type;
    };
    self.getType = function () { return type; }
    self.setType('object');

    return self;
  };

}) ();

// OBJECT LOOKUP MANAGER
dali.ObjectManager = function(objType, base) {
  if (!dali.isString(objType)) throw 'Invalid object type for objType argument';
  
  // private
  var self = dali.Object(base);
  var regex = new RegExp(objType.toLowerCase(), 'i');
  var objects = new Map();

  function checkType(type) {
    if (dali.isString(type) && !objects.has(type))
      objects.set(type, new Map());
  }

  // public
  self.add = function (object) {
    if (object && object.dGUID != null && regex.test(object.inherit)) {
      checkType(object.getType());
      var guidMap = objects.get(object.getType());
      if (guidMap.has(object.dGUID))
        throw 'GUID collision';
      guidMap.set(object.dGUID, object);
      return ;
    }
    throw ('Cannot insert: ' + object);
  };

  self.getObj = function (type, guid) {
    if (type && dali.isString(type) && objects.has(type)) {
      if (guid && dali.isString(guid) && objects.has(guid))
        return objects.get(type).get(guid);
      else {
        var first = objects.get(type).values().next();
        if (!first.done) return first.value;
      }
    }
    throw ('Does not contain an Object of the \'' + type + '\' type');
  };

  self.getObjs = function(type) {
    if (type && dali.isString(type) && objects.has(type))
      return objects.get(type).values();
    throw ('Does not contain an Object of the \'' + type + '\' type');
  };

  self.all = function() {
    return objects.values();
  };

  return self;

};

// GAME ENTITY -- COLLECTION OF UPDATABLES AND DRAWABLES
dali.Entity = function (base, tOptions) {
  // private
  var self = dali.Object(base);
  self.setType('entity');

  var updatables = dali.ObjectManager('updatable');
  var drawables = dali.ObjectManager('drawable');
  var thinkables = dali.ObjectManager('thinkable');

  function _updateCollection(collection, dt) {
    for (var components of collection.all()) {
      for (var component of components.values()) {
        component.update(dt);
      }
    }
  }

  // public
  self.addUpdatable = function (comp) { updatables.add(comp); };
  self.addDrawable = function (comp) { drawables.add(comp); };
  self.addThinkable = function (comp) { thinkables.add(comp); };

  self._update = function(dt) {
    _updateCollection(updatables, dt);
    _updateCollection(thinkables, dt);
    self.update(dt);
  };
  // framework function -- not required
  self.update = function(dt) {};

  self._draw = function() {
    for (var components of drawables.all()) {
      for (var component of components.values()) {
        component.draw();
      }
    }
  };

  self._think = function() {
    for (var components of thinkables.all()) {
      for (var component of components.values()) {
        component.think();
      }
    }
  };

  if (tOptions != null) {
    self.transform = dali.EntityTransform(tOptions.options, tOptions.base, tOptions.parent);
  } else {
    self.transform = dali.EntityTransform();
  }

  return self;
};

// TRANSFORM -- STORE POSITION, ORIENTATION, AND SIZE OF ENTITY
// ------------ EITHER POINTS TO SAME OBJECTS USED BY UNDERLYING
// ------------ CANNON BODY (PHYSICS), OR ITS OWN IF IT DOESN'T
// ------------ INTERACT (CAMERAS, UI, etc.)
dali.EntityTransform = function (options, base, parent) {
  var self = dali.Object(base);
  self.setType('entitytransform');

  // parent EntityTransform for object hierarchies
  self.parent = parent || null;

  // TODO position -- Vec3, rotation -- Quaterion, scale -- Vec3
  // Uses Cannon math classes
  if (options != null) {
    // TODO if pos, rot, scale
  } else {
    // TODO defaults
  }

  // TODO outputs glMatrix's mat4, for rendering
  function toMatrix() {
    throw "Not yet implemented toMatrix";
  }

  return self;
};

// A DRAWABLE COMPONENT
dali.Drawable = function (base) {
  var self = dali.Object(base);
  self.setType('drawable');

  // TODO draw order, draw, etc.

  self.draw = function() {
    console.log('You should override draw!');
  };

  return self;
};

// AN UPDATABLE COMPONENT
dali.Updatable = function (base) {
  var self = dali.Object(base);
  self.setType('updatable');

  // TODO object order

  self.update = function(dt) {
    // required to implement
    throw 'Not yet implemented: ' + self.inherit + '.update';
  };

  return self;

};


// Time/Timeline
(function () {

}) ();

// EventManager
(function () {

  function EventManager() {
    // TODO
  }

}) ();

// Scences and SceneManager
(function () {

  function Scene(base) {
    // private
    var self = dali.Object(base);
    self.setType('scene');

    var entities = dali.ObjectManager('entity');

    self.addEntity = function(entity) { entities.add(entity); };

    self.update = function(dt) {
      for (var components of entities.all()) {
        for (var entity of components.values())
          entity._update(dt);
      }
    };

    self.draw = function() {
      for (var components of entities.all()) {
        for (var entity of components.values())
          entity._draw();
      }
    };

    return self;
  }

  // stack and queue in js:
  //    http://stackoverflow.com/questions/1590247/how-do-you-implement-a-stack-and-a-queue-in-javascript
  function SceneManager() {
    // private
    var self = dali.Object();
    self.setType('scenemanager');

    var sceneOrder = [];
    var scenes = dali.ObjectManager('scene');
    var currentScene = null;

    // public
    self.addScene = function (scene) {
      var index = {
        type: scene.getType(),
        guid: scene.dGUID,
      };
      scenes.add(scene);
      sceneOrder.push(index);
    };

    self.next = function() {
      var next = sceneOrder.shift();
      sceneOrder.push(next);
      currentScene = scenes.getObj(next.type, next.guid);
      return currentScene;
    };

    self.prev = function() {
      var prev = sceneOrder.pop();
      sceneOrder.unshift(prev);
      currentScene = scenes.getObj(prev.type, prev.guid);
      return currentScene;
    };

    self.current = function() { return currentScene; };

    return self;
  }

  window.dali.SceneManager = SceneManager();
  window.dali.Scene = Scene;

}) ();

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

// Physics engine interface
(function () {

  // Wrapper(s) for Cannon's Body object(s)
  function EntityBody() {
    // TODO
  }


}) ();

// THINKABLE -- AI COMPONENT
dali.Thinkable = function (base) {
  var self = dali.Updatable(base);
  self.setType('thinkable');

  self.think = function () {
    throw 'Not yet implemented: ' + self.getType() + '.think';
  };

  return self;
};

// TODO: MOVEMENT and DECISION MAKING ALGORITHMS
(function() {


}) ();

// TODO
(function () {

  function AudioClip() {
    // TODO
  }

  function AudioManager() {
    // TOOD
  }

}) ();

function main() {

  var prev, current, dt;

  function init() {
    prev = performance.now();
    requestAnimationFrame(loop);
  }

  function loop() {
    requestAnimationFrame(loop);
    
    // TODO apart of Time/Timeline
    current = performance.now();
    dt = current - prev;
    prev = current;

  }

  dali.SceneManager.addScene(dali.Scene());
  var scene = dali.SceneManager.next();

  for (var i = 0; i < 10; i++) {
    var o = dali.Entity({secret: i});
    scene.addEntity(o);
    var c = dali.Drawable();
    o.addDrawable(c);
    c = dali.Updatable();
    o.addUpdatable(c);
    console.log(o.getType());
  }

  scene.draw();
  scene.update(1);

  // init();
};
