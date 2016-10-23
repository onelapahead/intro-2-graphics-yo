
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

    this.z = vec3.create();
    this.y = vec3.create();
    this.x = vec3.create();
  }

  axes() {
    vec3.copy(this.z, this.cLookAt);
    vec3.copy(this.y, this.cLookUp);
    vec3.cross(this.x, this.y, this.z);
    vec3.normalize(this.x, this.x);
  }

  translation(mvmt, dt) {
    var x = vec3.create(), y = vec3.create(), z = vec3.create();
    vec3.scale(z, this.z, mvmt[2]);
    vec3.scale(y, this.y, mvmt[1]);
    vec3.scale(x, this.x, mvmt[0]);

    mvmt = new vec3.fromValues(0.0, 0.0, 0.0);
    vec3.add(mvmt, mvmt, x);
    vec3.add(mvmt, mvmt, y);
    vec3.add(mvmt, mvmt, z);
    vec3.scale(mvmt, mvmt, dt);

    var T = mat4.create();
    mat4.fromTranslation(T, mvmt);
    return T;
  }

  move(mvmt, dt) {
    var T = this.translation(mvmt, dt);
    mat4.multiply(this.transform, T, this.transform);
  }

  rotation(rtn, point, dt) {
    var R = mat4.create();
    var temp = mat4.create();
    var T = vec3.create();
    vec3.negate(T, point);
    mat4.fromTranslation(R, T);
    mat4.fromRotation(temp, rtn[0] * dt, this.x);
    mat4.multiply(R, temp, R);
    mat4.fromRotation(temp, rtn[1] * dt, this.y);
    mat4.multiply(R, temp, R);
    mat4.fromRotation(temp, rtn[2] * dt, this.z);
    mat4.multiply(R, temp, R);
    mat4.fromTranslation(temp, point);
    mat4.multiply(R, temp, R);
    return R;
  }

  rotate(rtn, dt) {
    var R = this.rotation(rtn, this.cEye, dt);
    mat4.multiply(this.transform, R, this.transform);
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
