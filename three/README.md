**Hayden Fuss <mailto:whfuss@ncsu.edu>**  
**Homework 3: Textures and Transparency**  
**CSC 461**  
**11/19/2016**

My program was adapted from Dr. Watson's shell. The tar contains the following files:

+ `index.html`
+ `rasterize.js`
+ `rasterize.css`
+ `gl-matrix-min.js`

There are no extra credit or additional features. Textures with lighting and texture transparencies are achieved using modulation. After textures are loaded, objects are sorted into opaque and translucent before the render loop begins. An object is considered translucent if it's material's alpha is less than 1.0, or if it's texture contains a pixel with an alpha less than 1.0. Opaque objects are then drawn first with the `gl.depthMask` set to true (z-buffering on), and blending disabled. Translucent objects are then drawn with the `gl.depthMask` set to false (z-buffering off), and blending enabled with using the source alpha and the destination component turned on for the blending function. Spheres are drawn before triangles as a sort of "simple sort" for getting decent results. Input is the same as program 2, and because it was adapted from Dr. Watson's, it only works in Chrome.
