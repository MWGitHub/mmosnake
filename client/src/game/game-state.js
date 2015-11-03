"use strict";
import CoreState from '../core/core-state';
import io from 'socket.io-client';
import Debug from '../debug/debug';
import Config from '../../config.json';
import Input from '../core/input';

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
     * @param {Input} input the input to retrieve from.
     */
    constructor(window, layer, input) {
        super();

        this.type = 'GameState';

        this._window = window;
        this._layer = layer;
        this._input = input;
        this._socket = null;

        this._container = null;

        this._debug = {
            index: 0,
            direction: 0,
            isAlive: false,
            length: 0,
            segments: [],
            players: 0,
            delay: 150
        };

        this._grid = [];
        this._width = 0;

        this._screenWidth = Config.screenWidth;
        this._screenHeight = Config.screenHeight;

        this._blocks = [];
        this._blockWidth = Config.blockWidth;

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

    /**
     * Calls a function after a set amount of time.
     * @param  {Function} fn the function to call after a certain amount of time.
     */
    _delay(fn) {
        window.setTimeout(fn, this._debug.delay);
    };

    onAdd() {
        Debug.Globals.instance.addControl(this._debug, 'index', {listen: true});
        Debug.Globals.instance.addControl(this._debug, 'direction', {listen: true});
        Debug.Globals.instance.addControl(this._debug, 'isAlive', {listen: true});
        Debug.Globals.instance.addControl(this._debug, 'length', {listen: true});
        Debug.Globals.instance.addControl(this._debug, 'players', {listen: true});
        Debug.Globals.instance.addControl(this._debug, 'delay', {listen: true});

        // Bind keys to hotkeys
        this._input.addHotkey(Input.CharToKeyCode('W'), 'move-up');
        this._input.addHotkey(Input.CharCodes.Up, 'move-up');
        this._input.addHotkey(Input.CharToKeyCode('D'), 'move-right');
        this._input.addHotkey(Input.CharCodes.Right, 'move-right');
        this._input.addHotkey(Input.CharToKeyCode('S'), 'move-down');
        this._input.addHotkey(Input.CharCodes.Down, 'move-down');
        this._input.addHotkey(Input.CharToKeyCode('A'), 'move-left');
        this._input.addHotkey(Input.CharCodes.Left, 'move-left');
    }

    onEnter() {
        console.log('entering game state');
        this._container = new PIXI.Container();
        this._layer.addChild(this._container);

        // Connect to the server
        this._socket = io.connect(Config.host, {
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
                this._delay(() => {
                    console.log('start');
                    var snake = data.snake;
                    this._grid = data.grid;
                    this._width = data.width;
                    this._debug.index = snake.index;
                    this._debug.isAlive = snake.isAlive;
                    this._debug.direction = snake.direction;
                    this._debug.length = snake.segments.length;
                    this._debug.segments = snake.segments;
                });
            });

            this._socket.on('die', (data) => {
                this._delay(() => {
                    console.log('dead');
                    this._debug.isAlive = false;
                    this.switcher.switchState(this, this.switcher.retrieveState('EndState'), null, {
                        score: data.score
                    });
                });
            });

            this._socket.on('update', (data) => {
                this._delay(() => {
                    var snake = data.snake;
                    this._grid = data.grid;
                    this._debug.players = data.players;
                    this._debug.index = snake.index;
                    this._debug.isAlive = snake.isAlive;
                    this._debug.direction = snake.direction;
                    this._debug.length = snake.segments.length;
                    this._debug.segments = snake.segments;
                });
            });
            console.log('Connected!');
        });
    }

    _checkKeys() {
        if (!this._socket) return;

        var direction;
        if (this._input.keysJustDown['move-up']) {
            direction = cardinal.N;
        }
        if (this._input.keysJustDown['move-right']) {
            direction = cardinal.E;
        }
        if (this._input.keysJustDown['move-down']) {
            direction = cardinal.S;
        }
        if (this._input.keysJustDown['move-left']) {
            direction = cardinal.W;
        }
        if (direction) {
            this._delay(() => {
                this._socket.emit('direct', {direction: direction});
            });
        }
    }

    update(dt) {
        this._checkKeys();
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
