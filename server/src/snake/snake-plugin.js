"use strict";
var socketIO = require('socket.io');
var Logger = require('../util/logger');
var SnakeShard = require('./shard');

var snake = {
    register: function(server, options, next) {
        var io = socketIO(server.listener, {
            serveClient: false
        });

        // Create a single shard instance for now
        var shard = new SnakeShard();
        io.on('connection', function(socket) {
            shard.addSocket(socket);
            Logger.info('New connection');
        });

        shard.start();

        next();
    }
};
snake.register.attributes = {
    name: 'snake'
};

module.exports = snake;