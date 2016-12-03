
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
