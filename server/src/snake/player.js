'use strict';

/**
 * ID counter for players.
 * @type {number}
 */
var uid = 0;

/**
 * Represents a player.
 */
class Player {
    /**
     * Initializes the player.
     * @param socket the socket created for the player.
     */
    constructor(socket) {
        uid++;

        /**
         * Unique ID for the player.
         * @type {number}
         */
        this.id = uid;

        /**
         * Socket used for the player.
         */
        this._socket = socket;

        /**
         * Tick the player last took an action on.
         * @type {number}
         */
        this.lastUpdateTick = 0;

        /**
         * Position of the snake on the grid.
         * @type {number}
         */
        this.index = 0;

        /**
         * Direction the snake is facing.
         * @type {number}
         */
        this.direction = 0;

        /**
         * Segments of the player.
         * @type {Array}
         */
        this.segments = [];

        /**
         * Flag for if the player is alive.
         * @type {boolean}
         */
        this.isAlive = true;
    }

    get socket() {
        return this._socket;
    }
}

module.exports = Player;