import CoreState from '../core/core-state';
import io from 'socket.io-client';
import Debug from '../debug/debug';
import Config from '../../config.json';
import Input from '../core/input';
import PIXI from 'pixi.js';
import {Viewport, ViewportScene} from '../pixi/viewport';
import Camera from '../pixi/camera';
import Timer from '../util/timer';

var gridKey = {
    empty: 0,
    block: 1,
    food: 2,
    snake: 3
};

var cardinal = {
    N: 1,
    E: 2,
    S: 3,
    W: 4
};

var debug = {
    pX: 0,
    pY: 0,
    direction: 0,
    isAlive: false,
    length: 0,
    segments: [],
    players: 0,
    delay: 150
};

var commands = {
    direct: 'direct',
    eat: 'eat'
};

var receives = {
    start: 'start',
    update: 'update',
    die: 'die',
    ate: 'ate'
};

class GameState extends CoreState {
    /**
     * Creates the game state.
     * @param {RenderLayer} layer the layer to add children to.
     * @param {Input} input the input to retrieve from.
     * @param resources the resources for the game.
     */
    constructor(layer, input, resources) {
        super();

        this.type = 'GameState';

        this._window = window;
        this._layer = layer;
        this._input = input;
        this._resources = resources;

        this._socket = null;

        /**
         * Viewport to add to the layer.
         * @type {Viewport}
         * @private
         */
        this._viewport = null;

        /**
         * Scene to add and remove objects from.
         * @type {ViewportScene}
         * @private
         */
        this._scene = null;

        /**
         * Camera used for the viewport.
         * @type {Camera}
         * @private
         */
        this._camera = null;

        this._grid = [];
        this._subgridBounds = null;
        this._width = 0;
        this._height = 0;

        this._screenWidth = Config.screenWidth;
        this._screenHeight = Config.screenHeight;
        this._screenBuffer = Config.screenBuffer;
        this._leniency = Config.leniency;
        this._tickRate = Config.tickRate;

        this._blocks = [];
        this._blockWidth = Config.blockWidth;

        /**
         * Player that is being controlled.
         * @type {{id: number, position: {x: number, y: number}, direction: number, segments: Array.<{x: number, y: number}>}}
         * @private
         */
        this._player = {
            id: 0,
            position: {x: 0, y: 0},
            direction: cardinal.E,
            segments: []
        };

        /**
         * Players in the server.
         * @type {Array.<{id: number, position: {x: number, y: number}, segments: Array.<{x: number, y: number}>, direction: number}>}
         * @private
         */
        this._players = null;

        /**
         * Last received tick from the server.
         * @type {number}
         * @private
         */
        this._tick = 0;

        /**
         * True to set the game as running.
         * @type {boolean}
         * @private
         */
        this._isRunning = false;

        /**
         * Timer to check when updating the snake client side.
         * @type {Timer}
         * @private
         */
        this._timer = new Timer(1000 / this._tickRate);

        /**
         * Queued update data, flushed between updates
         * @type {Array}
         * @private
         */
        this._queuedData = [];

        /**
         * Queue for directional inputs.
         * @type {Array.<number>}
         * @private
         */
        this._directionQueue = [];

        /**
         * Number of directions to queue.
         * @type {number}
         * @private
         */
        this._directionQueueSize = 2;

        // Create an instance of a blocking texture
        this._blockTexture = new PIXI.RenderTexture(layer.renderer, this._blockWidth, this._blockWidth);
        var graphics = new PIXI.Graphics();
        graphics.beginFill(0xFFFFFF, 1);
        graphics.drawRect(0, 0, this._blockWidth, this._blockWidth);
        graphics.endFill();
        this._blockTexture.render(graphics);

        // Create an instance of the food texture
        this._foodTexture = new PIXI.RenderTexture(layer.renderer, this._blockWidth, this._blockHeight);
        graphics = new PIXI.Graphics();
        graphics.beginFill(0xFFFFFF, 1);
        graphics.drawCircle(this._blockWidth / 2, this._blockWidth / 2, this._blockWidth / 2);
        this._foodTexture.render(graphics);

        // Create an instance of a snake texture
        this._snakeTexture = new PIXI.RenderTexture(layer.renderer, this._blockWidth, this._blockWidth);
        graphics = new PIXI.Graphics();
        graphics.beginFill(0x00FF00, 1);
        graphics.drawRect(0, 0, this._blockWidth, this._blockWidth);
        graphics.endFill();
        this._snakeTexture.render(graphics);
    }

