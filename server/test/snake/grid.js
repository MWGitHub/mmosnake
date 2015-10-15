"use strict";
var assert = require('assert');
var Lab = require('lab');
var Grid = require('../../src/snake/grid');

var lab = exports.lab = Lab.script();
var describe = lab.describe;
var it = lab.it;
var before = lab.before;
var after = lab.after;
var beforeEach = lab.beforeEach;
var afterEach = lab.afterEach;

describe('grid', function() {
    it('creates an instance with all values at zero', function(done) {
        var grid = new Grid(5, 5);
        assert.equal(grid.width, 5);

        var arr = grid.getGridArray();
        for (var i = 0; i < arr.length; i++) {
            assert.equal(arr[i], 0);
        }
        done();
    });

    it('retrieves empty spaces', function(done) {
        var grid = new Grid(2, 2);
        assert.equal(grid.getEmptySpaces().length, 4);

        grid.setGridValue(0, 1);
        assert.equal(grid.getEmptySpaces().length, 3);
        grid.setGridValue(1, 1);
        grid.setGridValue(2, 1);
        grid.setGridValue(3, 1);
        assert.equal(grid.getEmptySpaces().length, 0);

        done();
    });

    it('retrieves an empty random space', function(done) {
        var grid = new Grid(2, 2);
        assert.equal(grid.getRandomEmptySpace() >= 0, true);
        grid.setGridValue(0, 1);
        grid.setGridValue(1, 1);
        assert.equal(grid.getRandomEmptySpace() >= 0, true);
        grid.setGridValue(3, 1);
        assert.equal(grid.getRandomEmptySpace(), 2);
        grid.setGridValue(2, 1);
        assert.equal(grid.getRandomEmptySpace() < 0, true);

        // Check out of bounds
        assert.throws(()=>grid.setGridValue(20, 1));
        assert.throws(()=>grid.setGridValue(-20, 1));

        done();
    });

    it('sets and gets a value at an index', function(done) {
        var grid = new Grid(2, 2);
        assert.equal(grid.getGridValue(1), 0);
        grid.setGridValue(1, 1);
        assert.equal(grid.getGridValue(1), 1);

        // Check out of bounds
        assert.throws(()=>grid.getGridValue(4));
        assert.throws(()=>grid.getGridValue(-1));

        done();
    });

    it('gets the index in a direction', function(done) {
        var grid = new Grid(2, 2);
        assert.throws(()=>grid.getIndexInDirection(0, 1234567890));
        // Check the out of bounds indices first.
        assert.equal(grid.getIndexInDirection(0, Grid.Cardinal.N), -Grid.Cardinal.N);
        assert.equal(grid.getIndexInDirection(0, Grid.Cardinal.W), -Grid.Cardinal.W);
        assert.equal(grid.getIndexInDirection(3, Grid.Cardinal.S), -Grid.Cardinal.S);
        assert.equal(grid.getIndexInDirection(3, Grid.Cardinal.E), -Grid.Cardinal.E);
        // Check valid bounds.
        assert.equal(grid.getIndexInDirection(0, Grid.Cardinal.E), 1);
        assert.equal(grid.getIndexInDirection(0, Grid.Cardinal.S), 2);
        assert.equal(grid.getIndexInDirection(3, Grid.Cardinal.N), 1);
        assert.equal(grid.getIndexInDirection(3, Grid.Cardinal.W), 2);

        done();
    });

    it('sets and gets value in a direction', function(done) {
        var grid = new Grid(2, 2);
        // Check out of bounds first.
        assert.equal(grid.getValueInDirection(0, Grid.Cardinal.N), -Grid.Cardinal.N);
        assert.equal(grid.setValueInDirection(50, Grid.Cardinal.S, 0), false);

        // Set in directions and check if set.
        assert.equal(grid.getValueInDirection(0, Grid.Cardinal.E), 0);
        grid.setValueInDirection(0, Grid.Cardinal.E, 1);
        assert.equal(grid.getValueInDirection(0, Grid.Cardinal.E), 1);
        grid.setValueInDirection(0, Grid.Cardinal.S, 1);
        assert.equal(grid.getValueInDirection(0, Grid.Cardinal.S), 1);
        grid.setValueInDirection(1, Grid.Cardinal.W, 1);
        assert.equal(grid.getValueInDirection(1, Grid.Cardinal.W), 1);
        grid.setValueInDirection(1, Grid.Cardinal.S, 1);
        assert.equal(grid.getValueInDirection(1, Grid.Cardinal.S), 1);

        done();
    });

    it('blocks the edges', function(done) {
        var grid = new Grid(2, 2, true);
        var gridArray = grid.getGridArray();
        for (var i = 0; i < gridArray.length; i++) {
            assert.equal(gridArray[i], Grid.Keys.blocked);
        }

        grid = new Grid(3, 3, true);
        gridArray = grid.getGridArray();
        for (var i = 0; i < gridArray.length; i++) {
            if (i === 4) {
                assert.equal(gridArray[i], Grid.Keys.empty);
            } else {
                assert.equal(gridArray[i], Grid.Keys.blocked);
            }
        }

        done();
    });
});