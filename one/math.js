class Vector {
    // TODO sanitation checks
    constructor(x,y,z) {
        try {
            if (((typeof(x)) !== "number") || ((typeof(y)) !== "number") || ((typeof(z)) !== "number")) {
                console.log(typeof(x));
                throw "vector component not a number";
            } else
                this.x = x; this.y = y; this.z = z; 
        } // end try
        catch (e) {
            console.log(e);
        }
    }

    add(v) {
        return new Vector(this.x+v.x, this.y+v.y, this.z+v.z);
    }

    sub(v) {
        return new Vector(this.x-v.x, this.y-v.y, this.z-v.z);
    }

    mult(c) {
        if (c instanceof Vector) {
          return new Vector(this.x*c.x, this.y*c.y, this.z*c.z);
        }
        return new Vector(this.x*c, this.y*c, this.z*c);
    }

    div(c) {
        return new Vector(this.x/c, this.y/c, this.z/c);
    }

    dot(v) {
        return this.x*v.x + this.y*v.y + this.z*v.z;
    }

    cross(v) {
        return new Vector(
            this.y*v.z - this.z*v.y,
            this.z*v.x - this.x*v.z,
            this.x*v.y - this.y*v.x
        );
    }

    toString() {
        return '{ ' + this.x +  ', ' + this.y + ', ' + this.z + ' }'; 
    }

    get mag() {
      return Math.sqrt(this.magSq);
    }

    get magSq() {
      return this.x * this.x + this.y * this.y + this.z * this.z;
    }

    unit() {
      return this.div(this.mag);
    }

    static basicTest() {
        var a = new Vector(0,0,0);
        var b = a.sub(new Vector(1,1,1));
        var c = b.div(-0.5);

        log(a);
        log(b);
        log(c);

        var v = new Vector(1,0,0);
        var x = v.cross(new Vector(0,1,0));
        log(x);
        log(v.dot(x));

        log(b.unit());
    }
}

class Lerp {
  constructor(a,b) {
    this.a = a;
    this.d = b.sub(a);
  }

  interpolate(t) {
    return this.a.add(this.d.mult(t));
  }
}