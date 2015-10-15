"use strict";
var _ = require('lodash');
var Grid = require('./grid');
var Logger = require('../util/logger');

var internals = {
    commands: {
        start: 'start',
        die: 'die',
        update: 'update',
        direct: 'direct',
        restart: 'restart'
    }
};

/**
 * Get a random starting position.
 * @param {Grid} grid the grid to find the starting conditions with.
 * @returns {{index: *, direction: string}}
 */
internals.getStart = function(grid) {
    return {
        index: grid.getRandomEmptySpace(),
        direction: Grid.Cardinal.E
    };
};

/**
 * Create food at a random spot.
 * @param {Grid} grid the grid to create the food on.
 * @returns {boolean} true if food created successfully.
 */
internals.createFood = function(grid) {
    var empty = grid.getRandomEmptySpace();
    if (empty >= 0) {
        grid.setGridValue(empty, Grid.Keys.food);
        return true;
    }

    return false;
};

class Shard {
    /**
     * Create the shard with the given width and height.
     * @param {number} width the width to give the shard.
     * @param {number} height the height to give the shard.
     * @param {number=} screenWidth the width of a game screen, defaults to width.
     * @param {number=} screenHeight the height of a game screen, defaults to height.
     */
    constructor(width, height, screenWidth, screenHeight) {
        /**
         * Number of food available at any given time.
         * @type {number}
         */
        this.foodLimit = 3;

        /**
         * Width of the game screen.
         * @type {number}
         * @private
         */
        this._screenWidth = screenWidth || width;

        /**
         * Height of the game screen.
         * @type {number}
         * @private
         */
        this._screenHeight = screenHeight || height;

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
        this._tickRate = 6;

        /**
         * Grid of the shard play area.
         * @type {Grid}
         * @private
         */
        this._grid = new Grid(width, height, true);

        /**
         * Number of food on the board.
         * @type {number}
         * @private
         */
        this._food = 0;
    }

    /**
     * Set up the playing field.
     */
    setup() {
        // Create the initial food
        for (var i = 0; i < this.foodLimit; i++) {
            var created = internals.createFood(this._grid);
            if (created) {
                this._food++;
            }
        }
    }

    /**
     * Start the shard.
     */
    start() {
        this._interval = setInterval(this._update.bind(this), 1000 / this._tickRate);
    }

    tick() {
        this._update();
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

        // Regenerate food that was eaten or blocked
        var diff = this.foodLimit - this._food;
        for (var i = 0; i < diff; i++) {
            var created = internals.createFood(this._grid);
            if (created) {
                this._food++;
            }
        }

        // Update the grid of every player
        var players = this.playerCount;
        _.forEach(this._players, (player) => {
            if (player.snake.isAlive) {
                var grid = this._grid.getGridArray(player.snake.index, this._screenWidth, this._screenHeight);
                player.socket.emit(internals.commands.update, {
                    players: players,
                    grid: grid,
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
        if (value < 0 || value === Grid.Keys.blocked) {
            this._die(player);
        } else if (value === Grid.Keys.empty || value === Grid.Keys.food) {
            // Add the previous head position to the front of the segment array
            snake.segments.unshift(snake.index);

            // Get the value of the new head position
            snake.index = grid.getIndexInDirection(index, direction);
            // Remove the tail if no food has been eaten
            if (value !== Grid.Keys.food) {
                var removed = snake.segments.pop();
                // Do not empty if any segments are in the tail index
                var anyLeft = snake.segments.indexOf(removed) >= 0;
                if (!anyLeft) {
                    grid.setGridValue(removed, Grid.Keys.empty);
                }
            } else {
                this._food -= 1;
            }
            // Make the current head position an occupied space
            grid.setValueInDirection(index, direction, Grid.Keys.blocked);
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
        this._grid.setGridValue(player.snake.index, Grid.Keys.empty);
        player.snake.isAlive = false;
        player.socket.emit(internals.commands.die, {
            score: player.snake.segments.length
        });
    }

    /**
     * Starts the player and adds them to the game.
     * @param player the player to start.
     * @param {*=} snake an optional snake object to start as.
     * @private
     */
    _start(player, snake) {
        if (snake) {
            player.snake = {
                index: snake.index,
                direction: snake.direction,
                segments: [].concat(snake.segments),
                isAlive: snake.isAlive
            };
            this._grid.setGridValue(snake.index, Grid.Keys.blocked);
        } else {
            var start = internals.getStart(this._grid);
            player.snake = {
                index: start.index,
                direction: start.direction,
                segments: [start.index, start.index, start.index],
                isAlive: true
            };
            this._grid.setGridValue(start.index, Grid.Keys.blocked);
        }

        player.socket.emit(internals.commands.start, {
            grid: this.getGridArray(player.snake.index, this._screenWidth, this._screenHeight),
            players: this.playerCount,
            width: this._grid.width,
            snake: player.snake
        });
    }

    /**
     * Checks if the directions given are the opposite.
     * @param {*} player the player to check.
     * @param {number} d1 the first direction.
     * @param {number} d2 the second direction.
     * @returns {boolean} true if the directions are opposite.
     */
    _isOppositeDirection(player, d1, d2) {
        // Check if trying to move into the previous segment (happens when moving too fast)
        var next = this._grid.getIndexInDirection(player.snake.index, d1);
        if (player.snake.segments.length > 0 && player.snake.segments[0] === next) {
            return true;
        }
        // Check if trying to move backwards
        return (d1 === Grid.Cardinal.N && d2 === Grid.Cardinal.S ||
        d1 === Grid.Cardinal.S && d2 === Grid.Cardinal.N ||
        d1 === Grid.Cardinal.E && d2 === Grid.Cardinal.W ||
        d1 === Grid.Cardinal.W && d2 === Grid.Cardinal.E);
    }

    /**
     * Set the direction of the player.
     * @param player
     * @param {number} direction the direction to set to.
     */
    _direct(player, direction) {
        // Remove the player if an invalid direction is given
        if (!_.includes(Grid.Cardinal, direction)) {
            this.removePlayer(player);
        } else {
            // Ignore if moving backwards
            if (this._isOppositeDirection(player, direction, player.snake.direction)) {
                return;
            }
            player.snake.direction = direction;
        }
    }

    /**
     * Adds a socket with an optional snake object to start as.
     * @param socket the socket to add.
     * @param {*=} snake the snake to start as.
     */
    addSocket(socket, snake) {
        var player = {
            socket: socket
        };
        this._players[socket.id] = player;

        socket.on('error', () => {
            this.removePlayer(socket.id);
            Logger.info('Socket connection error');
        });

        socket.on('disconnect', () => {
            this.removePlayer(socket.id);
            Logger.info('User disconnected');
        });

        socket.on(internals.commands.restart, () => {
            this._start(player);
        });

        socket.on(internals.commands.direct, (data) => {
            this._direct(player, data.direction);
        });

        this._start(this._players[socket.id], snake);
    }

    removePlayer(id) {
        var player = this._players[id];
        if (player) {
            this._die(player);
        }
        delete this._players[id];
    }

    get playerCount() {
        return Object.keys(this._players).length;
    }

    getGridArray() {
        return this._grid.getGridArray();
    }
}

module.exports = Shard;