var isBrowser = true;
if (process && process.argv.length !== 0) {
    isBrowser = false;
}

/**
 * Handles keyboard, mouse, and game pad inputs.
 * @param {HTMLElement} window the window to use.
 * @param {HTMLElement=} element the element to retrieve input events from.
 * @constructor
 */
function Input(window, element) {
    "use strict";

    /**
     * Window to use for navigator support.
     * @type {HTMLElement=}
     */
    this.window = window;

    /**
     * Document to get the mouse position from.
     * @type {HTMLElement}
     */
    this.document = element;

    /**
     * Navigator used for gamepads.
     * @type {*}
     */
    this.navigator = window.navigator;

    /**
     * Element that is being focused by the mouse.
     * @type {HTMLElement}
     */
    this.focusElement = null;

    /**
     * Mouse offsets for finding the relative position.
     * @type {number}
     */
    this.offsetX = 0.0;
    this.offsetY = 0.0;

    /**
     * Width and height of the element to retrieve inputs from.
     * @type {number}
     */
    this.width = element ? element.offsetWidth : 0;
    this.height = element ? element.offsetHeight : 0;

    /**
     * True when the mouse is just clicked.
     * @type {{left: boolean, middle: boolean, right: boolean}}
     */
    this.isMouseClicked = {
        left: false,
        middle: false,
        right: false
    };

    /**
     * True when the mouse is just released.
     * @type {{left: boolean, middle: boolean, right: boolean}}
     */
    this.isMouseReleased = {
        left: false,
        middle: false,
        right: false
    };

    /**
     * True when the mouse is being held down.
     * @type {{left: boolean, middle: boolean, right: boolean}}
     */
    this.isMouseDown = {
        left: false,
        middle: false,
        right: false
    };

    /**
     * Position of the mouse relative to the center of the canvas.
     * Left ie negative X and right is positive X.
     * Up is positive Y and down is negative Y.
     * Ranges from -1 to 1.
     * @type {number}
     */
    this.mouseX = 0;
    this.mouseY = 0;

    /**
     * True if a key is down.
     * @dict
     */
    this.keysDown = {};

    /**
     * True if a key is up for the current frame.
     * @dict
     */
    this.keysUp = {};

    /**
     * True if a key is pressed for the current frame.
     * @dict
     */
    this.keysJustDown = {};

    /**
     * Hotkeys are keys that map to one or more hotkeys.
     * Hotkeys names are added to the keysDown and keysUp input.
     * @dict
     */
    this.hotkeys = {};

    /**
     * True to enable game pad support.
     * @type {boolean}
     */
    this.enableGamePads = true;

    /**
     * Dead zone for game pads.
     * @type {number}
     */
    this.deadZone = 0.25;

    /**
     * Connected game pads.
     * @type {Array.<Gamepad>}
     */
    this.gamepads = [];

    /**
     * Buttons for the gamepad in the previous frame.
     * @type {Array.<GamepadButton>}
     */
    this.gamepadsButtonsPrevious = [];

    /**
     * Check if game pad support is available.
     * @type {Boolean}
     */
    this.gamepadSupportAvailable = this.navigator.getGamepads ||
        !!this.navigator.webkitGetGamepads ||
        !!this.navigator.webkitGamepads;

    /**
     * True to force all gamepads to use a single pad code.
     * @type {boolean}
     */
    this.forceSingleGamepad = true;

    /********************************************
     * Initialize the inputs.
     *******************************************/
    // Don't listen to events if no element is given.
    if (!element) return;

    // Calculate the offsets.
    var obj = element;
    if (obj.offsetParent) {
        do {
            this.offsetX += obj.offsetLeft;
            this.offsetY += obj.offsetTop;
        } while (obj = obj.offsetParent);
    }

    // Disable default behavior.
    this.disableDefaults(element);

    // Keep track of the focused element.
    element.ownerDocument.addEventListener('mousedown', (function(event) {
        this.focusElement = event.target;
    }).bind(this), false);

    // Add the events.
    element.addEventListener('mousedown', this.onMouseDown.bind(this), false);
    element.addEventListener('mouseup', this.onMouseUp.bind(this), false);
    element.addEventListener('mousemove', this.onMouseMove.bind(this), false);

    // Set up the keycode.
    element.ownerDocument.addEventListener('keydown', this.onKeyDown.bind(this));
    element.ownerDocument.addEventListener('keyup', this.onKeyUp.bind(this));
}

