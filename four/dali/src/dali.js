
// DALÍ 'FRAMEWORK' OBJECT
var dali = {};

dali.isString = function (obj) {
  return (Object.prototype.toString.call(obj) === '[object String]');
};

// good for loading json files
dali.loadResource = function(url) {
  return new Promise(function(resolve, reject) {
    var req = new XMLHttpRequest();
    req.open('GET', url);

    req.onload = function () {
        if (this.status == 200 && this.status < 300) {
            resolve(req.response);
        } else {
            reject({
                status: req.status,
                statusText: req.statusText
            });
        }
    };

    req.onerror = function() {
        reject({
            status: req.status,
            statusText: req.statusText
        });
    };
    req.send();
  });
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

