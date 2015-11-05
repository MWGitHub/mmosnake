'use strict';

var _ = require('lodash');

var internals = {
    /**
     * Number representing a coordinate outside the grid.
     */
    outside: Number.MIN_SAFE_INTEGER,

    /**
     * Keys for the grid.
     */
    keys: {
        empty: 0,
        blocked: 1,
        food: 2,
        snake: 3
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
            // Generate edges if needed
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
     * Retrieves the index at the given coordinates.
     * @param {Number} x the x location.
     * @param {Number} y the y location.
     * @returns {Number} the index or the outside number if outside the grid.
     */
    getIndexAtCoordinates(x, y) {
        if (x < 0 || x >= this._width || y < 0 || y >= this._height) {
            return internals.outside;
        }
        return y * this._width + x;
    }

    /**
     * Retrieves the coordinates given an index.
     * @param {Number} index the index.
     * @returns {Number|{x: Number, y: Number}} the x and y coordinates or outside number.
     */
    getCoordinatesAtIndex(index) {
        if (index < 0 || index >= this._width * this._height) {
            return internals.outside;
        }
        return {
            x: index % this._width,
            y: Math.floor(index / this._width)
        };
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
     * Retrieves the subgrid bounds given a center index.
     * @param {number} index the index to center the bounds at.
     * @param {number} width the width of the sub grid.
     * @param {number} height the height of the sub grid.
     * @param {number} buffer the buffer to apply to all sides, must be positive.
     * @returns {{x1: number, y1: number, x2: number, y2: number}}
     */
    getSubgridBounds(index, width, height, buffer) {
        // Offset the index by the buffer amount
        var buff = buffer > 0 ? buffer : 0;

        // Add the buffer amount to the width and height
        var bufferWidth = width + buff * 2;
        var bufferHeight = height + buff * 2;

        var x = 0;
        var y = 0;
        // Check if left and right side is out of bounds and recenter
        var left = index % this._width - Math.floor(bufferWidth / 2);
        var right = index % this._width + Math.floor(bufferWidth / 2);
        if (left < 0) {
            x = 0;
        } else if (right >= this._width) {
            x = this._width - bufferWidth;
        } else {
            x = index % this._width - Math.floor(bufferWidth / 2);
        }
        // Check if top and bottom is out of bounds and recenter
        var top = Math.floor(index / this._width) - Math.floor(bufferHeight / 2);
        var bottom = Math.floor(index / this._width) + Math.floor(bufferHeight / 2);
        if (top < 0) {
            y = 0;
        } else if (bottom >= this._height) {
            y = this._height - bufferHeight;
        } else {
            y = Math.floor(index / this._width) - Math.floor(bufferHeight / 2);
        }

        return {
            x1: x,
            y1: y,
            x2: x + bufferWidth,
            y2: y + bufferHeight
        };
    }

    /**
     * Get a copy of the grid.
     * @param {number=} index the centered index to retrieve from.
     * @param {number=} width the width of the grid to retrieve.
     * @param {number=} height the height of the grid to retrieve.
     * @param {number=} buffer the buffer amount on each side to add.
     * @returns {Array.<number>}
     */
    getGridArray(index, width, height, buffer) {
        if (index != null && width != null && height != null) {
            var bounds = this.getSubgridBounds(index, width, height, buffer);

            // Create the sub grid
            var out = [];
            for (var row = bounds.y1; row < bounds.y2; row++) {
                for (var col = bounds.x1; col < bounds.x2; col++) {
                    out.push(this._grid[row * this._width + col]);
                }
            }
            return out;
        } else {
            return [].concat(this._grid);
        }
    }

    /**
     * Merges the given array and this grid into a new grid.
     * @param {Array.<number>} array the array to merge.
     * @returns {Grid} a new grid with this and an array merged.
     */
    merge(array) {
        var newGrid = new Grid(this.width, this.height, false);
        for (var i = 0; i < array.length; i++) {
            if (array[i] !== 0) {
                newGrid._grid[i] = array[i];
            }
        }
        return newGrid;
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
Grid.Outside = internals.outside;

module.exports = Grid;