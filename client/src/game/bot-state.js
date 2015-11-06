"use strict";
import CoreState from '../core/core-state';
import Input from '../core/input';
import io from 'socket.io-client';
import Debug from '../debug/debug';
import _ from 'lodash';
import Config from '../../config.json';
import PIXI from 'pixi.js';

var cardinal = {
    N: 1,
    E: 2,
    S: 3,
    W: 4
};

class BotState extends CoreState {
    /**
     * Creates the game state.
     * @param {RenderLayer} layer the layer to add children to.
     * @param {Input} input the input to get key events from.
     * @param resources
     */
    constructor(layer, input, resources) {
        super();

        this.type = 'BotState';

        this._input = input;
        this._layer = layer;
        this._resources = resources;
        this._sockets = [];

        this._container = null;

        this._numBotsText = null;
        this._numBots = 0;
        this._botRateText = null;
        this._botRate = 0;

        this._updateRate = 1000 / 5;
        this._currentTimer = 0;
    }

    _updateNumBotsText() {
        this._numBotsText.text = 'Bots: ' + this._numBots;
    }

    _updateBotRateText() {
        this._botRateText.text = 'Bot rate: ' + this._botRate;
    }

    _removeBot(socket) {
        var index = this._sockets.indexOf(socket);
        if (index >= 0) {
            socket.disconnect();
            this._sockets.splice(index, 1);
            this._numBots -= 1;
            this._updateNumBotsText();
        }
    }

    _createBot() {
        var socket = io.connect(Config.host, {
            'force new connection': true
        });
        socket.on('connect', () => {
            this._numBots++;
            this._updateNumBotsText();

            socket.on('die', () => {
                this._removeBot(socket);
                this._updateNumBotsText();
            });
        });

        this._sockets.push(socket);
    }

    _checkKeys() {
        if (this._input.keysJustDown[Input.CharCodes.Up]) {
            this._createBot();
        }
        if (this._input.keysJustDown[Input.CharCodes.Right]) {
            this._botRate++;
            this._updateBotRateText();
        }
        if (this._input.keysJustDown[Input.CharCodes.Down]) {
            if (this._sockets.length > 0) {
                this._removeBot(this._sockets[0]);
            }
        }
        if (this._input.keysJustDown[Input.CharCodes.Left]) {
            if (this._botRate > 0) {
                this._botRate -= 1;
                this._updateBotRateText();
            }
        }
    }

    onEnter() {
        console.log('entering bot state');
        this._container = new PIXI.Container();
        this._layer.addChild(this._container);

        this._numBots = 0;
        this._botRate = 0;

        var text = new PIXI.Text('UP to add bots\nDOWN to remove bots\nLEFT to decrease bot rate\nRIGHT to increase bot rate', {
            font: 'bold 16px Arial',
            fill: "#000000"
        });
        this._container.addChild(text);

        this._numBotsText = new PIXI.Text('Bots: ' + this._numBots, {
            font: 'bold 16px Arial',
            fill: '#000000'
        });
        this._numBotsText.position.y = 100;
        this._container.addChild(this._numBotsText);

        this._botRateText = new PIXI.Text('Bot rate: ' + this._botRate, {
            font: 'bold 16px Arial',
            fill: '#000000'
        });
        this._botRateText.position.y = 120;
        this._container.addChild(this._botRateText);

        var overlayScreen = new PIXI.Sprite(this._resources['screen-pattern'].texture);
        overlayScreen.position.x = 0;
        overlayScreen.position.y = 0;
        this._container.addChild(overlayScreen);
    }

    update(dt) {
        this._checkKeys();
        if (this._currentTimer > this._updateRate) {
            this._currentTimer = 0;
            // Randomly direct the bots
            for (var i = 0; i < this._sockets.length; i++) {
                this._sockets[i].emit('direct', {
                    direction: _.sample(cardinal)
                });
            }
            // Create bots
            for (i = 0; i < this._botRate; i++) {
                this._createBot();
            }
        } else {
            this._currentTimer += dt;
        }
    }

    onLeave() {
        console.log('leaving bot state');

        for (var i = 0; i < this._sockets.length; i++) {
            this._sockets[i].disconnect();
        }

        this._layer.removeChild(this._container);
    }
}

export default BotState;