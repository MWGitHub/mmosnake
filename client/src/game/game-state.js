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
        this._socket.on('connect', () => {
            console.log(this._socket);
            this._isConnected = true;

            this._socket.on('connect_error', function() {
                // TODO: Switch to error state and remove game state
            });

            this._socket.on('reconnect', function() {
                console.log('Reconnected!');
            });

            this._socket.on('ping', function(data) {

            });

            this._socket.on('start', function(data) {
                console.log(data);
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