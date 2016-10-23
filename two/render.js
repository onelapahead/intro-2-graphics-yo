// read triangles in, load them into webgl buffers
function loadBuffers() {
    if (models != String.null) {
        var whichSetVert; // index of vertex in current triangle set
        var whichSetTri; // index of triangle in current triangle set
        var coordArray = []; // 1D array of vertex coords for WebGL
        var normArray = []; // 1D array of norm coords for WebGL
        var indexArray = []; // 1D array of vertex indices for WebGL
        var vtxBufferSize = 0; // the number of vertices in the vertex buffer
        var vtxToAdd = []; // vtx coords to add to the coord array
        var normToAdd = null;
        var indexOffset = vec3.create(); // the index offset for the current set
        var triToAdd = vec3.create(); // tri indices to add to the index array

        for (var whichSet=0; whichSet<models.length; whichSet++) {
            vec3.set(indexOffset,vtxBufferSize,vtxBufferSize,vtxBufferSize); // update vertex offset

            // set up the vertex coord array
            for (whichSetVert=0; whichSetVert<models[whichSet].vertices.length; whichSetVert++) {
                normToAdd = models[whichSet].normals[whichSetVert];
                vtxToAdd = models[whichSet].vertices[whichSetVert];
                coordArray.push(vtxToAdd[0],vtxToAdd[1],vtxToAdd[2]);
                normArray.push(normToAdd[0], normToAdd[1], normToAdd[2]);
            } // end for vertices in set
            
            // set up the triangle index array, adjusting indices across sets
            for (whichSetTri=0; whichSetTri<models[whichSet].triangles.length; whichSetTri++) {
                vec3.add(triToAdd,indexOffset,models[whichSet].triangles[whichSetTri]);
                indexArray.push(triToAdd[0],triToAdd[1],triToAdd[2]);
            } // end for triangles in set

            vtxBufferSize += models[whichSet].vertices.length; // total number of vertices
            triBufferSize += models[whichSet].triangles.length; // total number of tris
        } // end for each triangle set 
        triBufferSize *= 3; // now total number of indices

        // console.log("coordinates: "+coordArray.toString());
        // console.log("numverts: "+vtxBufferSize);
        // console.log("indices: "+indexArray.toString());
        // console.log("numindices: "+triBufferSize);
        
        // send the vertex coords to webGL
        vertexBuffer = gl.createBuffer(); // init empty vertex coord buffer
        gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffer); // activate that buffer
        gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(coordArray),gl.STATIC_DRAW); // coords to that buffer

        normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normArray), gl.STATIC_DRAW);

        // send the triangle indices to webGL
        triangleBuffer = gl.createBuffer(); // init empty triangle index buffer
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleBuffer); // activate that buffer
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indexArray),gl.STATIC_DRAW); // indices to that buffer
    } // end if triangles found
} // end load triangles

// render the loaded model
function render() {
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // clear frame/depth buffers

    camera.update();

    gl.uniform1i(numberOfLightsLoc, lights.length);

    for (var i = 0; i < lights.length; i++) {
      vec3.transformMat4(lights[i].positionView, lights[i].position, camera.view);
      gl.uniform3fv(lightsLocation[i], lights[i].positionView);
    }

    gl.uniformMatrix4fv(viewLocation, false, camera.view);
    gl.uniformMatrix4fv(normalLocation, false, camera.normal);
    gl.uniformMatrix4fv(viewProjectionLocation, false, camera.viewProjection);  // for mat4 or mat4 array

    var trianglePtr = 0;
    var material;
    for (var i = 0; i < models.length; i++) {
      if (models[i] !== selected)
        material = models[i].material;
      else
        material = Highlight;
      for (var j = 0; j < lights.length; j++) {

        var lightProduct = {};
        lightProduct.ambient = vec3.create();

        vec3.multiply(lightProduct.ambient, lights[j].ambient, material.ambient);

        lightProduct.diffuse = vec3.create();
        vec3.multiply(lightProduct.diffuse, lights[j].diffuse, material.diffuse);

        lightProduct.specular = vec3.create();
        vec3.multiply(lightProduct.specular, lights[j].specular, material.specular);

        lightProduct.shininess = material.shininess;

        gl.uniform3fv(lightProductsLocation[j].ambient, lightProduct.ambient);
        gl.uniform3fv(lightProductsLocation[j].diffuse, lightProduct.diffuse);
        gl.uniform3fv(lightProductsLocation[j].specular, lightProduct.specular);
        gl.uniform1f(lightProductsLocation[j].shininess, lightProduct.shininess);
      }

      gl.uniformMatrix4fv(transformLocation, false, models[i].transform);

      // vertex buffer: activate and feed into vertex shader
      gl.bindBuffer(gl.ARRAY_BUFFER,vertexBuffer); // activate
      gl.vertexAttribPointer(vertexPositionAttrib,3,gl.FLOAT,false,0,0); // feed

      gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
      gl.vertexAttribPointer(vertexNormalAttrib, 3, gl.FLOAT, false, 0, 0);

      // triangle buffer: activate and render
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,triangleBuffer); // activate
      gl.drawElements(gl.TRIANGLES,models[i].triangles.length * 3,gl.UNSIGNED_SHORT,trianglePtr * 2); // render
      trianglePtr += models[i].triangles.length * 3;
    }

} // end render triangles
