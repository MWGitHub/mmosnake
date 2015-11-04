import PIXI from 'pixi.js';

/**
 * Represents a scene for the viewport.
 */
class ViewportScene {
    constructor() {
        /**
         * Display used for updating with the camera.
         * @type {PIXI.Container}
         */
        this._display = new PIXI.Container();

        /**
         * True to lock the scene to no longer be scrollable.
         * @type {boolean}
         */
        this.isLocked = false;
    }

    /**
     * Retrieves the display to attach children to.
     * @returns {PIXI.Container}
     */
    get display() {
        return this._display;
    }
}

/**
 * Floors all displays and children positions.
 * @param {PIXI.DisplayObjectContainer|PIXI.DisplayObject} display the display to floor.
 */
function floorDisplays(display) {
    display.position.x = Math.floor(display.position.x);
    display.position.y = Math.floor(display.position.y);

    if (display instanceof PIXI.Container) {
        for (var i = 0; i < display.children.length; i++) {
            floorDisplays(display.children[i]);
        }
    }
}

/**
 * @author MW
 * Represents a viewport for pixi with a single camera.
 * A viewport is not shown until added to a displayable object such as stage.
 * Any scenes added to the viewport will change parents to the viewport's display object.
 * If a width and height is provided the viewport will center at the halves.
 */
class Viewport {
    /**
     * Creates a viewport.
     * @param {Camera} camera the camera to use with the scenes.
     * @param {Number} width the width of the viewport.
     * @param {Number} height the height of the viewport.
     */
    constructor(camera, width, height) {
        /**
         * Main display of the viewport.
         * @type {PIXI.Container}
         */
        this._display = new PIXI.Container();

        /**
         * Scenes for the viewport.
         * @type {Array.<ViewportScene>}
         */
        this._scenes = [];

        /**
         * Camera to use for offsetting the scenes.
         * @type {Camera}
         */
        this.camera = camera;

        /**
         * Width of the viewport.
         * @type {number}
         */
        this.width = width;

        /**
         * Height of the viewport.
         * @type {number}
         */
        this.height = height;

        /**
         * True to floor the camera.
         * @type {boolean}
         */
        this.isFloored = true;
    }

    /**
     * Retrieves the calculated camera X position.
     * @returns {number}
     */
    getCalculatedCameraX() {
        var x = -this.camera.position.x * this.camera.scale.x + this.width / 2;
        if (this.isFloored) {
            return Math.floor(x);
        } else {
            return x;
        }
    }
    
    /**
     * Retrieves the calculated camera Y position.
     * @returns {number}
     */
    getCalculatedCameraY() {
        var y = -this.camera.position.y * this.camera.scale.y + this.height / 2;
        if (this.isFloored) {
            return Math.floor(y);
        } else {
            return y;
        }
    }

    /**
     * Updates the viewport.
     */
    update() {
        if (!this.camera) return;
    
        // Update the view properties.
        for (var i = 0; i < this._scenes.length; i++) {
            var scene = this._scenes[i];
            var display = scene.display;
            display.position.x = this.getCalculatedCameraX();
            display.position.y = this.getCalculatedCameraY();
            display.scale.x = this.camera.scale.x;
            display.scale.y = this.camera.scale.y;
            display.rotation = this.camera.rotation;
    
            if (scene.isLocked) {
                display.position.x = this.width / 2;
                display.position.y = this.height / 2;
            }
        }
    }
    
    /**
     * Add a scene to the viewport.
     * Scenes added will have their parent changed to the viewport display.
     * @param {ViewportScene} scene the scene to add.
     */
    addScene(scene) {
        this._display.addChild(scene.display);
        this._scenes.push(scene);
    }
    
    /**
     * Remove a scene from the viewport.
     * Scenes removed will no longer have a parent.
     * @param {ViewportScene} scene the scene to remove.
     */
    removeScene(scene) {
        this._display.removeChild(scene.display);
        var index = this._scenes.indexOf(scene);
        if (index !== -1) {
            this._scenes.splice(index, 1);
        }
    }

    /**
     * Adds the viewport to a container.
     * @param {PIXI.Container} container the container to add to.
     */
    addTo(container) {
        container.addChild(this._display);
    }

    /**
     * Removes the viewport from the parent.
     */
    removeFromParent() {
        if (this._display.parent) {
            this._display.parent.removeChild(this._display);
        }
    }
}

export default Viewport;
export {Viewport, ViewportScene};