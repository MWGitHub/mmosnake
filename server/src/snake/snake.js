"use strict";
var socketIO = require('socket.io');
var logger = require('../util/logger');

var snake = {
    register: function(server, options, next) {
        var io = socketIO(server.listener);
        io.on('connection', function(socket) {
            logger.info('New connection');
        });

        next();
    }
};
snake.register.attributes = {
    name: 'snake'
};

module.exports = snake;