"use strict";
import CoreState from '../core/core-state';
import io from 'socket.io-client';
import Debug from '../debug/debug';

class GameState extends CoreState {
    constructor(stage) {
        super();

        this._socket = null;
        this._isConnected = false;

        this._snake = {
            index: 0,
            direction: 0,
            isAlive: false,
            length: 0,
            segments: []
        };

        this._grid = [];
    }

    onAdd() {
        Debug.Globals.instance.addControl(this._snake, 'index', {listen: true});
        Debug.Globals.instance.addControl(this._snake, 'direction', {listen: true});
        Debug.Globals.instance.addControl(this._snake, 'isAlive', {listen: true});
        Debug.Globals.instance.addControl(this._snake, 'length', {listen: true});
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
                this._snake.index = data.index;
                this._snake.isAlive = data.isAlive;
                this._snake.direction = data.direction;
                this._snake.length = data.segments.length;
                this._snake.segments = data.segments;
                console.log(data);
            });

            this._socket.on('dead', function() {
                console.log('dead');
                this._snake.isAlive = false;
            });

            this._socket.on('update', (data) => {
                this._grid = data.grid;
                var snake = data.snake;
                this._snake.index = snake.index;
                this._snake.isAlive = snake.isAlive;
                this._snake.direction = snake.direction;
                this._snake.length = snake.segments.length;
                this._snake.segments = snake.segments;
            });

            console.log('Connected!');
        });
    }

    update(dt) {
        if (!this._isConnected) return;
    }

    onLeave() {

    }
}

export default GameState;