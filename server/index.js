"use strict";

var Server = require('./src/server');

var port = 5000;
var server = new Server(port);
server.start().then(function(server) {

}).catch(function(e) {
    console.log('Server failed to start');
    console.log(e);
});