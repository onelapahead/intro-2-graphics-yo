
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
var dalí = {};

dalí.isString = function (obj) {
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
  window.dalí.Object = function(base) {
    // private
    var self = base || {};
    var type;

    // public
    self.dGUID = guid();
    self.inherit = 'dalí';
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
dalí.ObjectManager = function(objType, base) {
  if (!dalí.isString(objType)) throw 'Invalid object type for objType argument';
  var self = dalí.Object(base);
  var regex = new RegExp(objType.toLowerCase(), 'i');
  var objects = new Map();

  function checkType(type) {
    if (dalí.isString(type) && !objects.has(type))
      objects.set(type, new Map());
  }

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
    if (type && dalí.isString(type) && objects.has(type)) {
      if (guid && dalí.isString(guid) && objects.has(guid))
        return objects.get(type).get(guid);
      else {
        var first = objects.get(type).values().next();
        if (!first.done) return first.value;
      }
    }
    throw ('Does not contain an Object of the \'' + type + '\' type');
  };

  self.getObjs = function(type) {
    if (type && dalí.isString(type) && objects.has(type))
      return objects.get(type).values();
    throw ('Does not contain an Object of the \'' + type + '\' type');
  };

  self.all = function() {
    return objects.values();
  };

  return self;

};

// Scences and SceneManager
(function () {

  function Scene(base) {
    var self = dalí.Object(base);
    self.setType('scene');

    var entities = dalí.ObjectManager('entity');

    self.addEntity = function(entity) { entities.add(entity); };

    self.update = function(dt) {
      for (let components of entities.all()) {
        for (let entity of components.values())
          entity._update(dt);
      }
    };

    self.draw = function() {
      for (let components of entities.all()) {
        for (let entity of components.values())
          entity._draw();
      }
    };

    return self;
  }

  // stack and queue in js:
  //    http://stackoverflow.com/questions/1590247/how-do-you-implement-a-stack-and-a-queue-in-javascript
  function SceneManager() {
    var self = dalí.Object();
    self.setType('scenemanager');

    var sceneOrder = [];
    var scenes = dalí.ObjectManager('scene');
    var currentScene = null;

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

  window.dalí.SceneManager = SceneManager();
  window.dalí.Scene = Scene;

}) ();

// GAME ENTITY -- COLLECTION OF UPDATABLES AND DRAWABLES
dalí.Entity = function (base, tOptions) {
  var self = dalí.Object(base);
  self.setType('entity');

  var updatables = dalí.ObjectManager('updatable');
  var drawables = dalí.ObjectManager('drawable');
  var thinkables = dalí.ObjectManager('thinkable');

  self.addUpdatable = function (comp) { updatables.add(comp); };
  self.addDrawable = function (comp) { drawables.add(comp); };
  self.addThinkable = function (comp) { thinkables.add(comp); };

  function _updateCollection(collection, dt) {
    for (let components of collection.all()) {
      for (let component of components.values()) {
        component.update(dt);
      }
    }
  }

  self._update = function(dt) {
    _updateCollection(updatables, dt);
    _updateCollection(thinkables, dt);
    self.update(dt);
  };
  // framework function -- not required
  self.update = function(dt) {};

  self._draw = function() {
    for (let components of drawables.all()) {
      for (let component of components.values()) {
        component.draw();
      }
    }
  };

  self._think = function() {
    for (let components of thinkables.all()) {
      for (let component of components.values()) {
        component.think();
      }
    }
  };

  if (tOptions != null) {
    self.transform = dalí.EntityTransform(tOptions.options, tOptions.base, tOptions.parent);
  } else {
    self.transform = dalí.EntityTransform();
  }

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
dalí.Drawable = function (base) {
  var self = dalí.Object(base);
  self.setType('drawable');

  // TODO draw order, draw, etc.

  self.draw = function() {
    console.log('You should override draw!');
  };

  return self;
};

// AN UPDATABLE COMPONENT
dalí.Updatable = function (base) {
  var self = dalí.Object(base);
  self.setType('updatable');

  // TODO object order

  self.update = function(dt) {
    // required to implement
    throw 'Not yet implemented: ' + self.inherit + '.update';
  };

  return self;

};

// THINKABLE -- AI COMPONENT
dalí.Thinkable = function (base) {
  var self = dalí.Updatable(base);
  self.setType('thinkable');

  self.think = function () {
    throw 'Not yet implemented: ' + self.getType() + '.think';
  };

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

// EventManager
(function () {

  function EventManager() {
    // TODO
  }

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

  var gl = null;
  // TODO globals from previous hws

  window.dalí.Material = function(options, base) {
    var self = window.dalí.Object(base);
    self.setType('material');

    // TODO

    return self;
  };

  window.dalí.Light = function(options, base) {
    var self = window.dalí.Entity(base);
    self.setType('light');

    // TODO

    return self;
  };

  window.dalí.Texture = function(options, base) {
    var self = window.dalí.Object(base);
    self.setType('texture');

    // TODO

    return self;
  };

  // SHADER
  window.dalí.Shader = function(options, base) {
    var self = window.dalí.Object(base);
    self.setType('shader');

    // TOOD

    return self;
  };

  // MODEL FOR DRAWERS
  window.dalí.Model = function(base) {
    var self = window.dalí.Object(base);
    self.setType('model');
    // TODO

    return self;
  };

  // MESH
  window.dalí.Mesh = function(options, base) {
    var self = window.dalí.Object(base);
    self.setType('mesh');

    return self;
  };

  // TRIMESH
  window.dalí.TriMesh = function(options, base) {
    var self = window.dalí.Mesh(base);
    self.setType('trimesh');

    // TODO

    return self;
  };

}) ();