    /**
     * Calls a function after a set amount of time.
     * @param  {Function} fn the function to call after a certain amount of time.
     */
    _delay(fn) {
        window.setTimeout(fn, debug.delay);
    };

    onAdd() {
        Debug.Globals.instance.addControl(debug, 'pX', {listen: true});
        Debug.Globals.instance.addControl(debug, 'pY', {listen: true});
        Debug.Globals.instance.addControl(debug, 'direction', {listen: true});
        Debug.Globals.instance.addControl(debug, 'isAlive', {listen: true});
        Debug.Globals.instance.addControl(debug, 'length', {listen: true});
        Debug.Globals.instance.addControl(debug, 'players', {listen: true});
        Debug.Globals.instance.addControl(debug, 'delay', {listen: true});

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

    onEnter(params) {
        console.log('entering game state');
        // Create the viewport and add it to the rendering layer
        this._camera = new Camera();
        this._viewport = new Viewport(this._camera,
            Config.screenWidth * Config.blockWidth, Config.screenHeight * Config.blockWidth);
        this._viewport.addTo(this._layer);

        // Create the scene that objects will be placed in.
        this._scene = new ViewportScene();
        this._viewport.addScene(this._scene);

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

            this._socket.on(receives.start, (data) => {
                this._delay(() => {
                    console.log('start');
                    this._grid = data.grid;
                    this._subgridBounds = data.subgridBounds;
                    this._width = data.width;
                    this._height = data.height;
                    this._players = data.players;
                    this._tick = data.tick;
                    this._isRunning = true;

                    this._player.id = data.id;
                    this._player.position = data.position;
                    this._player.direction = data.direction;
                    this._player.segments = data.segments;

                    // Set the starting camera to where the player is
                    var camera = this._getPlayerCameraPosition();
                    this._camera.position.x = camera.x;
                    this._camera.position.y = camera.y;

                    debug.players = data.players.length;
                    debug.pX = data.position.x;
                    debug.pY = data.position.y;
                    debug.isAlive = data.isAlive;
                    debug.direction = data.direction;
                    debug.length = data.segments.length;
                    debug.segments = data.segments;
                });
            });

            this._socket.on(receives.die, (data) => {
                this._delay(() => {
                    console.log('dead');
                    debug.isAlive = false;
                    this.switcher.switchState(this, this.switcher.retrieveState('EndState'), null, {
                        score: data.score
                    });
                });
            });

            this._socket.on(receives.update, (data) => {
                this._delay(() => {
                    this._queuedData.push(data);
                });
            });

            this._socket.on(receives.ate, (data) => {
                this._delay(() => {
                    this._grid = data.grid;
                    this._subgridBounds = data.subgridBounds;
                    this._players = data.players;
                    this._tick = data.tick;

                    // Push a segment onto player the player's tail
                    //this._player.position = data.position;
                    this._player.segments.push(this._player.segments[this._player.segments.length - 1]);
                });
            });
            console.log('Connected!');
        });
    }

    /**
     * Update the game with the most recent received data.
     * @private
     */
    _updateData() {
        if (this._queuedData.length === 0) {
            return;
        }

        // Only use the most recent data
        var mostRecent = 0;
        var data;
        for (var i = 0; i < this._queuedData.length; i++) {
            if (mostRecent < this._queuedData[i].tick) {
                mostRecent = this._queuedData[i].tick;
                data = this._queuedData[i];
            }
        }

        var previousTick = this._tick;
        this._grid = data.grid;
        this._subgridBounds = data.subgridBounds;
        this._players = data.players;
        this._tick = data.tick;

        // Override client player if last update was too long ago or is forced
        //data.isForced = true;
        if (data.isForced || this._tick - previousTick > this._leniency) {
            console.log('forced');
            this._player.position = data.position;
            this._player.segments = data.segments;
        }

        debug.players = data.players.length;
        debug.pX = data.position.x;
        debug.pY = data.position.y;
        debug.isAlive = data.isAlive;
        debug.direction = data.direction;
        debug.length = data.segments.length;
        debug.segments = data.segments;

        this._queuedData = [];
    }

    /**
     * Checks if the player is moving backwards.
     * @param {number} direction the direction to check.
     * @returns {boolean} true if the direction is backwards.
     */
    isMovingBackwards(direction) {
        // Check if trying to move into the previous two segments
        // Checks previous two to catch fast two direction inputs
        var next = {
            x: this._player.position.x,
            y: this._player.position.y
        };

        switch (direction) {
            case cardinal.N:
                next.y -= 1;
                break;
            case cardinal.E:
                next.x += 1;
                break;
            case cardinal.S:
                next.y += 1;
                break;
            case cardinal.W:
                next.x -= 1;
                break;
        }

        var isBackwards = false;
        for (var i = 0; i < this._player.segments.length && i < 2; i++) {
            var segment = this._player.segments[i];
            if (next.x === segment.x && next.y === segment.y) {
                isBackwards = true;
                break;
            }
        }
        return isBackwards;
    }

    /**
     * Check if player direction should change.
     * @private
     */
    _checkKeys() {
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
        // Prevent moving in the opposite direction
        if (direction) {
            // Take out the most recent direction
            if (this._directionQueue.length >= this._directionQueueSize) {
                this._directionQueue.shift();
            }
            this._directionQueue.push(direction);
        }
    }

    /**
     * Renders a player.
     * @param player the player to render.
     * @param {boolean} isLocalPlayer true if the player is the local player.
     * @private
     */
    _renderPlayer(player, isLocalPlayer) {
        var block = new PIXI.Sprite(this._snakeTexture);
        block.position.x = player.position.x * this._blockWidth;
        block.position.y = player.position.y * this._blockWidth;
        this._blocks.push(block);
        this._scene.display.addChild(block);

        for (var i = 0; i < player.segments.length; i++) {
            var segment = player.segments[i];
            var dx = 0;
            var dy = 0;
            if (i === 0) {
                dx = player.position.x - segment.x;
                dy = player.position.y - segment.y;
            } else {
                dx = player.segments[i - 1].x - segment.x;
                dy = player.segments[i - 1].y - segment.y;
            }
            // Vertical
            if (dx === 0 && Math.abs(dy) === 1) {
                block = new PIXI.Sprite(this._resources['segment-vertical'].texture);
            } else if (Math.abs(dx) === 1 && dy === 0) {
                block = new PIXI.Sprite(this._resources['segment-horizontal'].texture);
            }


            block.position.x = segment.x * this._blockWidth;
            block.position.y = segment.y * this._blockWidth;
            this._blocks.push(block);
            this._scene.display.addChild(block);
        }
    }

    /**
     * Generate the display for rendering.
     * @private
     */
    _generateDisplay() {
        var i;
        for (i = 0; i < this._blocks.length; i++) {
            this._scene.display.removeChild(this._blocks[i]);
        }
        // Generate graphics for static objects
        this._blocks = [];
        var startX = this._subgridBounds.x1 * this._blockWidth;
        var startY = this._subgridBounds.y1 * this._blockWidth;
        for (var row = 0; row < this._grid.length; row++) {
            for (var col = 0; col < this._grid[row].length; col++) {
                var block = null;
                var key = this._grid[row][col];
                if (key === gridKey.block) {
                    block = new PIXI.Sprite(this._blockTexture);
                } else if (key === gridKey.food) {
                    block = new PIXI.Sprite(this._foodTexture);
                }

                if (block) {
                    block.position.x = startX + col * this._blockWidth;
                    block.position.y = startY + row * this._blockWidth;
                    this._blocks.push(block);
                    this._scene.display.addChild(block);
                }
            }
        }
        // Generate graphics for the players
        for (i = 0; i < this._players.length; i++) {
            var player = this._players[i];
            if (player.id !== this._player.id) {
                this._renderPlayer(player, false);
            }
        }
        // Render player separate due to updating locally
        this._renderPlayer(this._player, true);
    }

    /**
     * Retrieves the camera position centered on the player.
     * @returns {{x: number, y: number}}
     * @private
     */
    _getPlayerCameraPosition() {
        var x = this._player.position.x * this._blockWidth;
        var y = this._player.position.y * this._blockWidth;
        // Keep camera in bounds
        if (x < this._viewport.width / 2) {
            x = this._viewport.width / 2;
        } else if (x > this._width * this._blockWidth - this._viewport.width / 2) {
            x = this._width * this._blockWidth - this._viewport.width / 2;
        }
        if (y < this._viewport.height / 2) {
            y = this._viewport.height / 2;
        } else if (y > this._height * this._blockWidth - this._viewport.height / 2) {
            y = this._height * this._blockWidth - this._viewport.height / 2;
        }
        return {
            x: x,
            y: y
        };
    }

    /**
     * Simulates a tick.
     * @private
     */
    _simulate() {
        // Get the first valid direction in the queue
        var direction;
        var validDirection = false;
        while (!validDirection && this._directionQueue.length > 0) {
            direction = this._directionQueue.shift();
            if (!this.isMovingBackwards(direction)) {
                validDirection = true;
            }
        }
        if (validDirection) {
            this._player.direction = direction;
        }

        var position = this._player.position;

        var x = position.x;
        var y = position.y;
        switch (this._player.direction) {
            case cardinal.N:
                y -= 1;
                break;
            case cardinal.E:
                x += 1;
                break;
            case cardinal.S:
                y += 1;
                break;
            case cardinal.W:
                x -= 1;
                break;
        }
        if (x < 0) {
            x = 0;
        } else if (x >= this._width) {
            x = this._width - 1;
        }
        if (y < 0) {
            y = 0;
        } else if (y >= this._height) {
            y = this._height - 1;
        }

        var value = this._grid[y - this._subgridBounds.y1][x - this._subgridBounds.x1];
        // Going to die, stop moving and wait for server signal
        if (value === gridKey.block) {
            return;
        } else if (value === gridKey.food) {
            // Tell the server you ate something (otherwise client syncing could miss it)
            this._socket.emit(commands.eat, {
                x: x,
                y: y
            });
        }

        // Update the segments and head
        this._player.segments.unshift({x: position.x, y: position.y});
        this._player.position.x = x;
        this._player.position.y = y;
        this._player.segments.pop();

        this._delay(() => {
            if (!this._socket) return;
            this._socket.emit(commands.direct, {
                tick: this._tick,
                position: this._player.position,
                segments: this._player.segments,
                direction: this._player.direction
            });
        });
    }

    update(dt) {
        if (!this._isRunning) return;
        this._timer.update(dt);

        this._updateData();
        this._checkKeys();

        // Simulate a tick if a tick has passed
        if (this._timer.isReady()) {
            this._simulate();
            this._timer.reset();
        }

        // Smooth the camera movement to the player location
        var finalCamera = this._getPlayerCameraPosition();
        this._camera.position.x += (finalCamera.x - this._camera.position.x) * 0.1;
        this._camera.position.y += (finalCamera.y - this._camera.position.y) * 0.1;

        this._viewport.update();

        this._generateDisplay();
    }

    onLeave() {
        console.log('leaving game state');
        this._isRunning = false;

        if (this._socket) {
            this._socket.disconnect();
            this._socket = null;
        }

        // Remove the displays
        this._viewport.removeFromParent();

        // Reset values to default
        this._grid = [];
        this._subgridBounds = null;
        this._width = 0;
        this._height = 0;

        this._blocks = [];
        this._player = {
            id: 0,
            position: {x: 0, y: 0},
            direction: cardinal.E,
            segments: []
        };
        this._players = null;
        this._tick = 0;
        this._timer.reset();
        this._queuedData = [];
    }
}

export default GameState;
