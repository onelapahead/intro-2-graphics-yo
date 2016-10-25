**Hayden Fuss <mailto:whfuss@ncsu.edu>**  
**Homework 2: Rasterization**  
**CSC 461**  
**10/24/2016**

Within this tar are several files. The main file being `index.html` which contains the WebGL canvas and script tags referencing the needed Javascript files. A minified version of glMatrix, `gl-matrix-min.js` is firstly included, followed by `camera.js` which contains my Camera class that uses glMatrix to create translation and rotation matrices based on the current view axes.  

Then, `globals.js` contains all the global variables and constants the program needs to initialize and display its graphics. `setup.js` has some code provided by Dr. Watson for setting up WebGL, compiling my customized shaders, and initializing the necessary WebGL pointers for shader attributes and uniforms. `model.js` then has helper functions for triangulating spheres based on the given JSON objects, calculating the center of mass for non-sphere models, and converting the given light objects into something a little more useful.  

Next, `render.js` contains all the code for loading the models' vertices, normals, and triangles into the WebGL buffers and drawing each model. `update.js` just contains input event handlers and functions for updating the camera and selected model based on the given input. **NOTE**: for the capitalized inputs `CAPS LOCK` will not work, please use `shift` only.  
 
Lastly, `rasterize.js` contains a helper function for loading URL resources, and a main function for acquiring all the resources, calling the necessary setup functions, and initializing the game loop for repeatedly reading input and updating the view accordingly.

##### Extra Credit
+ Multiple arbitrary lights
+ Smooth shading by varying vertex normals

##### Helpful Sources
+ [OpenGL Lighting](https://www.opengl.org/sdk/docs/tutorials/ClockworkCoders/lighting.php)
+ [The Shader Language for WebGL](http://math.hws.edu/eck/cs424/notes2013/19_GLSL.html)
+ [WebGL 3D Camera](http://webglfundamentals.org/webgl/lessons/webgl-3d-camera.html)
+ [Matrix Tutorial for OpenGL](http://www.opengl-tutorial.org/beginners-tutorials/tutorial-3-matrices/)
+ [Using WebGL for 3D Transformations](http://math.hws.edu/graphicsbook/c7/s1.html)
+ [WebGL: How It Works](http://webglfundamentals.org/webgl/lessons/webgl-how-it-works.html)
+ [WebGL Shaders and GLSL](http://webglfundamentals.org/webgl/lessons/webgl-shaders-and-glsl.html)
+ [GLSL: Introduction](http://nehe.gamedev.net/article/glsl_an_introduction/25007/)
+ [Learning WebGL: Spheres, etc.](http://learningwebgl.com/blog/?p=1253)
+ [Calculating Normal Matrix](http://stackoverflow.com/questions/21079623/how-to-calculate-the-normal-matrix)
+ [Understanding the View Matrix](http://www.3dgep.com/understanding-the-view-matrix/)
