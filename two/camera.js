
class Camera {
  
  constructor(eye, lookAt, lookUp, fovY, near, far) {
    this.eye = new vec4.fromValues(eye[0], eye[1], eye[2], 1.0);
    this.lookAt = new vec4.fromValues(lookAt[0], lookAt[1], lookAt[2], 0.0);
    this.lookUp = new vec4.fromValues(lookUp[0], lookUp[1], lookUp[2], 0.0);

    this.cEye = vec4.create();
    this.cLookAt = vec4.create();
    this.cLookUp = vec4.create();

    vec4.normalize(this.lookAt, this.lookAt);
    vec4.normalize(this.lookUp, this.lookUp);
    this.transform = mat4.create();
    this.reset();

    this.view = mat4.create();
    this.target = vec3.create();
    this.viewProjection = mat4.create();

    this.fovY = fovY;
    this.near = near;
    this.far = far;

    this.normal = mat4.create();
  }

  move(mvmt, dt) {
    var z = new vec3.fromValues(this.cLookAt[0], this.cLookAt[1], this.cLookAt[2]);
    var y = new vec3.fromValues(this.cLookUp[0], this.cLookUp[1], this.cLookUp[2]);
    var x = vec3.create();
    vec3.cross(x, y, z);
    vec3.normalize(x, x);
    vec3.scale(z, z, mvmt[2]);
    vec3.scale(y, y, mvmt[1]);
    vec3.scale(x, x, mvmt[0]);

    mvmt = new vec3.fromValues(0.0, 0.0, 0.0);
    vec3.add(mvmt, mvmt, x);
    vec3.add(mvmt, mvmt, y);
    vec3.add(mvmt, mvmt, z);
    vec3.scale(mvmt, mvmt, dt);

    var translate = mat4.create();
    mat4.fromTranslation(translate, mvmt);

    mat4.multiply(this.transform, translate, this.transform);
  }

  rotate(rtn, dt) {
    var rotation = mat4.create();
    var temp = mat4.create();
    var translate = vec3.create();
    vec3.negate(translate, new vec3.fromValues(this.cEye[0], this.cEye[1], this.cEye[2]));
    mat4.fromTranslation(rotation, translate);
    mat4.fromXRotation(temp, rtn[0] * dt);
    mat4.multiply(rotation, temp, rotation);
    mat4.fromYRotation(temp, rtn[1] * dt);
    mat4.multiply(rotation, temp, rotation);
    mat4.fromZRotation(temp, rtn[2] * dt);
    mat4.multiply(rotation, temp, rotation);
    translate = new vec3.fromValues(this.cEye[0], this.cEye[1], this.cEye[2]);
    mat4.fromTranslation(temp, translate);
    mat4.multiply(rotation, temp, rotation);

    mat4.multiply(this.transform, rotation, this.transform);
  }

  update() {
    vec4.transformMat4(this.cEye, this.eye, this.transform);
    vec4.transformMat4(this.cLookAt, this.lookAt, this.transform);
    vec4.normalize(this.cLookAt, this.cLookAt);
    vec4.transformMat4(this.cLookUp, this.lookUp, this.transform);
    vec4.normalize(this.cLookUp, this.cLookUp);

    vec3.add(this.target, this.cEye, this.cLookAt);
    mat4.lookAt(this.view, this.cEye, this.target, this.cLookUp);

    mat4.perspective(this.viewProjection, this.fovY, gl.canvas.width / gl.canvas.height, this.near, this.far);
    mat4.invert(this.normal, this.view);
    mat4.transpose(this.normal, this.normal);

    mat4.multiply(this.viewProjection, this.viewProjection, this.view);
  }

  reset() {
    mat4.identity(this.transform);
  }

}
