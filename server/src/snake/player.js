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
         * Position of the snake head.
         * @type {{x: number, y: number}}
         */
        this.position = {
            x: 0,
            y: 0
        };

        /**
         * Direction the snake is facing.
         * @type {number}
         */
        this.direction = 0;

        /**
         * Segments of the player.
         * @type {Array.<{x: number, y: number}>}
         */
        this.segments = [];

        /**
         * Flag for if the player is alive.
         * @type {boolean}
         */
        this.isAlive = true;

        /**
         * Counter for the grace amount.
         * @type {number}
         */
        this.graceCounter = 0;
    }

    /**
     * Checks if a value is in the same position as the snake head.
     * @param {{x: number, y: number}} v the coordinate to check.
     * @returns {boolean} true if in the same position.
     */
    isSamePosition(v) {
        if (!v) return false;
        return this.position.x === v.x && this.position.y === v.y;
    }

    get socket() {
        return this._socket;
    }
}

module.exports = Player;