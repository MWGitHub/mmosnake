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
}

export default RenderLayer;