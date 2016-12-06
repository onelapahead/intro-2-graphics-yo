
// DALÍ 'FRAMEWORK' OBJECT
var dali = {
  graphx: {
    g3D: {},
    g2D: {}
  },
  physx: {
    p3D: {}
  },
  audio: {},
};

const objTypes = ['String', 'Number', 'Array', 'Object', 'Map'];
objTypes.forEach(function(type) {
  dali['is' + type] = function (obj) {
    return (Object.prototype.toString.call(obj) === '[object ' + type + ']');
  };
});
delete objTypes;

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
    self.dGUID = self.dGUID || guid();
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
dali.Entity = function (options, base) {
  // private
  var self = dali.Object(base);
  self.setType('entity');

  var updatables = dali.ObjectManager('updatable');
  var renderables = dali.ObjectManager('renderable');
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
  self.addRenderable = function (comp) { renderables.add(comp); };
  self.addThinkable = function (comp) { thinkables.add(comp); };

  self._update = function(dt) {
    _updateCollection(updatables, dt);
    _updateCollection(thinkables, dt);
    self.update(dt);
  };
  // framework function -- not required
  self.update = function(dt) {};

  self._render = function() {
    for (var components of renderables.all()) {
      for (var component of components.values()) {
        component.render();
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

  if (options == null || options.transform == null)
    self.transform = dali.EntityTransform();
  else {
    self.transform = dali.EntityTransform(options.transform.options, options.transform.base, options.transform.parent);
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

  var position = null, rotation = null, scale = null;

  self.setPosition = function(_position) {
    if (_position == null) _position = {};
    position = new CANNON.Vec3(_position.x || 0.0, _position.y || 0.0, _position.z || 0.0);

    position.vec3 = function() {
      return vec3.fromValues(position.x,position.y,position.z);
    };
  };

  self.getPosition = function() {
    return position;
  };

  self.setScale = function(_scale) {
    if (_scale == null) _scale = {};
    scale = new CANNON.Vec3(_scale.x || 1.0, _scale.y || 1.0, _scale.z || 1.0);

    scale.vec3 = function() {
      return vec3.fromValues(scale.x,scale.y,scale.z);
    };
  };

  self.getScale = function() {
    return scale;
  };

  self.setRotationFromAxes = function(axes) {
    axes = axes || {};
    axes.up = axes.up || vec3.fromValues(0, 1, 0);
    axes.at = axes.at || vec3.fromValues(0, 0, 1);

    var right = vec3.create();
    vec3.cross(right, axes.up, axes.at);

    var rot = quat.create();
    quat.setAxes(rot, axes.at, right, axes.up);

    self.setRotationFromQuat(rot);
  };

  self.setRotationFromQuat = function(_quat) {
    _quat = _quat || quat.fromValues(0.0, 0.0, 0.0, 1.0);
    rotation = new CANNON.Quaternion(_quat[0], _quat[1], _quat[2], _quat[3]);
    rotation.quat = function() {
      return quat.fromValues(rotation.x, rotation.y, rotation.z, rotation.w);
    };
  };

  self.getRotation = function() { return rotation; };

  function setDefaults() {
    self.setPosition();
    self.setRotationFromAxes();
    self.setScale();
  }

  if (options != null) {
    // TODO if pos, rot, scale
    // TODO set values from model/body...
  } else {
    setDefaults();
  }

  // TODO add frame caching for matrix transform isn't recalculated
  self.toMatrix = function() {
    var t = mat4.create();
    mat4.fromRotationTranslationScaleOrigin(
      t, 
      rotation.quat(),
      position.vec3(),
      scale.vec3(),
      vec3.fromValues(0, 0, 0)
    );
    if (self.parent != null)
      mat4.multiply(t, self.parent.toMatrix(), t);
    return t;
  }

  return self;
};

// A RENDERABLE COMPONENT
dali.Renderable = function (base) {
  var self = dali.Object(base);
  self.setType('renderable');

  // TODO render order, render, etc.

  self.render = function() {
    console.log('You should override render!');
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

