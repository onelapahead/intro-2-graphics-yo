
// Physics engine interface
(function () {

  var physx = dali.physx;
  var world, ground, groundMaterial;
  physx.init = function() {
    world = new CANNON.World();
    world.broadphase = new CANNON.NaiveBroadphase();
 
    var groundPlane = new CANNON.Plane();
    groundMaterial = physx.PMaterial();
    ground = new CANNON.Body({ position: new CANNON.Vec3(), mass: 0, shape: groundPlane, material: groundMaterial.mat });
    ground.quaternion.setFromVectors(
      new CANNON.Vec3(0, 0, 1),
      new CANNON.Vec3(0, 1, 0)
    );

    world.addBody(ground);
  };

  physx.update = function(dt) {
    getTransforms();

    world.step(dt);

    setTransforms();
  };

  physx.setGravity = function(accel) {
    world.gravity.set(accel.x, accel.y, accel.z);
  };

  // HACKish
  physx.setGroundHeight = function(height) {
    ground.position.y = height;
  };

  physx.defineGroundContact = function(material, options) {
    physx.defineMaterialContact(material, groundMaterial, options);
  };

  function getTransforms() {
    for (var body of bodies3d) {
      body.getEntityTransform();
    }
  }

  function setTransforms() {
    for (var body of bodies3d) {
      body.setEntityTransform();
    }
  }

  var bodies3d = window.dali.ObjectManager('entitybody');
  // Wrapper(s) for Cannon's Body object(s)
  physx.EntityBody = function(entity, options, base) {
    // TODO active/inactive
    var self = window.dali.Updatable(base);
    self.setType('entitybody');

    options = options || {
      material: options.material || physx.Material(), 
      mass: options.mass || 1,
      initVel: new CANNON.Vec3(),
      linDamp: options.linDamp || 0.1,
      type: options.type || CANNON.Body.DYNAMIC,
      shape: options.shape || new CANNON.Box(new Vec3(1, 1, 1)),
    };
    options.material = options.material || physx.PMaterial();
    options.mass = options.mass || 1; 
    options.initVel = options.initVel || new CANNON.Vec3();
    options.linDamp = options.linDamp || 0.1;
    options.print = options.print || false;

    bodies3d.add(self);

    // pass model to collider
    // use returned Shape, beware of rotation issues

    /*
     * Because the Box is AA, its rotation will initally
     * be zeros, while its entity's transform will
     * contain a rotation.
     *
     * rotation must be set using the "difference" btwn
     * the initial rotation/quaterion and the transform's
     * current
     *
     *
     */
    var shape;
    if (options.collider != null && options.model != null) {
      shape = options.collider.initShape(options.model);
    } else if (options.shape != null) {
      shape = options.shape;
    } else throw 'No shape information given for EntityBody';

    // Init cannon body with shape and entity positon
    var initPos = new CANNON.Vec3();
    var initRot = new CANNON.Quaternion();
    var eTransform = entity.transform;

    initPos.copy(eTransform.getPosition());
    initRot.copy(eTransform.getRotation())

    self.transform = new CANNON.Body({
      position: initPos,
      velocity: options.initVel,
      material: options.material.mat,
      shape: shape,
      mass: options.mass,
      linearDamping: options.linDamp,
      type: options.type,
      fixedRotation: true
    });
    self.transform.linearDamping = 0.01;
    world.addBody(self.transform);

    self.getEntityTransform = function() {
      self.transform.position.copy(eTransform.getPosition());
    };

    self.setEntityTransform = function() {
      eTransform.getPosition().copy(self.transform.position);
      if (options.print) {
        // console.log('Body: ' + self.transform.position);
        // console.log('Entity: ' + eTransform.getPosition());
      }
    };

    self.update = function(dt) {
      // OVERRIDE IF YOU WANT TO ADD BEHAVIOR ETC
    };

    entity.addUpdatable(self);

    return self;
  };

  physx.RigidBody = function () {
    // TODO
  };

  physx.Collider = function() {
    var self = window.dali.Object();
    self.setType('collider');

    // framework function
    // given model, use to generate AABB for box collider
    // and AABS for sphere collider
    // creates CANNNON.Shape and "physics transform" (pos, rot, scale)
    self.initShape = function(model) { throw 'Collider.init not implemented'; };

    return self;
  };

  physx.BoxCollider = function() {
    var self = physx.Collider();
    self.setType('boxcollider');

    self.initShape = function(model) {
      var modelAABB = model.getAABB();

      var half = new CANNON.Vec3(
        (modelAABB.max[0] - modelAABB.min[0]) / 2,
        (modelAABB.max[1] - modelAABB.min[1]) / 2,
        (modelAABB.max[2] - modelAABB.min[2]) / 2
      );

      return new CANNON.Box(half);
    };

    return self;
  };

  physx.SphereCollider = function(options) {
    // TODO
  };

  // wrapper for Cannon contactMaterial
  var contacts = new Map();
  physx.defineMaterialContact = function(mat1, mat2, options) {
    // TODO
    if (contacts.has(mat1.dGUID + mat2.dGUID) || contacts.has(mat2.dGUID + mat1.dGUID))
      return ;
    var contact = new CANNON.ContactMaterial(mat1.mat, mat2.mat, options);
    world.addContactMaterial(contact);
    contacts.set(mat1.dGUID + mat2.dGUID, contact);
  };

  // wrapper for cannon material
  physx.PMaterial = function(options) {
    var self = window.dali.Object();
    self.setType('pmaterial');

    // TODO options
    self.mat = new CANNON.Material();

    return self;
  };


}) ();
