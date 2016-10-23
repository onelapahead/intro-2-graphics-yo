
function Sphere (params, longBands, latBands) {
  var sphere = {};
  sphere.radius = params.r;

  sphere.model = {
    material: {},
    vertices: [],
    normals: [],
    triangles: [],
  };
  sphere.model.material.ambient = params.ambient;
  sphere.model.material.diffuse = params.diffuse;
  sphere.model.material.specular = params.specular;
  sphere.model.material.shininess = params.n;
  sphere.model.transform = mat4.create();
  sphere.model.origin = vec4.fromValues(params.x, params.y, params.z, 1.0);
  sphere.model.center = vec4.clone(sphere.model.origin);
  mat4.identity(sphere.model.transform);

  var vertex, normal;
  var theta, sinTheta, cosTheta, phi, sinPhi, cosPhi;
  var x, y, z;
  for (var lat = 0; lat <= latBands; lat++) {
    theta = lat * Math.PI / latBands;
    sinTheta = Math.sin(theta);
    cosTheta = Math.cos(theta);
    for (var lon = 0; lon <= longBands; lon++) {
      phi = lon * 2 * Math.PI / longBands;
      sinPhi = Math.sin(phi);
      cosPhi = Math.cos(phi);

      x = sinTheta * cosPhi;
      y = cosTheta;
      z = sinTheta * sinPhi;

      sphere.model.normals.push([x, y, z]);
      sphere.model.vertices.push([
        params.x + sphere.radius * x,
        params.y + sphere.radius * y,
        params.z + sphere.radius * z,
      ]);
    }
  }

  var first, second;
  for (var lat = 0; lat < latBands; lat++) {
    for (var lon = 0; lon < longBands; lon++) {
      first = (lat * (longBands + 1)) + lon;
      second = first + longBands + 1;

      sphere.model.triangles.push([first, second, first + 1]);
      sphere.model.triangles.push([second, second + 1, first + 1]);
    }
  }
  return sphere;
}

function Model(model) {
  model.transform = mat4.create();
  mat4.identity(model.transform);
      
  model.center = vec3.fromValues(0.0, 0.0, 0.0);
  var vertex = vec3.create();
  for (var i = 0; i < model.vertices.length; i++) {
    vec3.set(vertex, model.vertices[i][0], model.vertices[i][1], model.vertices[i][2]);
    vec3.add(model.center, vertex, model.center);
  }
  vec3.scale(model.center, model.center, 1.0 / model.vertices.length); // avg
  model.origin = vec4.fromValues(model.center[0], model.center[1], model.center[2], 1.0);
  model.center = vec4.clone(model.origin);
  return model;
}

function Light(params) {
  return {
    position: new vec3.fromValues(params.x, params.y, params.z),
    ambient: new vec3.fromValues(params.ambient[0], params.ambient[1], params.ambient[2]),
    diffuse: new vec3.fromValues(params.diffuse[0], params.diffuse[1], params.diffuse[2]),
    specular: new vec3.fromValues(params.specular[0], params.specular[1], params.specular[2]),
    positionView: vec3.create(),
  }
}
