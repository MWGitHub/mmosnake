"use strict";
var internals = {
    id: 0
};

/**
 * Fake socket to use with tests.
 */
class Socket {
    constructor() {
        this._id = internals.id;
        internals.id++;

        /**
         * Listeners for events.
         * @type {Object.<String, Array.<function>>}
         * @private
         */
        this._listeners = {};

        /**
         * Linked sockets to call events on.
         * @type {Array.<Socket>}
         * @private
         */
        this._links = [];
    }

    on(event, fn) {
        if (!this._listeners[event]) {
            this._listeners[event] = [];
        }
        this._listeners[event].push(fn);
    }

    removeListener(event, fn) {
        var listeners = this._listeners[event];
        if (listeners) {
            var index = listeners.indexOf(fn);
            listeners.splice(index, 1);
        }
    }

    emit(event, data) {
        for (var linkIndex = 0; linkIndex < this._links.length; linkIndex++) {
            var link = this._links[linkIndex];
            var listeners = link._listeners[event];
            if (!listeners) continue;
            for (var i = 0; i < listeners.length; i++) {
                listeners[i](data);
            }
        }
    }

    /**
     * Link a socket to this socket.
     * @param {Socket} socket the socket to link.
     */
    link(socket) {
        if (!socket) return;
        this._links.push(socket);
        socket._links.push(this);
    }

    /**
     * Unlink a socket to this socket.
     * @param {Socket} socket the socket to unlink.
     */
    unlink(socket) {
        if (!socket) return;
        var index = this._links.indexOf(socket);
        if (index >= 0) {
            this._links.splice(index, 1);
        }

        index = socket._links.indexOf(this);
        if (index >= 0) {
            socket._links.splice(index, 1);
        }
    }

    get id() {
        return this._id;
    }
}

module.exports = Socket;