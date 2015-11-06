'use strict';
var assert = require('assert');
var Lab = require('lab');
var Shard = require('../../src/snake/shard');
var Socket = require('../fake-socket');
var Grid = require('../../src/snake/grid');
var Player = require('../../src/snake/player');

var lab = exports.lab = Lab.script();
var describe = lab.describe;
var it = lab.it;

describe('shard', function() {
    var defaultDimensions = 5;

    var defaultStart = {
        position: {x: 1, y: 1},
        direction: Grid.Cardinal.E,
        segments: [{x: 1, y: 1}, {x: 1, y: 1}, {x: 1, y: 1}],
        isAlive: true
    };

    it('should set up with the starting amount of food', function(done) {
        for (var i = 0; i < 30; i++) {
            var shard = new Shard(defaultDimensions, defaultDimensions);
            shard.foodLimit = 3;
            shard.setup();
            assert.equal(shard.foodCount, 3);
        }

        done();
    });

    it('should not spawn players on the food', function(done) {
        var limit = 3;
        for (var i = 0; i < 30; i++) {
            const shard = new Shard(defaultDimensions, defaultDimensions);
            shard.foodLimit = limit;
            shard.setup();

            var serverSocket = new Socket();
            var clientSocket = new Socket();
            serverSocket.link(clientSocket);
            clientSocket.on('update', (data) => {
                assert.equal(data.players.length, 1);
                assert.equal(shard.foodCount, limit);
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
                position: {
                    x: 1,
                    y: 2
                },
                direction: Grid.Cardinal.E,
                segments: [{x: 1, y: 2}, {x: 1, y: 2}, {x: 1, y: 2}],
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

    it('should kill player when running into a wall', function(done) {
        var shard = new Shard(defaultDimensions, defaultDimensions);
        shard.setup();
        var serverSocket = new Socket();
        var clientSocket = new Socket();

        var ticks = 0;
        clientSocket.on('update', function() {
            ticks++;
            if (ticks <= 3 + shard.grace) {
                shard.tick();
            }
        });
        clientSocket.on('die', function() {
            assert.equal(ticks, 3 + shard.grace);
            done();
        });

        serverSocket.link(clientSocket);
        shard.addSocket(serverSocket, defaultStart);
        ticks++;
        shard.tick();
    });

    it('should kill player when running into a wall without grace', function(done) {
        var shard = new Shard(defaultDimensions, defaultDimensions);
        shard.grace = 0;
        shard.setup();
        var serverSocket = new Socket();
        var clientSocket = new Socket();

        var ticks = 0;
        clientSocket.on('update', function() {
            ticks++;
            if (ticks <= 3) {
                shard.tick();
            }
        });
        clientSocket.on('die', function() {
            assert.equal(ticks, 3);
            done();
        });

        serverSocket.link(clientSocket);
        shard.addSocket(serverSocket, defaultStart);
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
        var countSnakeSpots = function(gridArray, position, segments, players) {
            var grid = new Grid(7, 7, true);
            // Populate grid
            for (var row = 0; row < grid.length; row++) {
                for (var col = 0; col < grid[row].length; col++) {
                    grid.setGridValue(col, row, gridArray[row][col]);
                }
            }

            // Put current player on grid
            var i, segment;
            var playerGrid = new Grid(7, 7);
            playerGrid.setGridValue(position.x, position.y, 1);
            for (i = 0; i < segments.length; i++) {
                segment = segments[i];
                playerGrid.setGridValue(segment.x, segment.y, 1);
            }
            // Put players on grid
            for (i = 0; i < players.length; i++) {
                var player = players[i];
                playerGrid.setGridValue(player.position.x, player.position.y, 1);
                for (var j = 0; j < player.segments.length; j++) {
                    segment = player.segments[j];
                    playerGrid.setGridValue(segment.x, segment.y, 1);
                }
            }
            var merged = grid.merge(playerGrid);
            var blocks = merged.reduce(function(s, v) {
                if (v !== 0) {
                    return s + 1;
                } else {
                    return s;
                }
            });
            return blocks - edgeBlockCount;
        };

        var shard = new Shard(7, 7);
        shard.grace = 0;
        shard.setup();
        var serverSocket = new Socket();
        var clientSocket = new Socket();
        var ticks = 0;

        clientSocket.on('start', (data) => {
            assert.equal(countSnakeSpots(data.grid, data.position, data.segments, data.players), 1, 'should take up 1 space at start');
        });

        clientSocket.on('update', (data) => {
            // On 5th tick the head should reach the end of the map
            if (ticks < 4) {
                assert.equal(countSnakeSpots(data.grid, data.position, data.segments, data.players), ticks + 1, 'should take up 1 (head) + 1 segment.length per tick');
                ticks++;
                shard.tick();
            } else if (ticks < 5) {
                ticks++;
                shard.tick();
            }
        });

        clientSocket.on('die', (data) => {
            assert.equal(ticks, 5);
            /*
            assert.equal(countSnakeSpots(shard.getGridArray()), 0, 'should take no space on death');
            */
            done();
        });

        var snake = {
            position: {
                x: 1,
                y: 1
            },
            direction: Grid.Cardinal.E,
            segments: [{x: 1, y: 1}, {x: 1, y: 1}, {x: 1, y: 1}],
            isAlive: true
        };

        serverSocket.link(clientSocket);
        shard.addSocket(serverSocket, snake);


        ticks++;
        shard.tick();
    });

    it('should guard against moving backwards', function(done) {
        var shard = new Shard(defaultDimensions, defaultDimensions);
        var player = new Player(null);

        player.direction = Grid.Cardinal.E;
        player.position.x = 2;
        player.position.y = 1;
        player.segments = [{x: 1, y: 1}, {x: 1, y: 1}, {x: 1, y: 1}];
        assert.equal(shard.isMovingBackwards(player, Grid.Cardinal.S), false);
        assert.equal(shard.isMovingBackwards(player, Grid.Cardinal.W), true);

        done();
    });

    it('player should be able to change directions', function(done) {
        // 1 1 1 1 1
        // 1 3 3 0 1
        // 1 0 3 0 1
        // 1 0 3 0 1
        // 1 1 1 1 1
        // 4 ticks to die
        var shard = new Shard(defaultDimensions, defaultDimensions);
        shard.grace = 2;
        shard.setup();
        var serverSocket = new Socket();
        var clientSocket = new Socket();

        var ticks = 0;
        var updateListener = function(data) {
            ticks++;
            clientSocket.removeListener('update', updateListener);

            clientSocket.emit('direct', {
                ticks: data.ticks,
                position: data.position,
                segments: data.segments,
                direction: Grid.Cardinal.S
            });

            // After turning tick until dead
            clientSocket.on('update', function(data) {
                ticks++;
                shard.tick();
            });
            shard.tick();
        };
        clientSocket.on('update', updateListener);

        clientSocket.on('die', function() {
            assert.equal(ticks, 4 + shard.grace);
            done();
        });

        serverSocket.link(clientSocket);
        shard.addSocket(serverSocket, defaultStart);
        ticks++;
        shard.tick();
    });
});