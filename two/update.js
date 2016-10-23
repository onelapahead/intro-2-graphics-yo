function updateCamera(dt) {
  var speed = 1.0;
  var rotateSpeed = 1.0;
  var mvmt = [0.0, 0.0, 0.0];
  var rotate = [0.0, 0.0, 0.0];

  var shift = downKeys[16];

  if (downKeys['A'.charCodeAt(0)]) {
    if (shift)
      rotate[1] += rotateSpeed;
    else
      mvmt[0] += speed;
  }

  if (downKeys['D'.charCodeAt(0)]) {
    if (shift)
      rotate[1] -= rotateSpeed;
    else
      mvmt[0] -= speed;
  }

  if (downKeys['W'.charCodeAt(0)]) {
    if (shift)
      rotate[0] += rotateSpeed;
    else
      mvmt[2] += speed;
  }

  if (downKeys['S'.charCodeAt(0)]) {
    if (shift)
      rotate[0] -= rotateSpeed;
    else
      mvmt[2] -= speed;
  }

  if (downKeys['Q'.charCodeAt(0)]) {
    if (shift)
      rotate[2] += rotateSpeed;
    else
      mvmt[1] += speed;
  }

  if (downKeys['E'.charCodeAt(0)]) {
    if (shift)
      rotate[2] -= rotateSpeed;
    else
      mvmt[1] -= speed;
  }

  if (downKeys[27]) { // escape
    mvmt = [0.0, 0.0, 0.0];
    camera.reset();
  }

  camera.axes();
  camera.move(mvmt, dt);
  camera.rotate(rotate, dt);
}

function updateSelection(dt) {
  if (selected !== null) {
    var speed = 1.0;
    var rotateSpeed = 1.0;
    var mvmt = [0.0, 0.0, 0.0];
    var rotate = [0.0, 0.0, 0.0];

    var shift = downKeys[16];

    if (downKeys['K'.charCodeAt(0)]) {
      if (shift)
        rotate[1] += rotateSpeed;
      else
        mvmt[0] += speed;
    }

    if (downKeys[186]) { // semicolon
      if (shift)
        rotate[1] -= rotateSpeed;
      else
        mvmt[0] -= speed;
    }

    if (downKeys['O'.charCodeAt(0)]) {
      if (shift)
        rotate[0] += rotateSpeed;
      else
        mvmt[2] += speed;
    }

    if (downKeys['L'.charCodeAt(0)]) {
      if (shift)
        rotate[0] -= rotateSpeed;
      else
        mvmt[2] -= speed;
    }

    if (downKeys['I'.charCodeAt(0)]) {
      if (shift)
        rotate[2] += rotateSpeed;
      else
        mvmt[1] += speed;
    }

    if (downKeys['P'.charCodeAt(0)]) {
      if (shift)
        rotate[2] -= rotateSpeed;
      else
        mvmt[1] -= speed;
    }

    if (downKeys[8]) { // backspace
      mvmt = [0.0, 0.0, 0.0];
      mat4.identity(selected.transform);
      selected.center = vec4.clone(selected.origin);
    }

    camera.axes();
    var translate = camera.translation(mvmt, dt);
    mat4.multiply(selected.transform, translate, selected.transform);
    mat4.multiply(selected.center, translate, selected.center);
    var rotation = camera.rotation(rotate, selected.center, dt);
    mat4.multiply(selected.transform, rotation, selected.transform);

  }
}

function changeSelection(key) {
  if (key == UP) {
    if (selected != null && selectionState == "spheres") {
      spherePtr = (spherePtr + 1) % spheres.length;
    }
    selected = spheres[spherePtr];
    selectionState = "spheres";
  }

  if (key == DOWN) {
    if (selected != null && selectionState == "spheres") {
      spherePtr--;
      if (spherePtr < 0)
        spherePtr += spheres.length;
    }
    selected = spheres[spherePtr];
    selectionState = "spheres";
  }

  if (key == LEFT) {
    if (selected != null && selectionState == "triangles") {
      trianglePtr = (trianglePtr + 1) % triangles.length;
    }
    selected = triangles[trianglePtr];
    selectionState = "triangles";
  }

  if (key == RIGHT) {
    if (selected != null && selectionState == "triangles") {
      trianglePtr--;
      if (trianglePtr < 0)
        trianglePtr += triangles.length;
    }
    selected = triangles[trianglePtr];
    selectionState = "triangles";
  }

  if (key == SPACE) {
    selectionState = null;
    selected = null;
  }
}

function update(dt) {
  updateCamera(dt);
  updateSelection(dt);
}

window.addEventListener("keydown", function (event) {
    var prev = downKeys[event.keyCode];
    downKeys[event.keyCode] = true;
    if (!prev) {
      var keypress = new CustomEvent("mykeypress", {detail: event.keyCode});
      window.dispatchEvent(keypress);
    }
}, false);

window.addEventListener("keyup", function (event) {
    downKeys[event.keyCode] = false;
}, false);

window.addEventListener("mykeypress", function (event) {
  changeSelection(event.detail); 
}, false);
