'use strict';
var _ = require('lodash');
var Grid = require('./grid');
var Logger = require('../util/logger');
var Player = require('./player');

var internals = {
    keys: {
        empty: 0,
        block: 1,
        food: 2,
        snake: 3
    },

    commands: {
        start: 'start',
        die: 'die',
        update: 'update',
        ate: 'ate'
    },

    receives: {
        direct: 'direct',
        ping: 'ping'
    }
};

/**
 * Get a random starting position.
 * @param {Grid} grid the grid to find the starting conditions with.
 * @returns {{x: number, y: number, direction: string}}
 */
internals.getStart = function(grid) {
    var coords = grid.getRandomEmptySpace();
    if (!coords) {
        coords.x = 0;
        coords.y = 0;
    }
    return {
        x: coords.x,
        y: coords.y,
        direction: Grid.Cardinal.E
    };
};

/**
 * Create food at a random spot.
 * @param {Grid} grid the grid to create the food in.
 * @param {Grid} blockers the grid to use to get the empty space from.
 * @returns {boolean} true if food created successfully.
 */
internals.createFood = function(grid, blockers) {
    var empty = blockers.getRandomEmptySpace();
    if (empty) {
        grid.setGridValue(empty.x, empty.y, internals.keys.food);
        return true;
    }

    return false;
};

/**
 * Creates a grid with blocking objects.
 * @param {number} width the width of the grid.
 * @param {number} height the height of the grid.
 * @param players the players to set blocking areas.
 */
internals.createBlockersGrid = function(width, height, players) {
    var grid = new Grid(width, height);
    for (var key in players) {
        if (!players.hasOwnProperty(key)) continue;
        var player = players[key];

        grid.setGridValue(player.position.x, player.position.y, internals.keys.snake);
        for (var i = 0; i < player.segments.length; i++) {
            grid.setGridValue(player.segments[i].x, player.segments[i].y, internals.keys.snake);
        }
    }
    return grid;
};

class Shard {
    /**
     * Create the shard with the given width and height.
     * @param {number} width the width to give the shard.
     * @param {number} height the height to give the shard.
     * @param {number=} screenWidth the width of a game screen, defaults to width.
     * @param {number=} screenHeight the height of a game screen, defaults to height.
     * @param {number=} screenBuffer the buffer for the sides of the screen.
     * @param {number=} leniency the number of ticks allowed to be out of sync.
     */
    constructor(width, height, screenWidth, screenHeight, screenBuffer, leniency) {
        /**
         * Number of food available at any given time.
         * @type {number}
         */
        this.foodLimit = 3;

        /**
         * Number of ticks per second.
         * @type {number}
         */
        this.tickRate = 6;

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
         * Buffer to add to the sides of the screen.
         * @type {number}
         * @private
         */
        this._screenBuffer = screenBuffer || 0;

        /**
         * Number of ticks before a player's data becomes flagged for out of sync.
         * @type {number}
         * @private
         */
        this._leniency = leniency || 0;

        /**
         * Players stored by socket key.
         * @type {Object<String, Player>}
         * @private
         */
        this._players = {};

        /**
         * Grid of the shard play area.
         * @type {Grid}
         * @private
         */
        this._grid = new Grid(width, height, true);

        /**
         * Current server tick.
         * @type {number}
         * @private
         */
        this._tick = 0;
    }

    /**
     * Set up the playing field.
     */
    setup() {
        // Create the initial food
        var blockers = internals.createBlockersGrid(this._grid.width, this._grid.height, this._players);
        for (var i = 0; i < this.foodLimit; i++) {
            internals.createFood(this._grid, this._grid.merge(blockers));
        }
    }

    /**
     * Start the shard.
     */
    start() {
        this._interval = setInterval(this._update.bind(this), 1000 / this.tickRate);
    }

