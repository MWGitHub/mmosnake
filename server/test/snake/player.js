'use strict';
var assert = require('assert');
var Lab = require('lab');
var Player = require('../../src/snake/player');

var lab = exports.lab = Lab.script();
var describe = lab.describe;
var it = lab.it;

describe('player', function() {
    it('should compare head points', function(done) {
        var player = new Player(null);

        assert.equal(player.position.x, 0);
        assert.equal(player.position.y, 0);
        assert.ok(player.isSamePosition({x: 0, y: 0}));
        player.position.x = 1;
        assert.equal(player.isSamePosition({x: 0, y: 0}), false);
        assert.ok(player.isSamePosition({x: 1, y: 0}));

        done();
    });
});