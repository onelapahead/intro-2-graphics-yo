
class Sphere {
  
  constructor(params, longBands, latBands) {
    this.radius = params.r;

    this.model = {
      material: {},
      vertices: [],
      normals: [],
      triangles: [],
    };
    this.model.material.ambient = params.ambient;
    this.model.material.diffuse = params.diffuse;
    this.model.material.specular = params.specular;
    this.model.material.shininess = params.n;
    this.model.transform = mat4.create();
    this.model.center = vec4.fromValues(params.x, params.y, params.z, 1.0);
    mat4.identity(this.model.transform);

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

        this.model.normals.push([x, y, z]);
        this.model.vertices.push([
          params.x + this.radius * x,
          params.y + this.radius * y,
          params.z + this.radius * z,
        ]);
      }
    }

    var first, second;
    for (var lat = 0; lat < latBands; lat++) {
      for (var lon = 0; lon < longBands; lon++) {
        first = (lat * (longBands + 1)) + lon;
        second = first + longBands + 1;

        this.model.triangles.push([first, second, first + 1]);
        this.model.triangles.push([second, second + 1, first + 1]);
      }
    }
  }
}

function calculateCOM(model) {
  model.center = vec3.fromValues(0.0, 0.0, 0.0);
  var vertex = vec3.create();
  for (var i = 0; i < model.vertices.length; i++) {
    vec3.set(vertex, model.vertices[i][0], model.vertices[i][1], model.vertices[i][2]);
    vec3.add(model.center, vertex, model.center);
  }
  vec3.scale(model.center, model.center, 1.0 / model.vertices.length); // avg
  model.center = vec4.fromValues(model.center[0], model.center[1], model.center[2], 1.0);
}
