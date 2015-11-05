'use strict';

var _ = require('lodash');

var internals = {
    /**
     * Directional values.
     */
    cardinal: {
        N: 1,
        E: 2,
        S: 3,
        W: 4
    }
};

/**
 * Represents a 2D grid with directional support.
 * A zero signals an empty space.
 */
class Grid {
    /**
     * Creates the grid with values set to 0 unless edges are blocked.
     * @param {number} w the width of the grid.
     * @param {number} h the height of the grid.
     * @param {boolean=} areEdgesBlocked true to set edge tiles to blocked.
     * @param {number=} emptyIndex the index to use for an empty space, defaults to 0.
     * @param {number=} blockIndex the index to use for a blocked space, defaults to 1.
     */
    constructor(w, h, areEdgesBlocked, emptyIndex, blockIndex) {
        this._width = w;
        this._height = h;

        this._emptyIndex = emptyIndex || 0;
        this._blockIndex = blockIndex || 1;

        this._grid = [];

        for (var row = 0; row < w; row++) {
            var inner = [];
            for (var col = 0; col < h; col++) {
                if (areEdgesBlocked && (row === 0 || row === h - 1 || col === 0 || col === w - 1)) {
                    inner.push(this._blockIndex);
                } else {
                    inner.push(this._emptyIndex);
                }
            }
            this._grid.push(inner);
        }
    }

    /**
     * Checks if a given coordinate is out of bounds.
     * @param {number} x the x value.
     * @param {number} y the y value.
     * @returns {boolean}
     */
    isOutOfBounds(x, y) {
        return x < 0 || x >= this._width || y < 0 || y >= this._height;
    }

    /**
     * Retrieves all empty spaces.
     * @returns {Array.<number>} the index of every empty space.
     */
    getEmptySpaces() {
        var empty = [];
        for (var row = 0; row < this._grid.length; row++) {
            for (var col = 0; col < this._grid[row].length; col++) {
                if (this._grid[row][col] === 0) {
                    empty.push({x: col, y: row});
                }
            }
        }
        return empty;
    }

    /**
     * Retrieves a random empty space index.
     * @returns {null|{x: number, y: number}} the index of the empty space or null if none exists.
     */
    getRandomEmptySpace() {
        var empty = this.getEmptySpaces();
        if (empty.length === 0) return null;
        return _.sample(empty);
    }

    /**
     * Set the value at the index.
     * @param {number} x the x value.
     * @param {number} y the y value.
     * @param {number} value the value to set.
     */
    setGridValue(x, y, value) {
        var isOut = this.isOutOfBounds(x, y);
        if (isOut) {
            throw new Error('Out of bounds');
        }
        this._grid[y][x] = value;
    }

    /**
     * Retrieves a value at the index.
     * @param {number} x the x value.
     * @param {number} y the y value.
     * @returns {number} the value at the index.
     */
    getGridValue(x, y) {
        var isOut = this.isOutOfBounds(x, y);
        if (isOut) {
            throw new Error('Out of bounds');
        }
        return this._grid[y][x];
    }

    /**
     * Checks if a direction is inside the grid.
     * @param {number} x the x location to check from.
     * @param {number} y the y location to check from.
     * @param {number} direction the direction to check.
     * @returns {boolean} true if inside, false otherwise.
     */
    isDirectionInside(x, y, direction) {
        if (!_.includes(internals.cardinal, direction)) {
            throw new Error('Invalid direction');
        }

        var isInside = true;
        switch (direction) {
            case internals.cardinal.N:
                isInside = !this.isOutOfBounds(x, y - 1);
                break;
            case internals.cardinal.E:
                isInside = !this.isOutOfBounds(x + 1, y);
                break;
            case internals.cardinal.S:
                isInside = !this.isOutOfBounds(x, y + 1);
                break;
            case internals.cardinal.W:
                isInside = !this.isOutOfBounds(x - 1, y);
                break;
        }
        return isInside;
    }

