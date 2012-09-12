var libpath = require('path'),
    http = require("http"),
    fs = require('fs'),
    url = require("url"),
    mime = require('mime'),
    json = JSON.stringify,
    io = require('socket.io');

var path = ".";
var port = 9998;//process.env.PORT;

var server = http.createServer(function (request, response) {
	
    var uri = url.parse(request.url).pathname;
    var filename = libpath.join(path, uri);

    libpath.exists(filename, function (exists) {
        if (!exists) {
            response.writeHead(404, {
                "Content-Type": "text/plain"
            });
            response.write("404 Not Found\n");
            response.end();
            return;
        }

        if (fs.statSync(filename).isDirectory()) {
            filename += '/index.html';
        }

        fs.readFile(filename, "binary", function (err, file) {
            if (err) {
                response.writeHead(500, {
                    "Content-Type": "text/plain"
                });
                response.write(err + "\n");
                response.end();
                return;
            }

            var type = mime.lookup(filename);
            response.writeHead(200, {
                "Content-Type": type
            });
            response.write(file, "binary");
            response.end();
        });
    });
});
var socket = io.listen(server);
server.listen(port);
socket.on('connection', function(client){
  client.on('message', function(message){
    try {
      request = JSON.parse(message.replace('<', '&lt;').replace('>', '&gt;'));
    } catch (SyntaxError) {
      log('Invalid JSON:');
      log(message);
      return false;
    }

    if(request.action != 'close' && request.action != 'move' && request.action != 'speak') {
      log('Ivalid request:' + "\n" + message);
      return false;
    }

    if(request.action == 'speak') {
      //request.email = crypto.createHash('md5').update(request.email).digest("hex");
      client.send(json(request));
    }
    
    request.id = client.sessionId
    client.broadcast.send(json(request));
  });

  client.on('disconnect', function(){
    client.broadcast.send(json({'id': client.sessionId, 'action': 'close'}));
  });
});