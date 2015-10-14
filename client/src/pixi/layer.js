"use strict";

import RenderLayer from '../core/render-layer';

/**
 * Pixi rendering layer which will use WebGL.
 */
class PixiRenderLayer extends RenderLayer {
    /**
     * Creates a pixi renderer.
     * @param {HTMLElement} element the element to attach the renderer to.
     */
    constructor(element) {
        super();

        /**
         * Renderer for the layer.
         * @type {PIXI.WebGLRenderer}
         * @private
         */
        this._renderer = new PIXI.WebGLRenderer(100, 100);

        /**
         * Stage to add objects to.
         * @type {PIXI.DisplayObjectContainer}
         */
        this.stage = new PIXI.Container();

        // Add the renderer to the element.
        element.appendChild(this._renderer.view);
    }

    /**
     * Render the layer.
     * @param {number} dt the render step size.
     */
    render(dt) {
        this._renderer.render(this.stage);
    }

    /**
     * Resize the renderer.
     * @param {number} width the width to set to.
     * @param {number} height the height to set to.
     */
    resize(width, height) {
        this._renderer.resize(width, height);
    }
}


export default PixiRenderLayer;