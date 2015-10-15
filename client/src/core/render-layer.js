"use strict";

/**
 * Base class for render layers.
 */
class RenderLayer {
    constructor() {

    }

    /**
     * Renders the layer.
     * @param {Number} dt time between updates.
     */
    render(dt) {}

    /**
     * Resizes the rendering layer.
     * @param {Number} width the width of the layer.
     * @param {Number} height the height of the layer.
     */
    resize(width, height) {};

    /**
     * Adds a child to the layer.
     * @param child the child to add to the layer.
     */
    addChild(child) {};

    /**
     * Removes a child from the layer.
     * @param child the child to remove from the layer.
     */
    removeChild(child) {};

    /**
     * Retrieve the renderer used for the layer.
     * @returns {*} the renderer.
     */
    get renderer() {
        return null;
    };
}

export default RenderLayer;