/**
 * Updates the input.
 * @param {number} dt the time between frames.
 */
Input.prototype.update = function(dt) {
    "use strict";

    // Update the gamepads.
    if (this.gamepadSupportAvailable && this.enableGamePads) {
        this.updateGamePads();
    }
};

/**
 * Runs when the mouse is down.
 * @param {MouseEvent} event the mouse event.
 */
Input.prototype.onMouseDown = function(event) {
    "use strict";

    var code = null;
    switch (event.button) {
        case Input.MouseButtons.Left:
            this.isMouseClicked.left = true;
            this.isMouseDown.left = true;
            code = Input.MouseCodes.Left;
            break;
        case Input.MouseButtons.Middle:
            this.isMouseClicked.middle = true;
            this.isMouseDown.middle = true;
            code = Input.MouseCodes.Middle;
            break;
        case Input.MouseButtons.Right:
            this.isMouseClicked.right = true;
            this.isMouseDown.right = true;
            code = Input.MouseCodes.Right;
            break;
    }
    if (code) {
        this.keysDown[code] = true;
        this.keysJustDown[code] = true;

        // Update every hotkey.
        if (this.hotkeys[code]) {
            for (var i = 0; i < this.hotkeys[code].length; i++) {
                this.keysDown[this.hotkeys[code][i]] = true;
                this.keysJustDown[this.hotkeys[code][i]] = this.keysJustDown[code];
            }
        }
    }
};

/**
 * Runs when the mouse is released.
 * @param {MouseEvent} event the mouse event.
 */
Input.prototype.onMouseUp = function(event) {
    "use strict";

    var code = null;
    switch (event.button) {
        case Input.MouseButtons.Left:
            this.isMouseDown.left = false;
            this.isMouseReleased.left = true;
            code = Input.MouseCodes.Left;
            break;
        case Input.MouseButtons.Middle:
            this.isMouseDown.middle = false;
            this.isMouseReleased.middle = true;
            code = Input.MouseCodes.Middle;
            break;
        case Input.MouseButtons.Right:
            this.isMouseDown.right = false;
            this.isMouseReleased.middle = true;
            code = Input.MouseCodes.Right;
            break;
    }
    if (code) {
        this.keysDown[code] = false;
        this.keysUp[code] = true;

        // Update every hotkey.
        if (this.hotkeys[code]) {
            for (var i = 0; i < this.hotkeys[code].length; i++) {
                this.keysDown[this.hotkeys[code][i]] = false;
                this.keysUp[this.hotkeys[code][i]] = true;
            }
        }
    }
};

/**
 * Runs when the mouse has moved.
 * @param {MouseEvent} event the mouse event.
 */
Input.prototype.onMouseMove = function(event) {
    "use strict";

    this.mouseX = (event.pageX - this.offsetX - this.width / 2) / (this.width / 2);
    this.mouseY = -(event.pageY - this.offsetY - this.height / 2) / (this.height / 2);
};

Input.prototype.onKeyDown = function(event) {
    "use strict";

    var charCode = event.keyCode;
    // Only add to just down if it isn't down already.
    if (!this.keysDown[charCode]) {
        this.keysJustDown[charCode] = true;
    }
    this.keysDown[charCode] = true;

    // Update every hotkey.
    if (this.hotkeys[charCode]) {
        for (var i = 0; i < this.hotkeys[charCode].length; i++) {
            this.keysDown[this.hotkeys[charCode][i]] = true;
            this.keysJustDown[this.hotkeys[charCode][i]] = this.keysJustDown[charCode];
        }
    }

    return false;
};

Input.prototype.onKeyUp = function(event) {
    "use strict";

    var charCode = event.keyCode;
    this.keysDown[charCode] = false;
    this.keysUp[charCode] = true;

    // Update every hotkey.
    if (this.hotkeys[charCode]) {
        for (var i = 0; i < this.hotkeys[charCode].length; i++) {
            this.keysDown[this.hotkeys[charCode][i]] = false;
            this.keysUp[this.hotkeys[charCode][i]] = true;
        }
    }
};

/**
 * Updates the gamepads.
 */
