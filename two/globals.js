/* GLOBAL CONSTANTS AND VARIABLES */

/* assignment specific globals */
const INPUT_TRIANGLES_URL = "https://ncsucgclass.github.io/prog2/triangles.json"; // triangles file loc
const INPUT_SPHERES_URL = "https://ncsucgclass.github.io/prog2/spheres.json"; // spheres file loc
const INPUT_LIGHTS_URL = "https://ncsucgclass.github.io/prog2/lights.json";
//const INPUT_LIGHTS_URL = "http://pastebin.com/raw/AnzpEvZH";

var oEye = [0.5,0.5,-0.5]; // default eye position in world space
var oLookAt = [0.0, 0.0, 1.0];
var oLookUp = [0.0, 1.0, 0.0];
const fovY = Math.PI / 4;
const near = 0.5;
const far = 1.5;
const WIN_Z = 0;  // default graphics window z coord in world space
const WIN_LEFT = 0; const WIN_RIGHT = 1;  // default left and right x coords in world space
const WIN_BOTTOM = 0; const WIN_TOP = 1;  // default top and bottom y coords in world space
var camera = new Camera(oEye, oLookAt, oLookUp, fovY, near, far);

var lights = [];

var models = [];
var spheres = [];
var triangles = [];
var spherePtr = 0, trianglePtr = 0;
var selected = null;
var selectionState = null;
var start, dt;

var downKeys = new Array(128);

var Highlight = {
  ambient: new vec3.fromValues(0.5, 0.5, 0.0),
  diffuse: new vec3.fromValues(0.5, 0.5, 0.0),
  specular: new vec3.fromValues(0.0, 0.0, 0.0),
  shininess: 1.0,
};

/* webgl globals */
var gl = null; // the all powerful gl object. It's all here folks!
var vertexBuffer; // this contains vertex coordinates in triples
var triangleBuffer; // this contains indices into vertexBuffer in triples
var normalBuffer;
var triBufferSize = 0; // the number of indices in the triangle buffer
var vertexPositionAttrib, // where to put position for vertex shader
    vertexNormalAttrib,
    lightProductsLocation = [],
    viewProjectionLocation,
    viewLocation,
    normalLocation,
    lightsLocation = [],
    transformLocation,
    numberOfLightsLoc;

const UP = 38, LEFT = 37, RIGHT = 39, DOWN = 40, SPACE = 32;
