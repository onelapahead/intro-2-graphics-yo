
// RESOURCE MANAGEMENT

(function () {

  function ResourceManager(options, base) {
    var self = dali.Object(base);
    self.setType('resourcemanager');

// TODO edit
    // used for loading images to be used as textures
    function loadTexture(obj, url) {
      return new Promise(function(resolve, reject) {
        obj.glTexture = gl.createTexture();
        obj.img = new Image();
        obj.img.crossOrigin = "anonymous";
        obj.img.onload = function () {
          console.log(url);
          // test if the image has a transparent pixel using imgData
          var canvas = document.createElement("canvas");
          var ctx = canvas.getContext("2d");

          canvas.width = obj.img.width;
          canvas.height = obj.img.height;

          ctx.drawImage(obj.img, 0, 0);
          var imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
          obj.isTranslucentTexture = false;
          for (var i = 0; i < imgData.length; i+=4) {
            if (imgData[i + 3] < 255) {
                obj.isTranslucentTexture = true;
                break;
            }
          }

          ctx.clearRect(0, 0, canvas.width, canvas.height);
          delete canvas;
          delete ctx;

          gl.bindTexture(gl.TEXTURE_2D, obj.glTexture);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, obj.img);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
          gl.generateMipmap(gl.TEXTURE_2D);
          gl.bindTexture(gl.TEXTURE_2D, null);

          resolve(true);
        };
        obj.img.onerror = function() {
            reject({ status: "Failed to load texture: " + url });
        }
        obj.img.src = url;
      });
    }


    return self;
  }

  ResourceManager.main = ResourceManager();

  window.dali.ResourceManager = ResourceManager;


}) ();

// good for loading json files
dali.loadResource = function(url) {
  return new Promise(function(resolve, reject) {
    var req = new XMLHttpRequest();
    req.open('GET', url);

    req.onload = function () {
        if (this.status == 200 && this.status < 300) {
            resolve(req.response);
        } else {
            reject({
                status: req.status,
                statusText: req.statusText
            });
        }
    };

    req.onerror = function() {
        reject({
            status: req.status,
            statusText: req.statusText
        });
    };
    req.send();
  });
};
