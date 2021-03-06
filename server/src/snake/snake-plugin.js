'use strict';
var socketIO = require('socket.io');
var Logger = require('../util/logger');
var SnakeShard = require('./shard');

var snake = {
    register: function(server, options, next) {
        var io = socketIO(server.listener, {
            serveClient: true
        });

        var width = options.gridWidth || 20;
        var height = options.gridHeight || 20;
        var screenWidth = options.screenWidth || 20;
        var screenHeight = options.screenHeight || 20;
        var screenBuffer = options.screenBuffer || 0;
        var leniency = options.leniency || 0;
        var food = options.food || 3;
        var tickRate = options.tickRate || 6;
        var grace = options.grace || 2;

        // Create a single shard instance for now
        var shard = new SnakeShard(width, height, screenWidth, screenHeight, screenBuffer, leniency);
        shard.foodLimit = food;
        shard.tickRate = tickRate;
        shard.grace = grace;

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