// default vertex shader for 3d world/graphics
dali.graphx.g3D.vShaderCodeDefault = `
  attribute vec3 aVertexPosition; // vertex position
  attribute vec3 aVertexNormal; // vertex normal
  attribute vec2 aVertexTextureCoords; // vertex uv

  uniform mat4 umMatrix; // the model matrix
  uniform mat4 upvmMatrix; // the project view model matrix

  varying vec3 vWorldPos; // interpolated world position of vertex
  varying vec3 vVertexNormal; // interpolated normal for frag shader
  varying highp vec2 vTextureCoords; // interpolated uv

  void main(void) {

      // vertex position
      vec4 vWorldPos4 = umMatrix * vec4(aVertexPosition, 1.0);
      vWorldPos = vec3(vWorldPos4.x,vWorldPos4.y,vWorldPos4.z);
      gl_Position = upvmMatrix * vec4(aVertexPosition, 1.0);

      // vertex normal (assume no non-uniform scale)
      vec4 vWorldNormal4 = umMatrix * vec4(aVertexNormal, 0.0);
      vVertexNormal = normalize(vec3(vWorldNormal4.x,vWorldNormal4.y,vWorldNormal4.z));

      vTextureCoords = aVertexTextureCoords;
  }
`;

// default fragment shader: blinn-phong lighting
dali.graphx.g3D.fShaderCodeDefault = `
  precision mediump float; // set float to medium precision

  // eye location
  uniform vec3 uEyePosition; // the eye's position in world

  // lights informations
  uniform int uNumLights; // actual number of lights
  #define MAX_LIGHTS ` + dali.graphx.g3D.MAX_LIGHTS + ` // allowed max
  uniform vec3 uLightPositions[MAX_LIGHTS]; // array of light positions
  uniform vec3 uProductsAmbient[MAX_LIGHTS];
  uniform vec3 uProductsDiffuse[MAX_LIGHTS];
  uniform vec3 uProductsSpecular[MAX_LIGHTS];
  uniform float uShininess;

  // geometry properties
  varying vec3 vWorldPos; // world xyz of fragment
  varying vec3 vVertexNormal; // normal of fragment

  varying highp vec2 vTextureCoords; // interpolated uv
  uniform sampler2D uTexture; // texture sampler
  uniform float uAlpha; // material alpha

  void main(void) {
    vec3 color = vec3(0.0, 0.0, 0.0);

    vec3 E = normalize(uEyePosition - vWorldPos);
    vec3 n = normalize(vVertexNormal);
    for (int i = 0; i < MAX_LIGHTS; i++) {
      if (i >= uNumLights) break;
      vec3 L = normalize(uLightPositions[i] - vWorldPos);
      vec3 H = normalize(L + E);

      vec3 Idiff = uProductsDiffuse[i] * max(dot(n, L), 0.0);
      Idiff = clamp(Idiff, 0.0, 1.0);

      vec3 Ispec = uProductsSpecular[i] * pow(max(dot(n, H), 0.0), uShininess);
      Ispec = clamp(Ispec, 0.0, 1.0);

      color = clamp(color + uProductsAmbient[i] + Idiff + Ispec, 0.0, 1.0);
    }

    gl_FragColor = vec4(color, uAlpha) * texture2D(uTexture, vec2(vTextureCoords.s, vTextureCoords.t));
  }
`;

// "antialiased cartoon shader"
// src:
//   http://prideout.net/blog/?p=22
dali.graphx.g3D.fShaderCodeCartoon = `
  #extension GL_EXT_shader_texture_lod : enable
  #extension GL_OES_standard_derivatives : enable

  precision mediump float; // set float to medium precision

  // eye location
  uniform vec3 uEyePosition; // the eye's position in world

  // lights informations
  uniform int uNumLights; // actual number of lights
  #define MAX_LIGHTS ` + dali.graphx.g3D.MAX_LIGHTS + ` // allowed max
  uniform vec3 uLightPositions[MAX_LIGHTS]; // array of light positions
  uniform vec3 uProductsAmbient[MAX_LIGHTS];
  uniform vec3 uProductsDiffuse[MAX_LIGHTS];
  uniform vec3 uProductsSpecular[MAX_LIGHTS];
  uniform float uShininess;

  // geometry properties
  varying vec3 vWorldPos; // world xyz of fragment
  varying vec3 vVertexNormal; // normal of fragment

  varying highp vec2 vTextureCoords; // interpolated uv
  uniform sampler2D uTexture; // texture sampler
  uniform float uAlpha; // material alpha

  float stepmix(float edge0, float edge1, float E, float x) {
      float T = clamp(0.5 * (x - edge0 + E) / E, 0.0, 1.0);
      return mix(edge0, edge1, T);
  }

  void main(void) {
    vec3 color = vec3(0.0, 0.0, 0.0);
    const float A = 0.1;
    const float B = 0.3;
    const float C = 0.6;
    const float D = 1.0;

    vec3 Eye = normalize(uEyePosition - vWorldPos);
    vec3 n = normalize(vVertexNormal);
    for (int i = 0; i < MAX_LIGHTS; i++) {
      if (i >= uNumLights) break;
      vec3 L = normalize(uLightPositions[i] - vWorldPos);
      vec3 H = normalize(L + Eye);

      float df = max(dot(n, L), 0.0);
      float sf = pow(max(dot(n, H), 0.0), uShininess);
      float E = fwidth(df);

      if (df > A - E && df < A + E) df = stepmix(A, B, E, df);
      else if (df > B - E && df < B + E) df = stepmix(B, C, E, df);
      else if (df > C - E && df < C + E) df = stepmix(C, D, E, df);
      else if (df < A) df = 0.0;
      else if (df < B) df = B;
      else if (df < C) df = C;
      else df = D;

      E = fwidth(sf);
      if (sf > 0.5 - E && sf < 0.5 + E)
      {
        sf = smoothstep(0.5 - E, 0.5 + E, sf);
      }
      else
      {
          sf = step(0.5, sf);
      }

      vec3 Idiff = uProductsDiffuse[i] * df;
      Idiff = clamp(Idiff, 0.0, 1.0);

      vec3 Ispec = uProductsSpecular[i] * sf;
      Ispec = clamp(Ispec, 0.0, 1.0);

      color = clamp(color + uProductsAmbient[i] + Idiff + Ispec, 0.0, 1.0);
    }

    gl_FragColor = vec4(color, uAlpha) * texture2D(uTexture, vec2(vTextureCoords.s, vTextureCoords.t));
  }
`;