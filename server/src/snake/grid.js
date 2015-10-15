"use strict";

var _ = require('lodash');

var internals = {
    /**
     * Keys for the grid.
     */
    keys: {
        'empty': 0,
        'blocked': 1,
        'food': 2
    },

    /**
     * Directional values, a negative direction signals going out of the grid in that direction.
     */
    cardinal: {
        N: 1,
        E: 2,
        S: 3,
        W: 4
    }
};

/**
 * Represents a 2D grid.
 */
class Grid {
    /**
     * Creates the grid with values set to 0 unless edges are blocked.
     * @param {number} w the width of the grid.
     * @param {number} h the height of the grid.
     * @param {boolean=} areEdgesBlocked true to set edge tiles to blocked.
     */
    constructor(w, h, areEdgesBlocked) {
        this._width = w;
        this._height = h;

        this._grid = [];

        for (var i = 0; i < w * h; i++) {
            var value = 0;
            if (areEdgesBlocked) {
                if (Math.floor(i / w) === 0 || Math.floor(i / w) === h - 1 ||
                    i % w === 0 || i % w === w - 1) {
                    value = internals.keys.blocked;
                }
            }
            this._grid.push(value);
        }
    }

    /**
     * Retrieves all empty spaces.
     * @returns {Array.<number>} the index of every empty space.
     */
    getEmptySpaces() {
        var empty = [];
        for (var i = 0; i < this._grid.length; i++) {
            if (this._grid[i] === 0) {
                empty.push(i);
            }
        }
        return empty;
    }

    /**
     * Retrieves a random empty space index.
     * @returns {number} the index of the empty space or -1 if none exists.
     */
    getRandomEmptySpace() {
        var empty = this.getEmptySpaces();
        if (empty.length === 0) return -1;
        return _.sample(empty);
    }

    /**
     * Set the value at the index.
     * @param {number} index the index to set for.
     * @param {number} value the value to set.
     */
    setGridValue(index, value) {
        if (index < 0 || index >= this._grid.length) {
            throw new Error('Out of bounds');
        }
        this._grid[index] = value;
    }

    /**
     * Retrieves a value at the index.
     * @param {number} index the index to get from.
     * @returns {number} the value at the index.
     */
    getGridValue(index) {
        if (index < 0 || index >= this._grid.length) {
            throw new Error('Out of bounds');
        }
        return this._grid[index];
    }

    /**
     * Retrieves the index in a direction.
     * @param {number} index the index to start at.
     * @param {number} direction the direction to check.
     * @returns {number} the index or -direction if out of bounds.
     */
    getIndexInDirection(index, direction) {
        if (direction > 4 || direction < 1) {
            throw new Error('Invalid direction');
        }

        var out = 0;
        switch (direction) {
            case internals.cardinal.N:
                out = index - this._width;
                if (out < 0) {
                    out = -internals.cardinal.N;
                }
                break;
            case internals.cardinal.E:
                out = index + 1;
                if (out >= this._grid.length || out % this._width === 0) {
                    out = -internals.cardinal.E;
                }
                break;
            case internals.cardinal.S:
                out = index + this._width;
                if (out > this._grid.length) {
                    out = -internals.cardinal.S;
                }
                break;
            case internals.cardinal.W:
                out = index - 1;
                if (out < 0 || out % this._width === this._width - 1) {
                    out = -internals.cardinal.W;
                }
                break;
        }
        return out;
    }

    /**
     * Get the value in a direction.
     * @param {number} index the index to check from.
     * @param {number} direction the direction to check.
     * @returns {number} the value in the direction or negative direction if out of bounds.
     */
    getValueInDirection(index, direction) {
        var directionIndex = this.getIndexInDirection(index, direction);
        return directionIndex < 0 ? directionIndex : this._grid[directionIndex];
    }

    /**
     * Set the value in a direction.
     * @param {number} index the index to set from.
     * @param {number} direction the direction set.
     * @param {number} value the value to set.
     * @returns {boolean} true if set successfully, false if unable to set.
     */
    setValueInDirection(index, direction, value) {
        var directionIndex = this.getIndexInDirection(index, direction);
        if (directionIndex < 0) return false;
        this._grid[directionIndex] = value;
        return true;
    }

    /**
     * Get a copy of the grid.
     * @param {number=} index the centered index to retrieve from.
     * @param {number=} width the width of the grid to retrieve.
     * @param {number=} height the height of the grid to retrieve.
     * @returns {Array.<number>}
     */
    getGridArray(index, width, height) {
        if (index !== undefined && width !== undefined && height !== undefined) {
            var out = [];
            var x = 0;
            var y = 0;
            // Check if left and right side is out of bounds and recenter
            var left = index % this._width  - Math.floor(width / 2);
            var right = index % this._width + Math.floor(width / 2);
            if (left < 0) {
                x = 0;
            } else if (right >= this._width) {
                x = this._width - width;
            } else {
                x = index % this._width - Math.floor(width / 2);
            }
            // Check if top and bottom is out of bounds and recenter
            var top = Math.floor(index / this._width) - Math.floor(height / 2);
            var bottom = Math.floor(index / this._width) + Math.floor(height / 2);
            if (top < 0) {
                y = 0;
            } else if (bottom >= this._height) {
                y = this._height - height;
            } else {
                y = Math.floor(index / this._width) - Math.floor(height / 2);
            }

            // Create the sub grid
            for (var row = y; row < y + height; row++) {
               for (var col = x; col < x + width; col++) {
                   out.push(this._grid[row * this._width + col]);
               }
            }
            return out;
        } else {
            return [].concat(this._grid);
        }
    }

    /**
     * Retrieve the width of the grid.
     * @returns {number}
     */
    get width() {
        return this._width;
    }

    /**
     * Retrieve the height of the grid.
     * @returns {number}
     */
    get height() {
        return this._height;
    }
}

Grid.Keys = Object.assign({}, internals.keys);
Grid.Cardinal = Object.assign({}, internals.cardinal);

module.exports = Grid;