"use strict";
/**
 * Represents a viewport for pixi.
 * A viewport is not shown until added to a displayable object such as stage.
 * Any scenes added to the viewport will change parents to the viewport's display object.
 * If a width and height is provided the viewport will center at the halves.
 */
class Viewport {
    /**
     * Creates a viewport.
     * @param {Camera} camera the camera to use with the scenes.
     */
    constructor(camera) {
        /**
         * Main display of the viewport.
         * @type {PIXI.DisplayObjectContainer}
         */
        this.display = new PIXI.DisplayObjectContainer();

        /**
         * Camera to use for offsetting the scenes.
         * @type {Camera}
         */
        this.camera = camera;

        /**
         * Width of the viewport.
         * @type {number}
         */
        this.width = 0;

        /**
         * Height of the viewport.
         * @type {number}
         */
        this.height = 0;
    }

    /**
     * Updates the viewport.
     */
    update() {
        if (!this.camera) return;
        // Update the view properties.
        this.display.position.x = Math.floor(-this.camera.position.x * this.camera.scale.x + this.width / 2);
        this.display.position.y = Math.floor(-this.camera.position.y * this.camera.scale.y + this.height / 2);
        this.display.scale.x = this.camera.scale.x;
        this.display.scale.y = this.camera.scale.y;
        this.display.rotation = this.camera.rotation;
    }

    /**
     * Add a scene to the viewport.
     * @param {PIXI.DisplayObjectContainer} scene the scene to add.
     */
    addScene(scene) {
        this.display.addChild(scene);
    }

    /**
     * Remove a scene from the viewport.
     * @param {PIXI.DisplayObjectContainer} scene the scene to remove.
     */
    removeScene(scene) {
        this.display.removeChild(scene);
    }

    /**
     * Add the viewport to the given object.
     * @param {PIXI.DisplayObjectContainer} object the object to add to.
     */
    addTo(object) {
        object.addChild(this.display);
    }

    /**
     * Remove the viewport from its parent.
     */
    removeFromParent() {
        if (this.display.parent) this.display.parent.removeChild(this.display);
    }
}

export default Viewport;