    /**
     * Manually step through an update.
     */
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
     * Create the player update info to send to the client.
     * @param {Player} player the player to create the info for.
     * @param {boolean} isForced true to overwrite the client's player.
     * @returns {*} the player update info.
     * @private
     */
    _createPlayerInfo(player, isForced) {
        var subgridBounds = this._grid.getSubgridBounds(player.position.x, player.position.y,
            this._screenWidth, this._screenHeight, this._screenBuffer);
        var grid = this._grid.getGridArray(player.position.x, player.position.y,
            this._screenWidth, this._screenHeight, this._screenBuffer);

        var players = [];
        _.forEach(this._players, (player) => {
            if (player.isAlive) {
                players.push({
                    id: player.id,
                    position: player.position,
                    segments: player.segments,
                    isAlive: player.isAlive,
                    direction: player.direction
                });
            }
        });

        return {
            id: player.id,
            position: player.position,
            segments: player.segments,
            isAlive: player.isAlive,
            direction: player.direction,

            players: players,
            grid: grid,
            width: this._grid.width,
            height: this._grid.height,
            tick: this._tick,
            subgridBounds: subgridBounds,
            isForced: isForced
        };
    }

    /**
     * Updates a player.
     * @param {Player} player the player to update.
     * @param {boolean} isForced true to overwrite the client's player.
     * @private
     */
    _updatePlayer(player, isForced) {
        if (player.isAlive) {
            if (isForced) {
                player.lastUpdateTick = this._tick;
            }
            player.socket.emit(internals.commands.update, this._createPlayerInfo(player, isForced));
        }
    }

    /**
     * Remove the player's snake and set them as dead.
     * @param {Player} player the player to set as dead.
     * @private
     */
    _die(player) {
        player.isAlive = false;
        player.socket.emit(internals.commands.die, {
            score: player.segments.length
        });
    }

    /**
     * Move the player in the given direction.
     * @param {Player} player the player that is moving.
     */
    _move(player) {
        var grid = this._grid;

        var currentPosition = player.position;
        var direction = player.direction;
        // Get the position the player will move in
        var nextPosition = grid.getCoordinatesInDirection(currentPosition.x, currentPosition.y, direction);

        // Check if any snakes hit
        var hitSnake = false;
        for (var key in this._players) {
            if (!this._players.hasOwnProperty(key) || this._players[key].id === player.id) continue;
            var snake = this._players[key];
            if (snake.isSamePosition(nextPosition)) {
                hitSnake = true;
                break;
            }
            for (var i = 0; i < snake.segments.length; i++) {
                if (nextPosition.x === snake.segments[i].x && nextPosition.y === snake.segments[i].y) {
                    hitSnake = true;
                    break;
                }
            }
            if (hitSnake) break;
        }

        // Die if the walls or other snakes are hit when moved
        var nextValue = grid.getValueInDirection(currentPosition.x, currentPosition.y, direction);
        if (nextValue === null || nextValue === internals.keys.block || hitSnake) {
            this._die(player);
        } else if (nextValue === internals.keys.empty || nextValue === internals.keys.food) {
            // Add the previous head position to the front of the segment array
            player.segments.unshift({x: currentPosition.x, y: currentPosition.y});

            // Get the value of the new head position
            player.position.x = nextPosition.x;
            player.position.y = nextPosition.y;
            // Remove the tail if no food has been eaten
            if (nextValue !== internals.keys.food) {
                player.segments.pop();
            } else {
                // Remove the food from the grid
                this._grid.setGridValue(nextPosition.x, nextPosition.y, internals.keys.empty);
                // Update the player so the client knows food has been eaten
                player.socket.emit(internals.commands.ate, this._createPlayerInfo(player, true));
            }
        }
    }