Input.prototype.updateGamePads = function() {
    "use strict";

    if (!this.gamepadSupportAvailable || !this.enableGamePads) return;

    // Retrieve all available pads.
    var rawGamepads = (navigator.getGamepads && navigator.getGamepads()) ||
        (navigator.webkitGetGamepads && navigator.webkitGetGamepads());

    var i;
    if (rawGamepads) {
        this.gamepads = [];
        for (i = 0; i < rawGamepads.length; i++) {
            if (rawGamepads[i]) {
                this.gamepads.push(rawGamepads[i]);
            }
        }
    }

    // Set buttons down and up for the pad.
    var k, j;
    for (i = 0; i < this.gamepads.length; i++) {
        var gamepad = this.gamepads[i];
        if (!gamepad) continue;

        var buttons = [];
        // Create a previous state if needed.
        if (!this.gamepadsButtonsPrevious[i]) {
            this.gamepadsButtonsPrevious[i] = [];
            for (j = 0; j < gamepad.buttons.length; j++) {
                this.gamepadsButtonsPrevious[i][j] = 0;
            }
        }
        // Set the buttons to values.
        for (j = 0; j < gamepad.buttons.length; j++) {
            buttons[j] = gamepad.buttons[j].value;
        }
        // Simulate key pressed on gamepad analog.
        if (gamepad.axes[0] < -this.deadZone) {
            buttons[14] = 1;
        } else if (gamepad.axes[0] > this.deadZone) {
            buttons[15] = 1;
        }
        if (gamepad.axes[1] < -this.deadZone) {
            buttons[12] = 1;
        } else if (gamepad.axes[1] > this.deadZone) {
            buttons[13] = 1;
        }
        // Check if a button is pressed based on the last button state.
        for (j = 0; j < buttons.length; j++) {
            var isPressed = false;
            var isUp = false;

            if (this.gamepadsButtonsPrevious[i][j] <= this.deadZone && buttons[j] > this.deadZone) {
                isPressed = true;
            }
            if (this.gamepadsButtonsPrevious[i][j] > this.deadZone && buttons[j] <= this.deadZone) {
                isUp = true;
            }
            var padCode = 'GP' + (i + 1) + '-' + j;
            if (this.forceSingleGamepad) {
                padCode = padName + j;
            }
            if (isPressed) {
                // Handle first press.
                if (!this.keysDown[padCode]) {
                    this.keysJustDown[padCode] = true;
                    this.keysDown[padCode] = true;
                }

                // Update every hotkey.
                if (this.hotkeys[padCode] && this.keysJustDown[padCode]) {
                    for (k = 0; k < this.hotkeys[padCode].length; k++) {
                        this.keysDown[this.hotkeys[padCode][k]] = true;
                        this.keysJustDown[this.hotkeys[padCode][k]] = this.keysJustDown[padCode];
                    }
                }
            }
            if (isUp) {
                // Signal a button is no longer pressed.
                if (this.keysDown[padCode]) {
                    this.keysDown[padCode] = false;
                    this.keysUp[padCode] = true;
                }

                // Update every hotkey.
                if (this.hotkeys[padCode]) {
                    for (k = 0; k < this.hotkeys[padCode].length; k++) {
                        if (this.keysDown[this.hotkeys[padCode][k]]) {
                            this.keysDown[this.hotkeys[padCode][k]] = false;
                            this.keysUp[this.hotkeys[padCode][k]] = true;
                        }
                    }
                }
            }
            // Update the previous pad state.
            this.gamepadsButtonsPrevious[i][j] = buttons[j];
        }
    }
};

/**
 * Cleans up the input system for use with the next update.
 */
Input.prototype.flush = function() {
    "use strict";

    this.isMouseClicked.left = false;
    this.isMouseClicked.middle = false;
    this.isMouseClicked.right = false;
    this.isMouseReleased.left = false;
    this.isMouseReleased.middle = false;
    this.isMouseReleased.right = false;
    this.keysUp = {};
    this.keysJustDown = {};
};

/**
 * Unprojects the mouse inputs to a plane.
 * @param {THREE.Camera} camera the camera to use.
 * @param {THREE.Mesh} plane the plane to use.
 * @returns {{x: number, y: number, z: number}}
 */
