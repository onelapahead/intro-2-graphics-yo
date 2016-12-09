
// RESOURCE MANAGEMENT

(function () {

  var resources = {};
  window.dali.resources = resources;

  var hiddenCanvas = document.createElement("canvas");
  var ctx = hiddenCanvas.getContext("2d");

  function isImgTranslucent(img) {
    ctx.clearRect(0, 0, hiddenCanvas.width, hiddenCanvas.height);
    hiddenCanvas.width = img.width;
    hiddenCanvas.height = img.height;

    ctx.drawImage(img, 0, 0);
    var imgData = ctx.getImageData(0, 0, hiddenCanvas.width, hiddenCanvas.height).data;
    var out = false;
    for (var i = 0; i < imgData.length; i+=4) {
      if (imgData[i + 3] < 255) {
          out = true;
          break;
      }
    }
    ctx.clearRect(0, 0, hiddenCanvas.width, hiddenCanvas.height);     
    return out;
  }

  resources.ResourceManager = function (options, base) {
    var self = dali.Object(base);
    self.setType('resourcemanager');

    var _resources = window.dali.ObjectManager('resource');
    var plaintexts = new Map();
    var promises = [];

    self.addResource = function(resource) {
      _resources.add(resource);
    };

    self.addPromise = function(promise) {
      promises.push(promise);
    };

    self.loadResources = function() {
      return Promise.all(promises);
    };

    self.getResource = function(url) {
      return _resources.getObj(url);
    };

    return self;
  }

  resources.ResourceManager.main = resources.ResourceManager();

  resources.Resource = function(_url, base, _manager) {
    var self = dali.Object(base);
    self.setType('resource');

    if (_url == null || !window.dali.isString(_url))
      throw 'Invalid resource URL: ' + _url;
    self.dGUID = _url;

    var manager = _manager;
    if (manager == null || !window.dali.isDaliObj(manager) || !manager.isType('resourcemanager'))
      manager = resources.ResourceManager.main;

    var promise = self.createPromise(manager);
    manager.addPromise(promise);
    return self;
  };

  resources.Image = function(url, base) {
    base = base || {};
    var img;
    base.createPromise = function(manager) {
      return new Promise(function(resolve, reject) {
        img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = function() {
          isTranslucent = isImgTranslucent(img);
          manager.addResource(base);
          resolve();
        };

        img.onerror = function(err) {
          reject({ status: "Failed to load img: " + url, error: err });
        };

        img.src = url;
      });
    };
    var self = resources.Resource(url, base);
    self.setType('image');

    self.getImg = function() { return img; };

    return self;
  };

  resources.PlainText = function(url, base) {
    base = base || {};
    var text;
    base.createPromise = function(manager) {
      return new Promise(function(resolve, reject) {
          var req = new XMLHttpRequest();
          req.open('GET', url);

          req.onload = function () {
              if (this.status == 200 && this.status < 300) {
                  text = req.response;
                  manager.addResource(base);
                  console.log(text);
                  resolve();
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
    var self = resources.Resource(url, base);
    self.setType('plaintext');

    self.getText = function () { return text; };

    return self;
  };

  resources.load = function(options) {
    if (options != null) {
      if (options.img != null && window.dali.isArray(options.img)) {
        for (var i = 0; i < options.img.length; i++) {
          console.log(options.img[i]);
          resources.Image(options.img[i]);
        }
      }

      if (options.text != null && window.dali.isArray(options.text)) {
        for (var i = 0; i < options.text.length; i++) {
          resources.PlainText(options.text[i]);
        }
      }
    }
    return resources.ResourceManager.main.loadResources();
  };

}) ();
