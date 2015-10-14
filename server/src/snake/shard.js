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
    if (empty > 0) {
        grid.setGridValue(empty, Grid.Keys.food);
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
        // Create the initial food
        for (var i = 0; i < this.foodLimit; i++) {
            internal.createFood(this._grid);
        }
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
        // Move every snake in the shard
        _.forEach(this._players, (player) => {
            var snake = player.snake;
            if (snake.isAlive) {
                this._move(player, snake.index, snake.direction);
            }
        });

        // Update the grid of every player
        var gridArray = this._grid.getGrid();
        _.forEach(this._players, (player) => {
            if (player.snake.isAlive) {
                player.socket.emit('update', {
                    grid: gridArray,
                    snake: player.snake
                });
            }
        });
    }

    /**
     * Move in the given direction.
     * @param {*} player the player that is moving.
     * @param {number} index the index to move from.
     * @param {number} direction the direction to move.
     */
    _move(player, index, direction) {
        var grid = this._grid;
        var snake = player.snake;

        // Check the value of the next move index
        var value = grid.getValueInDirection(index, direction);
        if (value === Grid.Keys.empty || value === Grid.Keys.food) {
            var newHead = grid.getIndexInDirection(index, direction);
            snake.segments.unshift(snake.index);
            snake.index = newHead;
            if (value !== Grid.Keys.food) {
                snake.segments.pop();
            }
            grid.setValueInDirection(index, direction, Grid.Keys.blocked);
        } else if (value === Grid.Keys.blocked) {
            this._die(player);
        }
    };

    /**
     * Remove the player's snake and set them as dead.
     * @param player
     * @private
     */
    _die(player) {
        for (var i = 0; i < player.snake.segments.length; i++) {
            this._grid.setGridValue(player.snake.segments[i], Grid.Keys.empty);
        }
        player.snake.isAlive = false;
        player.socket.emit('dead');
    }

    /**
     * Starts the player and adds them to the game.
     * @param player
     * @private
     */
    _start(player) {
        var start = internal.getStart(this._grid);
        this._grid.setGridValue(start.index, 1);
        player.snake = {
            index: start.index,
            direction: start.direction,
            segments: [start.index, start.index, start.index],
            isAlive: true
        };
        player.socket.emit('start', player.snake);
    }

    /**
     * Ejects a player from the game.
     * @param player
     * @private
     */
    _eject(player) {
        this._die(player);
        removeSocket(player.socket.id);
    }

    /**
     * Set the direction of the player.
     * @param player
     * @param {number} direction the direction to set to.
     */
    _direct(player, direction) {
        if (!_.includes(direction)) {
            this._eject(player);
        } else {
            player.snake.direction = direction;
        }
    }

    addSocket(socket) {
        var player = {
            socket: socket
        };
        this._players[socket.id] = player;

        socket.on('error', () => {
            this.removeSocket(socket.id);
            Logger.info('Socket connection error');
        });

        socket.on('disconnect', () => {
            this.removeSocket(socket.id);
            Logger.info('User disconnected');
        });

        socket.on('restart', () => {
            this._start(player);
        });

        socket.on('direct', (data) => {
            this._direct(player, data.direction);
        });

        this._start(this._players[socket.id]);
    }

    removeSocket(id) {
        delete this._players[id];
    }
}

module.exports = Shard;