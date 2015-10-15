"use strict";
import CoreState from '../core/core-state';
import io from 'socket.io-client';
import Debug from '../debug/debug';

var gridKey = {
    empty: 0,
    blocked: 1,
    food: 2
};

var cardinal = {
    N: 1,
    E: 2,
    S: 3,
    W: 4
};

class GameState extends CoreState {
    /**
     * Creates the game state.
     * @param window the window to attach input events to.
     * @param {RenderLayer} layer the layer to add children to.
     */
    constructor(window, layer) {
        super();

        this.type = 'GameState';

        this._window = window;
        this._layer = layer;
        this._socket = null;

        this._container = null;

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

        this._screenWidth = 21;
        this._screenHeight = 15;

        this._blocks = [];
        this._blockWidth = 16;

        this._keyDown = this._onKeyDown.bind(this);
        this._previousKeyDown = null;

        // Create an instance of a blocking texture
        this._blockTexture = new PIXI.RenderTexture(layer.renderer, this._blockWidth, this._blockWidth);
        var graphics = new PIXI.Graphics();
        graphics.beginFill(0xFFFFFF);
        graphics.drawRect(0, 0, this._blockWidth, this._blockWidth);
        graphics.endFill();
        this._blockTexture.render(graphics);

        // Create an instance of the food texture
        this._foodTexture = new PIXI.RenderTexture(layer.renderer, this._blockWidth, this._blockHeight);
        graphics = new PIXI.Graphics();
        graphics.beginFill(0xFFFFFF);
        graphics.drawCircle(this._blockWidth / 2, this._blockWidth / 2, this._blockWidth / 2);
        this._foodTexture.render(graphics);
    }

    onAdd() {
        Debug.Globals.instance.addControl(this._debug, 'index', {listen: true});
        Debug.Globals.instance.addControl(this._debug, 'direction', {listen: true});
        Debug.Globals.instance.addControl(this._debug, 'isAlive', {listen: true});
        Debug.Globals.instance.addControl(this._debug, 'length', {listen: true});
        Debug.Globals.instance.addControl(this._debug, 'players', {listen: true});
    }

    _onKeyDown(e) {
        if (!this._socket) return;
        var key = e.key || e.keyIdentifier || e.keyCode;
        // Prevent spamming emits
        if (this._previousKeyDown === key) return;
        var emitted = false;
        switch (key) {
            case 'Up':
                this._socket.emit('direct', {direction: cardinal.N});
                emitted = true;
                break;
            case 'Right':
                this._socket.emit('direct', {direction: cardinal.E});
                emitted = true;
                break;
            case 'Down':
                this._socket.emit('direct', {direction: cardinal.S});
                emitted = true;
                break;
            case 'Left':
                this._socket.emit('direct', {direction: cardinal.W});
                emitted = true;
                break;
        }
        if (emitted) {
            this._previousKeyDown = key;
        }
    }

    onEnter() {
        console.log('entering game state');
        this._container = new PIXI.Container();
        this._layer.addChild(this._container);

        this._socket = io.connect('http://localhost:5000', {
            'force new connection': true
        });
        this._socket.on('connect', () => {
            this._socket.on('connect_error', function() {
                // TODO: Switch to error state and remove game state
            });

            this._socket.on('reconnect', function() {
                console.log('Reconnected!');
            });

            this._socket.on('start', (data) => {
                var snake = data.snake;
                this._grid = data.grid;
                this._width = data.width;
                this._debug.index = snake.index;
                this._debug.isAlive = snake.isAlive;
                this._debug.direction = snake.direction;
                this._debug.length = snake.segments.length;
                this._debug.segments = snake.segments;
            });

            this._socket.on('die', (data) => {
                console.log('dead');
                this._debug.isAlive = false;
                this.switcher.switchState(this, this.switcher.retrieveState('EndState'), null, {
                    score: data.score
                });
            });

            this._socket.on('update', (data) => {
                var snake = data.snake;
                this._grid = data.grid;
                this._debug.players = data.players;
                this._debug.index = snake.index;
                this._debug.isAlive = snake.isAlive;
                this._debug.direction = snake.direction;
                this._debug.length = snake.segments.length;
                this._debug.segments = snake.segments;
            });

            this._window.addEventListener('keydown', this._keyDown);

            console.log('Connected!');
        });
    }

    update(dt) {
    }

    preRender() {
        var i;
        for (i = 0; i < this._blocks.length; i++) {
            this._container.removeChild(this._blocks[i]);
        }
        this._blocks = [];
        for (i = 0; i < this._grid.length; i++) {
            var block = null;
            if (this._grid[i] === gridKey.blocked) {
                block = new PIXI.Sprite(this._blockTexture);
            } else if (this._grid[i] === gridKey.food) {
                block = new PIXI.Sprite(this._foodTexture);
            }

            if (block) {
                var col = i % this._screenWidth;
                var row = Math.floor(i / this._screenWidth);
                block.position.x = col * this._blockWidth;
                block.position.y = row * this._blockWidth;
                this._container.addChild(block);
                this._blocks.push(block);
            }
        }
    }

    onLeave() {
        console.log('leaving game state');
        this._window.removeEventListener('keydown', this._keyDown);

        if (this._socket) {
            this._socket.disconnect();
        }

        this._layer.removeChild(this._container);
    }
}

export default GameState;