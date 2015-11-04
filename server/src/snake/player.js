'use strict';

/**
 * Represents a player.
 */
class Player {
    /**
     * Initializes the player.
     * @param socket the socket created for the player.
     */
    constructor(socket) {
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