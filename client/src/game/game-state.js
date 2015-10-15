"use strict";
import CoreState from '../core/core-state';
import io from 'socket.io-client';
import Debug from '../debug/debug';

var gridKey = {
    empty: 0,
    block: 1,
    food: 2
};

class GameState extends CoreState {
    /**
     * Creates the game state.
     * @param {RenderLayer} layer the layer to add children to.
     */
    constructor(layer) {
        super();

        this._layer = layer;
        this._socket = null;
        this._isConnected = false;

        this._debug = {
            index: 0,
            direction: 0,
            isAlive: false,
            length: 0,
            segments: [],
            players: 0
        };

        this._grid = [];
        this._width = 0;

        this._blocks = [];
        this._blockWidth = 16;

        // Create an instance of a blocking texture.
        this._blockTexture = new PIXI.RenderTexture(layer.renderer, this._blockWidth, this._blockWidth);
        var graphics = new PIXI.Graphics();
        graphics.beginFill(0xFFFFFF);
        graphics.drawRect(0, 0, this._blockWidth, this._blockWidth);
        graphics.endFill();
        this._blockTexture.render(graphics);
    }

    onAdd() {
        Debug.Globals.instance.addControl(this._debug, 'index', {listen: true});
        Debug.Globals.instance.addControl(this._debug, 'direction', {listen: true});
        Debug.Globals.instance.addControl(this._debug, 'isAlive', {listen: true});
        Debug.Globals.instance.addControl(this._debug, 'length', {listen: true});
        Debug.Globals.instance.addControl(this._debug, 'players', {listen: true});
    }

    onEnter() {
        this._socket = io.connect('http://localhost:5000');
        this._socket.on('connect', () => {
            this._isConnected = true;

            this._socket.on('connect_error', function() {
                // TODO: Switch to error state and remove game state
            });

            this._socket.on('reconnect', function() {
                console.log('Reconnected!');
            });

            this._socket.on('start', (data) => {
                var snake = data.snake;
                this._width = data.width;
                this._debug.index = snake.index;
                this._debug.isAlive = snake.isAlive;
                this._debug.direction = snake.direction;
                this._debug.length = snake.segments.length;
                this._debug.segments = snake.segments;
            });

            this._socket.on('die', () => {
                console.log('dead');
                this._debug.isAlive = false;
            });

            this._socket.on('update', (data) => {
                this._grid = data.grid;
                var snake = data.snake;
                this._debug.players = data.players;
                this._debug.index = snake.index;
                this._debug.isAlive = snake.isAlive;
                this._debug.direction = snake.direction;
                this._debug.length = snake.segments.length;
                this._debug.segments = snake.segments;
            });

            console.log('Connected!');
        });
    }

    update(dt) {
        if (!this._isConnected) return;

        // Handle inputs
    }

    preRender() {
        var i;
        for (i = 0; i < this._blocks.length; i++) {
            this._layer.removeChild(this._blocks[i]);
        }
        this._blocks = [];
        for (i = 0; i < this._grid.length; i++) {
            var block = null;
            if (this._grid[i] === gridKey.block) {
                block = new PIXI.Sprite(this._blockTexture);
            }

            if (block) {
                var col = i % this._width;
                var row = Math.floor(i / this._width);
                block.position.x = col * this._blockWidth;
                block.position.y = row * this._blockWidth;
                this._layer.addChild(block);
                this._blocks.push(block);
            }
        }
    }

    onLeave() {

    }
}

export default GameState;