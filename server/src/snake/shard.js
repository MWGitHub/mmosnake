"use strict";
var _ = require('lodash');
var Grid = require('./grid');
var Logger = require('../util/logger');

var internal = {};

/**
 * Get a random starting position.
 * @param {Grid} grid the grid to find the starting conditions with.
 * @returns {{index: *, direction: string}}
 */
internal.getStart = function(grid) {
    return {
        index: grid.getRandomEmptySpace(),
        direction: Grid.Cardinal.E
    };
};

/**
 * Create food at a random spot.
 * @param {Grid} grid the grid to create the food on.
 */
internal.createFood = function(grid) {
    var empty = grid.getRandomEmptySpace();
    grid.setGridValue(empty, Grid.Keys.food);
};

/**
 * Move in the given direction.
 * @param {*} player the player that is moving.
 * @param {Grid} grid the grid to move in.
 * @param {number} index the index to move from.
 * @param {number} direction the direction to move.
 */
internal.move = function(player, grid, index, direction) {
    var value = grid.getValueInDirection(index, direction);
    console.log(value);
    var snake = player.snake;
    if (value === Grid.Keys.empty || value === Grid.Keys.food) {
        var newHead = grid.getIndexInDirection(index, direction);
        snake.segments.push(snake.index);
        snake.index = newHead;
        snake.segments.shift();
        grid.setValueInDirection(index, direction, Grid.Keys.blocked);
    } else if (value === Grid.Keys.blocked) {
        player.socket.emit('dead');
    }
};

class Shard {
    constructor() {
        /**
         * Number of food available at any given time.
         * @type {number}
         */
        this.foodLimit = 3;

        /**
         * Players stored by socket key.
         * @type {Object<String, {}>}
         * @private
         */
        this._players = {};

        /**
         * Number of ticks per second.
         * @type {number}
         * @private
         */
        this._tickRate = 3;

        /**
         * Grid of the shard play area.
         * @type {Grid}
         * @private
         */
        this._grid = new Grid(20, 20);
    }

    /**
     * Start the shard.
     */
    start() {
        this._interval = setInterval(this._update.bind(this), 1000 / this._tickRate);
    }

    /**
     * Stops the shard.
     */
    stop() {
        clearInterval(this._interval);
    }

    /**
     * Updates the movement of the snakes.
     * @private
     */
    _update() {
        _.forEach(this._players, (player) => {
            var snake = player.snake;
            internal.move(player, this._grid, snake.index, snake.direction);
        });

        var simpleGrid = this._grid.getGridCopy();
        _.forEach(this._players, (player) => {
            player.socket.emit('update', {
                grid: simpleGrid,
                snake: player.snake
            });
        });
    }

    addSocket(socket) {
        this._players[socket.id] = {
            socket: socket
        };

        socket.on('error', (data) => {
            this.removeSocket(socket.id);
            Logger.info('Socket connection error');
        });

        socket.on('disconnect', (data) => {
            this.removeSocket(socket.id);
            Logger.info('User disconnected');
        });

        var start = internal.getStart(this._grid);
        this._grid.setGridValue(start.index, 1);
        this._players[socket.id].snake = {
            index: start.index,
            direction: start.direction,
            segments: [start.index, start.index, start.index]
        };
        socket.emit('start', this._players[socket.id].snake);
    }

    removeSocket(id) {

        delete this._players[id];
    }
}

module.exports = Shard;