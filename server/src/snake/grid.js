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
        N: 0,
        E: 1,
        S: 2,
        W: 3
    }
};

/**
 * Represents a 2D grid.
 */
class Grid {
    constructor(w, h) {
        this._width = w;
        this._height = h;

        this._grid = [];

        for (var i = 0; i < w * h; i++) {
            this._grid.push(0);
        }
    }

    coordToIndex(x, y) {
        return x + y * this._width;
    }

    getEmptySpaces() {
        var empty = [];
        for (var i = 0; i < this._grid.length; i++) {
            if (this._grid[i] === 0) {
                empty.push(i);
            }
        }
        return empty;
    }

    getRandomEmptySpace() {
        return _.sample(this.getEmptySpaces());
    }

    setGridValue(index, value) {
        this._grid[index] = value;
    }

    getIndexInDirection(index, direction) {
        if (direction > 3 || direction < 0) {
            throw new Error('Invalid direction');
        }

        var test;
        var out = 0;
        switch (direction) {
            case internals.cardinal.N:
                test = index - this._width;
                out = test < 0 ? -internals.cardinal.N : this._grid[test];
                break;
            case internals.cardinal.E:
                test = index + 1;
                out = index % this._width === this._width - 1 ? -internals.cardinal.E : this._grid[test];
                break;
            case internals.cardinal.S:
                test = index + this._width;
                out = test >= this._grid.length ? -internals.cardinal.S : this._grid[test];
                break;
            case internals.cardinal.W:
                test = index - 1;
                out = index % this._width === 0 ? -internals.cardinal.W : this._grid[test];
                break;
        }

        return out;
    }
}

Grid.Keys = Object.assign({}, internals.keys);
Grid.Cardinal = Object.assign({}, internals.cardinal);

module.exports = Grid;