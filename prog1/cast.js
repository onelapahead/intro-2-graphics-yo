const EPSILON = 0.00001;
const BIAS = 0.01;

// src: http://www.scratchapixel.com/lessons/3d-basic-rendering/introduction-to-shading/ligth-and-shadows

class RayCaster {
  constructor(lights, spheres, imgData) {
    this.lights = lights;
    this.spheres = spheres;
    this.imgData = imgData;
  }

  castRayAndDraw(eye, pixel) {
    var ray = new Lerp(eye, pixel.position);

    var intersection = this.castRay(ray, true);

    if (typeof(intersection.i) !== 'undefined') {
      var sphere = this.spheres[intersection.i];
      var c = this.blinnPhongShader(sphere, ray, intersection.t);
      drawPixel(this.imgData, pixel.view.i, pixel.view.j, c);
    } else {
      drawPixel(this.imgData, pixel.view.i, pixel.view.j, new Color(0,0,0,255));
    }
  }

  castRay(ray, closest) {
    var intersection = { 't': Number.MAX_VALUE };
    var n = this.spheres.length;
    for (var i = 0; i < n; i++) {
      var a = ray.d.dot(ray.d);
      var ec = ray.a.sub(this.spheres[i].center);
      var b = 2 * ray.d.dot(ec);
      var c = ec.dot(ec) - this.spheres[i].r * this.spheres[i].r;
      var disc = b*b - 4*a*c;
      var t = null;
      if (disc < -EPSILON) {
        continue; // no intersection
      } else if (disc > EPSILON) {
        var t0 = (-b + Math.sqrt(disc)) / (2 * a);
        var t1 = (-b - Math.sqrt(disc)) / (2 * a);
        if (t1 < t0)
          t = t1;
        else
          t = t0;
      } else {
        t = -b / (2 * a);
      }
      if (t < intersection.t && t >= 0.0) {
        intersection.t = t;
        intersection.i = i;
        if (!closest) break;
      }
    }
    return intersection;
  }

  blinnPhongShader(sphere, ray, t) {
    var point = ray.interpolate(t);
    var normal = point.sub(sphere.center);
    normal = normal.unit();

    var ambient = new Vector(0, 0, 0);
    var diffuse = new Vector(0, 0, 0);
    var specular = new Vector(0, 0, 0);

    for (var i = 0; i < this.lights.length; i++) {

      ambient = ambient.add(this.lights[i].ambient);

      var shadowRay = new Lerp(point.add(normal.mult(BIAS)), this.lights[i].position);
      var intersection = this.castRay(shadowRay);

      if (typeof(intersection.i) === 'undefined') {
        var l = this.lights[i].position.sub(point);
        var v = ray.a.sub(point);
        l = l.unit();
        v = v.unit();
        var h = l.add(v);
        h = h.unit();

        var nl = normal.dot(l);
        var nh = normal.dot(h);
        if (nh < 0) nh = 0;
        if (nl < 0) nl = 0;
        // n' = 4n, n' is for Blinn-Phong, n is for Phong
        // src: https://en.wikipedia.org/wiki/Blinn–Phong_shading_model
        nh = Math.pow(nh, 4 * sphere.n);

        diffuse = diffuse.add(this.lights[i].diffuse.mult(nl));
        specular = specular.add(this.lights[i].specular.mult(nh));
      }
    }

    var coeff = ambient.mult(sphere.ambient).add(diffuse.mult(sphere.diffuse)).add(specular.mult(sphere.specular));
    if (coeff.x > 1.0) coeff.x = 1.0;
    if (coeff.y > 1.0) coeff.y = 1.0;
    if (coeff.z > 1.0) coeff.z = 1.0;
    return new Color(255*coeff.x, 255*coeff.y, 255*coeff.z, 255);
  }
}
