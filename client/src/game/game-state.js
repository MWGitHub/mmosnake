"use strict";
import CoreState from '../core/core-state';
import io from 'socket.io-client';

class GameState extends CoreState {
    constructor() {
        super();

        this._socket = null;
        this._isConnected = false;
    }

    onEnter() {
        this._socket = io.connect('http://localhost:5000');
        var socket = this._socket;
        socket.on('connect', function() {
            this._isConnected = true;
            console.log('Connected!');
        });

        socket.on('connect_error', function() {
            // TODO: Switch to error state and remove game state
        });

        socket.on('reconnect', function() {
            console.log('Reconnected!');
        });
    }

    update(dt) {
        if (!this._isConnected) return;
    }

    onLeave() {

    }
}

export default GameState;