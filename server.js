var sys = require('sys'),
    http = require('http'),
    crypto = require('crypto');
    io = require('socket.io'),
    server = http.createServer(),
    socket = io.listen(server),
    json = JSON.stringify,
    log = sys.puts,
    port = 9999;//process.env.PORT;

log (port);    
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
      request.email = crypto.createHash('md5').update(request.email).digest("hex");
      client.send(json(request));
    }
    
    request.id = client.sessionId
    socket.broadcast.send(json(request));
  });

  client.on('disconnect', function(){
    socket.broadcast.send(json({'id': client.sessionId, 'action': 'close'}));
  });
});