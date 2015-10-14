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

class Shard {
    constructor() {
        /**
         * Number of food available at any given time.
         * @type {number}
         */
        this.foodLimit = 3;

        /**
         * Sockets stored by key.
         * @type {Object<String, {}>}
         * @private
         */
        this._sockets = {};

        /**
         * Number of ticks per second.
         * @type {number}
         * @private
         */
        this._tickRate = 4;

        /**
         * Grid of the shard play area.
         * @type {Grid}
         * @private
         */
        this._grid = new Grid(20, 20);

        /**
         * Snakes with the socket ID as the key.
         * @type {Object<String, *>}
         * @private
         */
        this._snakes = {};
    }

    start() {
        this._interval = setInterval(this.update.bind(this), 1000 / this._tickRate);

    }

    stop() {
        clearInterval(this._interval);
    }

    update() {

    }

    addSocket(socket) {
        this._sockets[socket.id] = {
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
        this._snakes[socket.id] = {
            index: start.index,
            direction: start.direction,
            segments: [start.index, start.index, start.index]
        };
        socket.emit('start', this._snakes[socket.id]);
    }

    removeSocket(id) {
        delete this._snakes[id];
        delete this._sockets[id];
    }
}

module.exports = Shard;