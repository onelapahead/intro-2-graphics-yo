
// Scences and SceneManager
(function () {

  function Scene(base) {
    // private
    var self = window.dali.Object(base);
    self.setType('scene');

    var entities = window.dali.ObjectManager('entity');

    self.addEntity = function(entity) { entities.add(entity); };

    self.update = function(dt) {
      for (var entity of entities) {
        entity._update(dt);
      }
    };

    self.requestRender = function() {
      for (var entity of entities) {
        entity._requestRender();
      }
    };

    return self;
  }

  // stack and queue in js:
  //    http://stackoverflow.com/questions/1590247/how-do-you-implement-a-stack-and-a-queue-in-javascript
  function SceneManager() {
    // private
    var self = window.dali.Object();
    self.setType('scenemanager');

    // TODO maintain initial state, make it return an iterator

    var sceneOrder = [];
    var scenes = window.dali.ObjectManager('scene');
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
