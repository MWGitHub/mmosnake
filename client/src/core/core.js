"use strict";
import _ from 'lodash';

var callbackTypes = {
    preUpdate: '_preUpdateCallbacks',
    update: '_updateCallbacks',
    postUpdate: '_postUpdateCallbacks',
    preRender: '_preRenderCallbacks',
    postRender: '_postRenderCallbacks',
    preLoop: '_preLoopCallbacks',
    postLoop: '_postLoopCallbacks'
};

/**
 * Updates the logic and render layers.
 * @param window the window to use.
 * @constructor
 */
class Core {
    constructor(window) {
        if (!window) throw new Error('No window given');

        /**
         * Step size to use for each update in milliseconds.
         * Set to 0 to have a variable step size.
         * @type {number}
         */
        this.updateStepSize = 16;
        /**
         * Step size to use for each render in milliseconds.
         * Set to 0 to have a variable step size.
         * @type {number}
         */
        this.renderStepSize = 16;

        this._window = window;
        this._renderLayers = [];
        this._preUpdateCallbacks = [];
        this._updateCallbacks = [];
        this._postUpdateCallbacks = [];
        this._preRenderCallbacks = [];
        this._postRenderCallbacks = [];
        this._preLoopCallbacks = [];
        this._postLoopCallbacks = [];

        this._isRunning = false;
        this._lastUpdateTime = 0;
        this._lastRenderTime = 0;
        this._timeElapsed = 0;

        // Cross platform request animation frame
        this._requestAnimFrame = (window.requestAnimationFrame || window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame || window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function(callback) {
                window.setTimeout(callback, 1000 / 120);
            }).bind(window);

        this._boundGameLoop = this._gameLoop.bind(this);
    }

    /**
     * Renders the scene.
     * @param {Number} dt time between updates.
     */
    render(dt) {
        this._preRenderCallbacks.forEach(function(element) {
            element(dt);
        });
        this._renderLayers.forEach(function(element) {
            element.render(dt);
        });
        this._postRenderCallbacks.forEach(function(element) {
            element(dt);
        });
    }

    /**
     * Updates the game.
     * @param {number} dt the time step of the update.
     */
    update(dt) {
        this._preUpdateCallbacks.forEach(function(element) {
            element(dt);
        });

        this._updateCallbacks.forEach(function(element) {
            element(dt);
        });

        this._postUpdateCallbacks.forEach(function(element) {
            element(dt);
        });
    }

    /**
     * Updates the game logic and renders the scene.
     */
    _gameLoop() {
        if (!this._isRunning) {
            return;
        }

        var now = Date.now();
        var udt = this.updateStepSize || (now - this._lastUpdateTime);
        var rdt = this.renderStepSize || (now - this._lastRenderTime);

        // Run the loop begin callbacks.
        var i;
        for (i = 0; i < this._preLoopCallbacks.length; i++) {
            this._preLoopCallbacks[i](udt);
        }

        // Update in steps until caught up
        while (this._lastUpdateTime <= now) {
            this.update(udt);
            this._timeElapsed += udt;
            this._lastUpdateTime += udt;
        }
        while (this._lastRenderTime <= now) {
            this.render(udt);
            this._lastRenderTime += rdt;
        }

        // Run the loop end callbacks.
        for (i = 0; i < this._postLoopCallbacks.length; i++) {
            this._postLoopCallbacks[i](udt);
        }

        if (this._isRunning) {
            this._requestAnimFrame.call(this._window, this._boundGameLoop);
        }
    }

    /**
     * Starts the game.
     */
    start() {
        this._isRunning = true;
        var now = Date.now();
        this._lastUpdateTime = now;
        this._lastRenderTime = now;
        this._gameLoop();
    }

    /**
     * Stops the game.
     */
    stop() {
        this._isRunning = false;
    }

    /**
     * Resizes each rendering layer.
     * @param {Number} width the width to resize the layers.
     * @param {Number} height the height to resize the layers.
     */
    resize(width, height) {
        this._renderLayers.forEach(function(element) {
            element.resize(width, height);
        });
    }

    /**
     * Add a render layer.
     * @param {RenderLayer} layer the layer to add.
     */
    addRenderLayer(layer) {
        this._renderLayers.push(layer);
    }

    /**
     * Remove a render layer.
     * @param {RenderLayer} layer the layer to remove.
     */
    removeRenderLayer(layer) {
        var index = this._renderLayers.indexOf(layer);
        if (index > -1) {
            this._renderLayers.splice(index, 1);
        }
    }

    /**
     * Add a callback related to the main loop.
     * @param {String} type the type of loop callback.
     * @param {function(number)} cb the callback function to add which accepts a delta time.
     */
    addLoopCallback(type, cb) {
        if (!_.includes(callbackTypes, type)) {
            throw new Error('Type not valid.');
        }
        this[type].push(cb);
    }

    /**
     * Remove a callback related to the main loop.
     * @param {String} type the type of loop callback.
     * @param {function(number)} cb the callback function remove.
     */
    removeLoopCallback(type, cb) {
        if (!_.includes(callbackTypes, type)) {
            throw new Error('Type not valid.');
        }
        var index = this[type].indexOf(cb);
        if (index > -1) {
            this[type].splice(index, 1);
        }
    }

    /**
     * Retrieves if the core is running.
     * @returns {boolean}
     */
    get isRunning() {
        return this._isRunning;
    }

    get timeElapsed() {
        return this._timeElapsed;
    }
}

/**
 * Types of loop callbacks.
 */
Core.Callbacks = callbackTypes;

export default Core;
