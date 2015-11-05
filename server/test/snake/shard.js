"use strict";
var assert = require('assert');
var Lab = require('lab');
var Shard = require('../../src/snake/shard');
var Socket = require('../fake-socket');
var Grid = require('../../src/snake/grid');

var lab = exports.lab = Lab.script();
var describe = lab.describe;
var it = lab.it;
var before = lab.before;
var after = lab.after;
var beforeEach = lab.beforeEach;
var afterEach = lab.afterEach;

describe('shard', function() {
    var defaultDimensions = 5;

    var defaultStart = {
        index: 6,
        direction: Grid.Cardinal.E,
        segments: [6, 6, 6],
        isAlive: true
    };

    it('should setup with the the starting amount of food', function(done) {
        var limit = 3;
        for (var i = 0; i < 10; i++) {
            var shard = new Shard(defaultDimensions, defaultDimensions);
            shard.foodLimit = limit;
            shard.setup();

            var serverSocket = new Socket();
            var clientSocket = new Socket();
            serverSocket.link(clientSocket);
            clientSocket.on('update', (data) => {
                var foodCount = 0;
                for (var j = 0; j < data.grid.length; j++) {
                    if (data.grid[j] === Grid.Keys.food) {
                        foodCount++;
                    }
                }
                assert.equal(data.players.length, 1);
                assert.equal(foodCount, limit);
            });

            shard.addSocket(serverSocket);
            shard.tick();
        }
        done();
    });

    it('should add and remove players on connect and disconnect', function(done) {
        var shard = new Shard(defaultDimensions, defaultDimensions);
        shard.setup();
        var serverSocket1 = new Socket();
        var serverSocket2 = new Socket();

        var clientSocket1 = new Socket();
        var clientSocket2 = new Socket();

        var ticks = 0;

        var updateListener = function(data) {
            assert.equal(data.players.length, 1);

            // Add second socket
            clientSocket1.removeListener('update', updateListener);
            serverSocket2.link(clientSocket2);
            shard.addSocket(serverSocket2, {
                index: 11,
                direction: Grid.Cardinal.E,
                segments: [11, 11, 11],
                isAlive: true
            });
            ticks++;
            shard.tick();
        };
        clientSocket1.on('update', updateListener);

        clientSocket2.on('update', (data) => {
            if (ticks === 2) {
                assert.equal(data.players.length, 2);
                // Remove the first socket
                clientSocket1.emit('disconnect');
                ticks++;
                shard.tick();
            } else if (ticks === 3) {
                assert.equal(data.players.length, 1);
                done();
            }
        });

        serverSocket1.link(clientSocket1);
        shard.addSocket(serverSocket1, defaultStart);
        ticks++;
        shard.tick();
    });

    it('should remove a player from the server side', function(done) {
        var shard = new Shard(defaultDimensions, defaultDimensions);
        shard.setup();
        var serverSocket = new Socket();
        var clientSocket = new Socket();

        clientSocket.on('update', (data) => {
            assert.equal(data.players.length, 1);
            assert.equal(data.players.length, shard.playerCount);

            shard.removePlayer(serverSocket.id);
            assert.equal(shard.playerCount, 0);

            done();
        });

        serverSocket.link(clientSocket);
        shard.addSocket(serverSocket, defaultStart);
        shard.tick();
    });

    it('should move and stretch from the start and remove all segments when dead', function(done) {
        var edgeBlockCount = 24;
        var countBlocks = function(grid) {
            var count = 0;
            for (var i = 0; i < grid.length; i++) {
                if (grid[i] === Grid.Keys.blocked || grid[i] === Grid.Keys.snake) {
                    count++;
                }
            }
            return count - edgeBlockCount;
        };

        var shard = new Shard(7, 7);
        shard.setup();
        var serverSocket = new Socket();
        var clientSocket = new Socket();
        var ticks = 0;

        clientSocket.on('start', (data) => {
            assert.equal(countBlocks(data.grid), 1, 'should take up 1 space at start');
        });

        clientSocket.on('update', (data) => {
            // On 5th tick the head should reach the end of the map
            if (ticks < 4) {
                assert.equal(countBlocks(data.grid), ticks + 1, 'should take up 1 (head) + 1 segment.length per tick');
                ticks++;
                shard.tick();
            } else if (ticks < 5) {
                ticks++;
                shard.tick();
            }
        });

        clientSocket.on('die', (data) => {
            assert.equal(ticks, 5);
            assert.equal(countBlocks(shard.getGridArray()), 0, 'should take no space on death');
            done();
        });

        var snake = {
            index: 8,
            direction: Grid.Cardinal.E,
            segments: [8, 8, 8],
            isAlive: true
        };

        serverSocket.link(clientSocket);
        shard.addSocket(serverSocket, snake);


        ticks++;
        shard.tick();
    });
});