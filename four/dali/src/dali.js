
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

const daliReg = new RegExp('dali', 'i');
dali.isDaliObj = function(obj) {
  return obj != null && obj.dGUID != null && obj.getType != null && obj.inherit != null && daliReg.test(obj.inherit);
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
    self.dGUID = self.dGUID || guid();
    self.inherit = 'dali';
    self.setType = function(_type) {
      type = _type;
      self.inherit += '.' + type;
    };
    self.getType = function () { return type; }
    self.setType('object');
    self.isType = function(type) {
      if (dali.isString(type))
        return (new RegExp(type.toLowerCase(), 'i')).test(self.inherit);
      return false;
    };

    return self;
  };

}) ();

// OBJECT LOOKUP MANAGER
dali.ObjectManager = function(objType, base) {
  if (!dali.isString(objType)) throw 'Invalid object type for objType argument';
  
  // private
  var self = dali.Object(base);
  self.setType('objectmanager');
  var regex = new RegExp(objType.toLowerCase(), 'i');
  var objects = new Map();
  var typeMap = new Map();
  var queue = []; // TODO make it a priority queue

  function checkType(type) {
    if (dali.isString(type) && !typeMap.has(type))
      typeMap.set(type, []);
  }

  function checkGuid(guid) {
    if (!dali.isString(guid)) throw 'Invalid guid ' + guid;
    if (objects.has(guid)) throw 'GUID collision: ' + guid;
  }

  // public
  self.add = function (object) {
    if (dali.isDaliObj(object) && regex.test(object.inherit)) {
      checkType(object.getType());
      checkGuid(object.dGUID);
      typeMap.get(object.getType()).push(object.dGUID);
      objects.set(object.dGUID, object);
      queue.push({ guid: object.dGUID }); // TODO
      return ;
    }
    throw ('Cannot insert: ' + object);
  };

  self.size = function() { return queue.length; };

  self.hasObj = function (guid) {
    return guid != null && dali.isString(guid) && objects.has(guid);
  };

  self.getObj = function (guid) {
    if (guid != null && dali.isNumber(guid) && guid < queue.length && guid > -1) {
      var info = queue[guid];
      guid = info.guid;
    }
    if (self.hasObj(guid))
      return objects.get(guid);
    throw ('Does not contain an Object with guid: \'' + guid + '\'');
  };

  self.getObjByType = function(type) {
    if (type == null || !dali.isString(type) || !typeMap.has(type))
      throw ('Does not contain an Object of type: \'' + type + '\'');

    var list = typeMap.get(type);
    if (list.length < 1) throw ('Does not contain an Object of type: \'' + type + '\'');
    return list[0];
  };

  self.getObjs = function(type) {
    if (type != null && dali.isString(type) && typeMap.has(type)) {
      var guidList = typeMap.get(type);
      var out = [];
      for (var guid of guidList) {
        out.push(objects.get(guid));
      }
      return out;
    }
    throw ('Does not contain Objects of type: \'' + type + '\'');
  };

  self[Symbol.iterator] = function() {
    return {
      ptr: 0,
      next: function() {
        if (this.ptr > self.size() - 1) return { done: true };
        return {
         value: self.getObj(this.ptr++),
         done: false,
        };
      }
    };
  };

  self.iterator = self[Symbol.iterator];

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
    for (var component of collection) {
      component.update(dt);
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

  self._requestRender = function() {
    for (var component of renderables) {
      component.requestRender();
    }
  };

  self._think = function() {
    for (var component of thinkables) {
      component.think();
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

  function set(options) {
    options = options || {};
    self.setPosition(options.position);
    self.setRotationFromAxes(options.axes);
    self.setScale(options.scale);
  }
  set(options);

  // TODO add frame caching for matrix transform isn't recalculated
  self.toMatrix = function() {
    var t = mat4.create();
    mat4.fromRotationTranslationScaleOrigin(
      t, 
      rotation.quat(),
      position.vec3(),
      scale.vec3(),
      vec3.fromValues(0, 0, 0) // TODO change to position?
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

  self.requestRender = function() {
    console.log('You should override requestRender!');
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

