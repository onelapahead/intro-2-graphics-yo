
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