    /**
     * Retrieves the coordinates in a direction.
     * @param {number} x the x location to retrieve from.
     * @param {number} y the y location to retrieve from.
     * @param {number} direction the direction to check in.
     * @returns {null|{x: number, y: number}} the coordinates in the given direction or null if outside.
     */
    getCoordinatesInDirection(x, y, direction) {
        if (!this.isDirectionInside(x, y, direction)) {
            return null;
        } else {
            var coords = {x: x, y: y};
            switch (direction) {
                case internals.cardinal.N:
                    coords.y -= 1;
                    break;
                case internals.cardinal.E:
                    coords.x += 1;
                    break;
                case internals.cardinal.S:
                    coords.y += 1;
                    break;
                case internals.cardinal.W:
                    coords.x -= 1;
                    break;
            }
            return coords;
        }
    }

    /**
     * Get the value in a direction.
     * @param {number} x the x location to retrieve from.
     * @param {number} y the y location to retrieve from.
     * @param {number} direction the direction to use.
     * @returns {null|number} the value in the direction or null if out of bounds.
     */
    getValueInDirection(x, y, direction) {
        var coords = this.getCoordinatesInDirection(x, y, direction);
        if (coords) {
            return this._grid[coords.y][coords.x];
        } else {
            return null;
        }
    }

    /**
     * Set the value in a direction.
     * @param {number} x the x location to set from.
     * @param {number} y the y location to set from.
     * @param {number} direction the direction to use.
     * @param {number} value the value to set.
     * @returns {boolean} true if set successfully, false if unable to set.
     */
    setValueInDirection(x, y, direction, value) {
        var coords = this.getCoordinatesInDirection(x, y, direction);
        if (coords) {
            this._grid[coords.y][coords.x] = value;
            return true;
        } else {
            return false;
        }
    }

    /**
     * Retrieves the subgrid bounds given a center coordinate.
     * @param {number} x the center x location.
     * @param {number} y the center y location.
     * @param {number} width the width of the sub grid.
     * @param {number} height the height of the sub grid.
     * @param {number} buffer the buffer to apply to all sides, must be positive.
     * @returns {{x1: number, y1: number, x2: number, y2: number}}
     */
    getSubgridBounds(x, y, width, height, buffer) {
        // Offset the index by the buffer amount
        var buff = buffer > 0 ? buffer : 0;

        // Add the buffer amount to the width and height
        var bufferWidth = width + buff * 2;
        var bufferHeight = height + buff * 2;

        // Check if left and right side is out of bounds and recenter
        var left = x - Math.floor(bufferWidth / 2);
        var right = x + Math.floor(bufferWidth / 2);
        if (left < 0) {
            x = 0;
        } else if (right >= this._width) {
            x = this._width - bufferWidth;
        } else {
            x = x - Math.floor(bufferWidth / 2);
        }
        // Check if top and bottom is out of bounds and recenter
        var top = y - Math.floor(bufferHeight / 2);
        var bottom = y + Math.floor(bufferHeight / 2);
        if (top < 0) {
            y = 0;
        } else if (bottom >= this._height) {
            y = this._height - bufferHeight;
        } else {
            y = y - Math.floor(bufferHeight / 2);
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
     * @param {number=} x the center x location.
     * @param {number=} y the center y location.
     * @param {number=} width the width of the grid to retrieve.
     * @param {number=} height the height of the grid to retrieve.
     * @param {number=} buffer the buffer amount on each side to add.
     * @returns {Array.<number>}
     */
    getGridArray(x, y, width, height, buffer) {
        var grid = [];
        var row, col;
        if (x != null && y != null && width != null && height != null) {
            var bounds = this.getSubgridBounds(x, y, width, height, buffer);

            // Create the sub grid
            for (row = bounds.y1; row < bounds.y2; row++) {
                var inner = [];
                for (col = bounds.x1; col < bounds.x2; col++) {
                    inner.push(this._grid[row][col]);
                }
                grid.push(inner);
            }
        } else {
            grid = [];
            for (row = 0; row < this._grid.length; row++) {
                grid.push([].concat(this._grid[row]));
            }
        }
        return grid;
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
     * Applies reduce to the grid in order from top left to bottom right.
     * @param {function(number, number)} fn the function to use.
     * @param {number=} initial the initial value.
     * @returns {number}
     */
    reduce(fn, initial) {
        var value = initial || 0;
        for (var row = 0; row < this._grid.length; row++) {
            for (var col = 0; col < this._grid[row].length; col++) {
                value = fn(value, this._grid[row][col]);
            }
        }
        return value;
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

Grid.Cardinal = Object.assign({}, internals.cardinal);

module.exports = Grid;