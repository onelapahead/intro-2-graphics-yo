var stat = require('node-static');
 
var fileServer = new stat.Server();
var port = process.argv[2] || 3000;
require('http').createServer(function (request, response) {
    request.addListener('end', function () {
        fileServer.serve(request, response);
    }).resume();
}).listen(port, function() {
  console.log("listening on port " + port);
});
