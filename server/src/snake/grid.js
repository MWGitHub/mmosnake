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
     * Creates the grid with values set to 0.
     * @param {number} w the width of the grid.
     * @param {number} h the height of the grid.
     */
    constructor(w, h) {
        this._width = w;
        this._height = h;

        this._grid = [];

        for (var i = 0; i < w * h; i++) {
            this._grid.push(0);
        }
    }

    /**
     * Retrieves all empty spaces.
     * @returns {number[]} the index of every empty space.
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
     */
    setValueInDirection(index, direction, value) {
        var isValid = this.getValueInDirection(index, direction) !== internals.keys.blocked;
        if (!isValid) return;

        switch (direction) {
            case internals.cardinal.N:
                this._grid[index - this._width] = value;
                break;
            case internals.cardinal.E:
                this._grid[index + 1] = value;
                break;
            case internals.cardinal.S:
                this._grid[index + this._width] = value;
                break;
            case internals.cardinal.W:
                this._grid[index - 1] = value;
                break;
        }
    }

    getGridCopy() {
        return [].concat(this._grid);
    }
}

Grid.Keys = Object.assign({}, internals.keys);
Grid.Cardinal = Object.assign({}, internals.cardinal);

module.exports = Grid;