Input.prototype.unproject = function(camera, plane) {
    "use strict";

    var x, y, z;
    var vector = new THREE.Vector3(this.mouseX, this.mouseY, 1);
    var projector = new THREE.Projector();
    projector.unprojectVector(vector, camera);
    var raycaster = new THREE.Raycaster();
    raycaster.set(camera.position, vector.sub(camera.position).normalize());
    var intersects = raycaster.intersectObject(plane, false);
    if (intersects.length > 0) {
        var point = intersects[0].point;
        x = point.x;
        y = point.y;
        z = point.z;
    }

    return {x: x, y: y, z: z};
};

/**
 * Adds a hotkey to a key.
 * @param {String} key the key to assign to a hotkey.
 * @param {String} hotkey the hotkey name.
 */
Input.prototype.addHotkey = function(key, hotkey) {
    "use strict";
    if (!this.hotkeys[key]) this.hotkeys[key] = [];

    if (this.hotkeys[key].indexOf(hotkey) === -1) {
        this.hotkeys[key].push(hotkey);
    }
};

/**
 * Removes a key from the hotkey.
 * @param {String} key the key to remove a hotkey from.
 * @param {String} hotkey the hotkey name.
 */
Input.prototype.removeHotkey = function(key, hotkey) {
    "use strict";

    if (this.hotkeys[key]) {
        var index = this.hotkeys[key].indexOf(hotkey);
        if (index !== -1) {
            this.hotkeys[key].splice(index, 1);
        }
    }
};

/**
 * Removes all hotkeys.
 */
Input.prototype.removeAllHotkeys = function() {
    "use strict";

    this.hotkeys = {};
};

/**
 * Prevent default inputs on the element.
 * @param {HTMLElement} element the element to prevent default inputs of.
 */
Input.prototype.disableDefaults = function(element) {
    "use strict";

    // Disable the context menu.
    element.addEventListener('contextmenu', function(e){
        e.preventDefault();
    }, false);
    // Disable scrolling when in canvas.
    function onWheelScroll(e) {
        e.preventDefault();
    }
    element.addEventListener('DOMMouseScroll', function(e){onWheelScroll(e);}, false);
    element.onmousewheel = onWheelScroll;
    // Disable key scrolling.
    element.ownerDocument.addEventListener('keydown', (function(e){
        if (this.focusElement !== this.document) return;
        if ([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
            e.preventDefault();
        }
    }).bind(this), false);
};

/**
 * Converts a character to a key code.
 * @param {String} input the character to convert.
 * @return {Number} the key code.
 */
Input.CharToKeyCode = function(input) {
    "use strict";

    return input.charCodeAt(0);
};

/**
 * Mouse buttons hold the raw input numbers for the mouse.
 * @type {{Left: number, Middle: number, Right: number}}
 */
Input.MouseButtons = {
    Left: 0,
    Middle: 1,
    Right: 2
};

var mouseName = 'MB1-';
/**
 * Mouse codes are used to treat mouse buttons as normal keyboard buttons.
 * @type {{Left: string, Middle: string, Right: string}}
 */
Input.MouseCodes = {
    Left: mouseName + '0',
    Middle: mouseName + '1',
    Right: mouseName + '2'
};

/**
 * Character codes for a key.
 */
Input.CharCodes = {
    Space: 32,
    Left: 37,
    Up: 38,
    Right: 39,
    Down: 40,
    Shift: 16,
    Ctrl: 17,
    Alt: 18,
    Tab: 9,
    CapsLock: 20
};

var padName = 'GP1-';
Input.P1PadCodes = {
    AxisX: padName + 'AX',
    AxisY: padName + 'AY',
    AxisZ: padName + 'AZ',
    Left: padName + 14,
    Up: padName + 12,
    Right: padName + 15,
    Down: padName + 13,
    ButtonLeft: padName + 2,
    ButtonUp: padName + 3,
    ButtonRight: padName + 1,
    ButtonDown: padName + 0,
    L1: padName + 4,
    R1: padName + 5,
    L2: padName + 6,
    R2: padName + 7,
    L3: padName + 10,
    R3: padName + 11,
    Select: padName + 8,
    Start: padName + 9
};

module.exports = Input;
module.exports.MouseButtons = Input.MouseButtons;
module.exports.MouseCodes = Input.MouseCodes;
module.exports.CharCodes = Input.CharCodes;
module.exports.P1PadCodes = Input.P1PadCodes;