
function castRayAndDraw(params) {
  const EPSILON = 0.00001;
  var ray = new Lerp(params.eye, params.pixel.position);

  var intersection = { 't': Number.MAX_VALUE };
  var sphere = null;

  var n = params.spheres.length;
  for (var i = 0; i < n; i++) {
    sphere = params.spheres[i];
    var a = ray.d.dot(ray.d);
    var ec = ray.a.sub(sphere.center);
    var b = 2 * ray.d.dot(ec);
    var c = ec.dot(ec) - sphere.r * sphere.r;
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
    if (t < intersection.t && t > 0) {
      intersection.t = t;
      intersection.i = i;
    }
  }

  if (typeof(intersection.i) !== 'undefined') {
    var sphere = params.spheres[intersection.i];
    var c = blinnPhongShader(sphere, ray, intersection.t, params.light);
    drawPixel(params.imgData, params.pixel.view.i, params.pixel.view.j, c);
  } else {
    drawPixel(params.imgData, params.pixel.view.i, params.pixel.view.j, new Color(0,0,0,255));
  }
}

function blinnPhongShader(sphere, ray, t, light) {
  var point = ray.interpolate(t);
  var normal = point.sub(sphere.center);
  var l = light.position.sub(point);
  var v = ray.a.sub(point);
  var h = l.add(v)
  l = l.unit();
  h = h.unit();
  normal = normal.unit();

  var nl = normal.dot(l);
  var nh = normal.dot(h);
  if (nh < 0) nh = 0;
  if (nl < 0) nl = 0;

  var ambient = sphere.ambient.mult(light.ambient);
  var diffuse = sphere.diffuse.mult(nl).mult(light.diffuse);
  var specular = sphere.specular.mult(nh).mult(light.specular);

  var coeff = ambient.add(diffuse).add(specular);
  delete ambient, diffuse, specular;
  return new Color(255*coeff.x, 255*coeff.y, 255*coeff.z, 255);
}
