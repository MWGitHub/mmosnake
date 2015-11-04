'use strict';

var Server = require('./src/server');
var config = require('./config.json');

var port = process.env.PORT || config.port;
var server = new Server(port);
server.start().then(function(server) {
    console.log('Server started');
}).catch(function(e) {
    console.log('Server failed to start');
    console.log(e);
});