    /**
     * Updates the movement of the snakes.
     * @private
     */
    _update() {
        this._tick++;

        // Move every snake in the shard
        _.forEach(this._players, (player) => {
            if (player.isAlive) {
                this._move(player);
            }
        });

        // Regenerate food that was eaten or blocked
        var diff = this.foodLimit - this.foodCount;
        var blockers = internals.createBlockersGrid(this._grid.width, this._grid.height, this._players);
        for (var i = 0; i < diff; i++) {
            internals.createFood(this._grid, this._grid.merge(blockers));
        }

        // Update the grid of every player
        _.forEach(this._players, (player) => {
            this._updatePlayer(player, false);
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
        // Check if trying to move into the previous segment (happens when multiple times between ticks)
        var next = this._grid.getIndexInDirection(player.index, d1);
        if (player.segments.length > 0 && player.segments[0] === next) {
            return true;
        }
        // Check if trying to move backwards
        return (d1 === Grid.Cardinal.N && d2 === Grid.Cardinal.S ||
        d1 === Grid.Cardinal.S && d2 === Grid.Cardinal.N ||
        d1 === Grid.Cardinal.E && d2 === Grid.Cardinal.W ||
        d1 === Grid.Cardinal.W && d2 === Grid.Cardinal.E);
    }

    /**
     * Updates the player's info if valid.
     * @param {Player} player the player to direct.
     * @param {number} tick the last tick the player received.
     * @param {number} index the index of the player's head.
     * @param {Array.<number>} segments the segments of the player.
     * @param {number} direction the direction to set to.
     */
    _direct(player, tick, index, segments, direction) {
        // Remove the player if an invalid direction is given
        if (!_.includes(Grid.Cardinal, direction)) {
            console.log('invalid');
            this.removePlayer(player);
        } else if (player.index === index) {
            // Only change directions if the player has not moved
            console.log('direction changed');
            player.direction = direction;
        } else {
            // Check if player position differs too much from the server position
            var serverCoords = this._grid.getCoordinatesAtIndex(player.index);
            var clientCoords = this._grid.getCoordinatesAtIndex(index);
            var distance = Math.pow(serverCoords.x - clientCoords.x, 2) + Math.pow(serverCoords.y - clientCoords.y, 2);
            var isOutOfSync = this._tick - tick > this._leniency;
            var isTooFar = distance > this._leniency * this._leniency;
            if (isOutOfSync || isTooFar) {
                if (isOutOfSync) {
                    console.log('oos');
                } else if (isTooFar) {
                    console.log('too far');
                }
                // Ignore new direction if moving backwards
                if (!this._isOppositeDirection(player, direction, player.direction)) {
                    player.direction = direction;
                }
                player.socket.emit(internals.commands.update, this._createPlayerInfo(player, true));
            } else {
                player.direction = direction;

                console.log('moved');
                // Only update if the player has moved
                player.lastUpdateTick = tick;
                player.index = index;
                player.segments = segments;
            }
        }
    }

    /**
     * Starts the player and adds them to the game.
     * @param {Player} player the player to start.
     * @param {*=} snake an optional snake object to start as.
     * @private
     */
    _start(player, snake) {
        // Set the starting positions and segments for the snake
        if (snake) {
            player.position.x = snake.position.x;
            player.position.y = snake.position.y;
            player.direction = snake.direction;
            player.segments = [].concat(snake.segments);
            player.isAlive = snake.isAlive;
        } else {
            // Retrieve an empty starting position
            var blockers = internals.createBlockersGrid(this._grid.width, this._grid.height, this._players);
            var start = internals.getStart(this._grid.merge(blockers));
            player.position.x = start.x;
            player.position.y = start.y;
            player.direction = start.direction;
            player.segments = [{x: start.x, y: start.y}, {x: start.x, y: start.y}, {x: start.x, y: start.y}];
            player.isAlive = true;
        }
        player.lastUpdateTick = this._tick;

        player.socket.emit(internals.commands.start, this._createPlayerInfo(player, true));
    }

    /**
     * Adds a socket with an optional snake object to start as.
     * @param socket the socket to add.
     * @param {*=} snake the snake to start as, otherwise create new.
     */
    addSocket(socket, snake) {
        var player = new Player(socket);
        this._players[socket.id] = player;

        socket.on('error', () => {
            this.removePlayer(socket.id);
            Logger.info('Socket connection error');
        });

        socket.on('disconnect', () => {
            this.removePlayer(socket.id);
            Logger.info('User disconnected');
        });

        socket.on(internals.receives.direct, (data) => {
            this._direct(player, data.tick, data.index, data.segments, data.direction);
        });

        this._start(player, snake);
    }

    removePlayer(id) {
        var player = this._players[id];
        if (player) {
            this._die(player);
        }
        delete this._players[id];
    }

    /**
     * Retrieves the number of players in the shard.
     * @returns {Number}
     */
    get playerCount() {
        return Object.keys(this._players).length;
    }

    /**
     * Retrieves the number of food in the shard.
     * @returns {number}
     */
    get foodCount() {
        return this._grid.reduce((s, v) => {
            if (v === internals.keys.food) {
                return s + 1;
            } else {
                return s;
            }
        });
    }

    /**
     * Retrieves the grid array of the shard.
     * @returns {Array.<number>}
     */
    getGridArray() {
        return this._grid.getGridArray();
    }
}

module.exports = Shard;