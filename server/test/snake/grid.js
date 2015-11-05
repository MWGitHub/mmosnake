'use strict';
var assert = require('assert');
var Lab = require('lab');
var Grid = require('../../src/snake/grid');

var lab = exports.lab = Lab.script();
var describe = lab.describe;
var it = lab.it;

describe('grid', function() {
    function getBlockCount(array) {
        var count = 0;
        for (var i = 0; i < array.length; i++) {
            for (var j = 0; j < array[i].length; j++) {
                if (array[i][j] === 1) {
                    count++;
                }
            }
        }
        return count;
    }

    it('should reduce properly', function(done) {
        var grid = new Grid(3, 3);

        assert.equal(grid.reduce((s, v) => {
            if (v === 0) {
                return s + 1;
            } else {
                return s;
            }
        }), 9);

        assert.equal(grid.reduce((s, v) => {
            if (v === 0) {
                return s;
            } else {
                return s + 1;
            }
        }, 10), 10);

        done();
    });

    it('creates an instance with all values at zero', function(done) {
        var grid = new Grid(5, 5);
        assert.equal(grid.width, 5);
        assert.equal(grid.height, 5);

        assert.equal(grid.reduce((s, v) => {
            return s + v;
        }), 0);

        done();
    });

    it('retrieves empty spaces', function(done) {
        var grid = new Grid(2, 2);
        assert.equal(grid.getEmptySpaces().length, 4);

        grid.setGridValue(0, 0, 1);
        assert.equal(grid.getEmptySpaces().length, 3);
        grid.setGridValue(1, 0, 1);
        grid.setGridValue(0, 1, 1);
        grid.setGridValue(1 ,1, 1);
        assert.equal(grid.getEmptySpaces().length, 0);

        done();
    });

    it('retrieves an empty random space', function(done) {
        var grid = new Grid(2, 2);
        assert.equal(grid.getRandomEmptySpace().x >= 0, true);
        grid.setGridValue(0, 0, 1);
        grid.setGridValue(1, 0, 1);
        assert.equal(grid.getRandomEmptySpace().y >= 0, true);
        grid.setGridValue(1, 1, 1);
        assert.equal(grid.getRandomEmptySpace().x, 0);
        grid.setGridValue(0, 1, 1);
        assert.equal(grid.getRandomEmptySpace(), null);

        // Check out of bounds
        assert.throws(()=>grid.setGridValue(20, 1, 1));
        assert.throws(()=>grid.setGridValue(-20, 1, 1));

        done();
    });

    it('sets and gets a value at an index', function(done) {
        var grid = new Grid(2, 2);
        assert.equal(grid.getGridValue(1, 0), 0);
        grid.setGridValue(1, 0, 1);
        grid.setGridValue(0, 1, 1);
        assert.equal(grid.getGridValue(1, 0), 1);


        // Check out of bounds
        assert.throws(()=>grid.getGridValue(4, 1));
        assert.throws(()=>grid.getGridValue(-1, 0));

        done();
    });

    it('get if direction from coords is valid', function(done) {
        var grid = new Grid(2, 2);
        // Invalid direction given
        assert.throws(()=>grid.isDirectionInside(0, 0, 1234567890));
        // Check the out of bounds indices first.
        assert.equal(grid.isDirectionInside(0, 0, Grid.Cardinal.N), false);
        assert.equal(grid.isDirectionInside(0, 0, Grid.Cardinal.W), false);
        assert.equal(grid.isDirectionInside(1, 1, Grid.Cardinal.S), false);
        assert.equal(grid.isDirectionInside(1, 1, Grid.Cardinal.E), false);
        // Check valid bounds.
        assert.equal(grid.isDirectionInside(0, 0, Grid.Cardinal.E), true);
        assert.equal(grid.isDirectionInside(0, 0, Grid.Cardinal.S), true);
        assert.equal(grid.isDirectionInside(1, 1, Grid.Cardinal.N), true);
        assert.equal(grid.isDirectionInside(1, 1, Grid.Cardinal.W), true);

        done();
    });

    it('sets and gets value in a direction', function(done) {
        var grid = new Grid(2, 2);
        // Check out of bounds first.
        assert.equal(grid.getValueInDirection(0, 0, Grid.Cardinal.N), null);
        assert.equal(grid.setValueInDirection(50, 0, Grid.Cardinal.S, 0), false);

        // Set in directions and check if set.
        assert.equal(grid.getValueInDirection(0, 0, Grid.Cardinal.E), 0);
        grid.setValueInDirection(0, 0, Grid.Cardinal.E, 1);
        assert.equal(grid.getValueInDirection(0, 0, Grid.Cardinal.E), 1);
        grid.setValueInDirection(0, 0, Grid.Cardinal.S, 1);
        assert.equal(grid.getValueInDirection(0, 0, Grid.Cardinal.S), 1);
        grid.setValueInDirection(1, 0, Grid.Cardinal.W, 1);
        assert.equal(grid.getValueInDirection(1, 0, Grid.Cardinal.W), 1);
        grid.setValueInDirection(1, 0, Grid.Cardinal.S, 1);
        assert.equal(grid.getValueInDirection(1, 0, Grid.Cardinal.S), 1);

        done();
    });

    it('blocks the edges', function(done) {
        var grid = new Grid(2, 2, true);
        var gridArray = grid.getGridArray();
        for (var i = 0; i < gridArray.length; i++) {
            for (var j = 0; j < gridArray[i].length; j++) {
                assert.equal(gridArray[i][j], 1);
            }
        }

        grid = new Grid(3, 3, true);
        gridArray = grid.getGridArray();
        for (i = 0; i < gridArray.length; i++) {
            for (j = 0; j < gridArray[i].length; j++) {
                if (i === 1 && j === 1) {
                    assert.equal(gridArray[i][j], 0);
                } else {
                    assert.equal(gridArray[i][j], 1);
                }
            }
        }

        done();
    });

    it('merges grids together', function(done) {
        var grid = new Grid(2, 2);
        grid.setGridValue(0, 0, 1);
        var grid2 = new Grid(2, 2);
        grid.setGridValue(1, 1, 1);
        var merged = grid.merge(grid2);
        assert.equal(merged.getGridValue(0, 0), 1);
        assert.equal(merged.getGridValue(0, 1), 0);
        assert.equal(merged.getGridValue(1, 0), 0);
        assert.equal(merged.getGridValue(1, 1), 1);
        assert.equal(getBlockCount(merged.getGridArray()), 2);

        done();
    });

    it('retrieves a segment of the grid', function(done) {
        // 1 1 1 1 1
        // 1 0 0 0 1
        // 1 0 0 0 1
        // 1 0 0 0 1
        // 1 1 1 1 1
        var grid = new Grid(5, 5, true);
        var full = grid.getGridArray();
        assert.equal(getBlockCount(full), 16, 'should contain all blocked');
        full = grid.getGridArray(null, undefined, undefined, 0);
        assert.equal(getBlockCount(full), 16, 'should contain all blocked');
        full = grid.getGridArray(0, undefined, null, 63281782936);
        assert.equal(getBlockCount(full), 16, 'should contain all blocked');

        var sub = grid.getGridArray(1, 1, 3, 3);
        assert.equal(getBlockCount(sub), 5, 'should contain only 3x3 from top left');

        sub = grid.getGridArray(2, 1, 3, 3);
        assert.equal(getBlockCount(sub), 3, 'should contain one right from last');

        sub = grid.getGridArray(3, 1, 3, 3);
        assert.equal(getBlockCount(sub), 5);

        sub = grid.getGridArray(4, 1, 3, 3);
        assert.equal(getBlockCount(sub), 5);

        sub = grid.getGridArray(0, 0, 3, 3);
        assert.equal(getBlockCount(sub), 5);

        sub = grid.getGridArray(0, 4, 3, 3);
        assert.equal(getBlockCount(sub), 5);

        sub = grid.getGridArray(4, 4, 3, 3);
        assert.equal(getBlockCount(sub), 5);

        // Get sub grid with buffers
        // 1 1 1 1 1
        // 1 0 0 0 1
        // 1 0 0 0 1
        // 1 0 0 0 1
        // 1 1 1 1 1
        sub = grid.getGridArray(0, 0, 3, 3, 1);
        assert.equal(getBlockCount(sub), 16, 'should get full grid due to no edge checks');

        sub = grid.getGridArray(0, 0, 1, 1, 1);
        assert.equal(getBlockCount(sub), 5);

        sub = grid.getGridArray(2, 0, 1, 1, 1);
        assert.equal(getBlockCount(sub), 3);

        sub = grid.getGridArray(2, 0, 1, 1, 2);
        assert.equal(getBlockCount(sub), 16);

        sub = grid.getGridArray(0, 0, 3, 3, -1);
        assert.equal(getBlockCount(sub), 5);

        sub = grid.getGridArray(2, 2, 3, 3, 0);
        assert.equal(getBlockCount(sub), 0);

        sub = grid.getGridArray(2, 2, 3, 3, 1);
        assert.equal(getBlockCount(sub), 16);

        done();
    });
});