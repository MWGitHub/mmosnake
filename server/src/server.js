"use strict";
var Hapi = require('hapi');
var co = require('co');
var logger = require('./util/logger');
var SnakePlugin = require('./snake/snake-plugin');
var Config = require('../config.json');

var internals = {};

/**
 * Registers the plugins for the server.
 * @param {Hapi.Server} server the server to register plugins for.
 * @returns {Promise}
 */
internals.register = function(server) {
    return new Promise(function(resolve, reject) {
        server.register([
            {
                register: SnakePlugin,
                options: {
                    gridWidth: Config.gridWidth,
                    gridHeight: Config.gridHeight,
                    screenWidth: Config.screenWidth,
                    screenHeight: Config.screenHeight,
                    screenBuffer: Config.screenBuffer,
                    food: Config.food,
                    tickRate: Config.tickRate
                }
            }
        ], function(err) {
            if (err) return reject(err);
            resolve();
        })
    });
};

/**
 * Server to handle game logic and connections.
 */
class Server {
    /**
     * Create the server and set the connection port.
     * @param {Number} port the port to start the server on.
     */
    constructor(port) {
        this.server = new Hapi.Server();
        this.server.connection({
            port: port
        });
    }

    /**
     * Initialize the server without starting it.
     * @returns {Promise} the promise with the server.
     */
    initialize() {
        var self = this;
        return co(function* () {
            yield internals.register(self.server);

            return new Promise((resolve, reject) => {
                self.server.initialize((err) => {
                    if (err) return reject(err);
                    logger.info('Server initialized.');
                    resolve(self.server);
                });
            });
        });
    }

    /**
     * Starts the server.
     * @returns {Promise} the promise with the server.
     */
    start() {
        var self = this;
        return co(function* () {
            var server = self.server;
            yield internals.register(server);

            return new Promise((resolve, reject) => {
                server.start((err) => {
                    if (err) return reject(err);
                    logger.info('Server started on %s:%d.', server.info.address, server.info.port)
                    resolve(server);
                });
            });
        });
    }

    /**
     * Stops the server.
     * @returns {Promise} the promise with the server.
     */
    stop() {
        return new Promise((resolve, reject) => {
            this.server.stop((err) => {
                if (err) return reject(err);
                logger.info('Server stopped.');
                resolve(this.server);
            })
        })
    }
}

module.exports = Server;