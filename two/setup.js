
// set up the webGL environment
function setupWebGL() {

    // Get the canvas and context
    var canvas = document.getElementById("myWebGLCanvas"); // create a js canvas
    gl = canvas.getContext("webgl"); // get a webgl object from it
    
    try {
      if (gl == null) {
        throw "unable to create gl context -- is your browser gl ready?";
      } else {
        gl.clearColor(0.0, 0.0, 0.0, 1.0); // use black when we clear the frame buffer
        gl.clearDepth(1.0); // use max when we clear the depth buffer
        gl.enable(gl.DEPTH_TEST); // use hidden surface removal (with zbuffering)
      }
    } // end try
    
    catch(e) {
      console.log(e);
    } // end catch
 
} // end setupWebGL

// setup the webGL shaders
function setupShaders() {
    // define fragment shader in essl using es6 template strings
    var fShaderCode = `
        precision mediump float;
        #define MAX_LIGHTS 20
        struct material {
            vec3 ambient;
            vec3 diffuse;
            vec3 specular;
            float shininess;
        };

        uniform int nLights;
        uniform vec3 lights[MAX_LIGHTS];
        uniform material lightProducts[MAX_LIGHTS];

        varying vec3 V;
        varying vec3 N;

        void main(void) {
            vec3 color = vec3(0.0, 0.0, 0.0);
            for (int i = 0; i < MAX_LIGHTS; i++) {
              if (i >= nLights) break;
              vec3 L = normalize(lights[i] - V);
              vec3 E = normalize(-V);
              vec3 H = normalize(L + E);
              vec3 n = normalize(N);

              vec3 Idiff = lightProducts[i].diffuse * max(dot(n, L), 0.0);
              Idiff = clamp(Idiff, 0.0, 1.0);

              vec3 Ispec = lightProducts[i].specular * pow(max(dot(n, H), 0.0), 4.0 * lightProducts[i].shininess);
              Ispec = clamp(Ispec, 0.0, 1.0);
            
              color = clamp(color + lightProducts[i].ambient + Idiff + Ispec, 0.0, 1.0);
            }


            gl_FragColor = vec4(color, 1.0); // triangle's diffuse color only
        }
    `;
    
    // define vertex shader in essl using es6 template strings
    var vShaderCode = `

        uniform mat4 viewProjection;
        uniform mat4 view;
        uniform mat4 transform;
        uniform mat4 normalMatrix;
        attribute vec3 vertexNormal;
        attribute vec3 vertexPosition;

        varying vec3 N;
        varying vec3 V;

        void main(void) {
            gl_Position = transform * vec4(vertexPosition, 1.0);
            V = vec3(view * gl_Position);
            vec4 N4 = normalMatrix * transform * vec4(vertexNormal, 0.0);
            N = normalize(N4.xyz);
            gl_Position = viewProjection * gl_Position;
        }
    `;
    
    try {
        // console.log("fragment shader: "+fShaderCode);
        var fShader = gl.createShader(gl.FRAGMENT_SHADER); // create frag shader
        gl.shaderSource(fShader,fShaderCode); // attach code to shader
        gl.compileShader(fShader); // compile the code for gpu execution

        // console.log("vertex shader: "+vShaderCode);
        var vShader = gl.createShader(gl.VERTEX_SHADER); // create vertex shader
        gl.shaderSource(vShader,vShaderCode); // attach code to shader
        gl.compileShader(vShader); // compile the code for gpu execution
            
        if (!gl.getShaderParameter(fShader, gl.COMPILE_STATUS)) { // bad frag shader compile
            throw "error during fragment shader compile: " + gl.getShaderInfoLog(fShader);  
            gl.deleteShader(fShader);
        } else if (!gl.getShaderParameter(vShader, gl.COMPILE_STATUS)) { // bad vertex shader compile
            throw "error during vertex shader compile: " + gl.getShaderInfoLog(vShader);  
            gl.deleteShader(vShader);
        } else { // no compile errors
            var shaderProgram = gl.createProgram(); // create the single shader program
            gl.attachShader(shaderProgram, fShader); // put frag shader in program
            gl.attachShader(shaderProgram, vShader); // put vertex shader in program
            gl.linkProgram(shaderProgram); // link program into gl context

            if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) { // bad program link
                throw "error during shader program linking: " + gl.getProgramInfoLog(shaderProgram);
            } else { // no shader program link errors
                gl.useProgram(shaderProgram); // activate shader program (frag and vert)
                vertexPositionAttrib = // get pointer to vertex shader input
                    gl.getAttribLocation(shaderProgram, "vertexPosition"); 
                gl.enableVertexAttribArray(vertexPositionAttrib); // input to shader from array

                vertexNormalAttrib = gl.getAttribLocation(shaderProgram, "vertexNormal");
                gl.enableVertexAttribArray(vertexNormalAttrib);

                for (var i = 0; i < lights.length; i++) {
                  lightProductsLocation[i] = {};
                  lightProductsLocation[i].ambient = gl.getUniformLocation(shaderProgram, "lightProducts["+i+"].ambient");
                  lightProductsLocation[i].diffuse = gl.getUniformLocation(shaderProgram, "lightProducts["+i+"].diffuse");
                  lightProductsLocation[i].specular = gl.getUniformLocation(shaderProgram, "lightProducts["+i+"].specular");
                  lightProductsLocation[i].shininess = gl.getUniformLocation(shaderProgram, "lightProducts["+i+"].shininess");

                  lightsLocation[i] = gl.getUniformLocation(shaderProgram, "lights["+i+"]");
                }

                transformLocation = gl.getUniformLocation(shaderProgram, "transform");
                viewLocation = gl.getUniformLocation(shaderProgram, "view");
                normalLocation = gl.getUniformLocation(shaderProgram, "normalMatrix");
                viewProjectionLocation = gl.getUniformLocation(shaderProgram, "viewProjection");
                numberOfLightsLoc = gl.getUniformLocation(shaderProgram, "nLights");
            } // end if no shader program link errors
        } // end if no compile errors
    } // end try 
    
    catch(e) {
        console.log(e);
    } // end catch
} // end setup shaders
