"use strict";
var socketIO = require('socket.io');
var Logger = require('../util/logger');
var SnakeShard = require('./shard');

var snake = {
    register: function(server, options, next) {
        var io = socketIO(server.listener, {
            serveClient: false
        });

        var width = options.gridWidth || 20;
        var height = options.gridHeight || 20;
        var screenWidth = options.screenWidth || 20;
        var screenHeight = options.screenHeight || 20;
        var food = options.food || 3;

        // Create a single shard instance for now
        var shard = new SnakeShard(width, height, screenWidth, screenHeight);
        shard.foodLimit = food;
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