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
        this._renderer = new PIXI.WebGLRenderer(100, 100, {view: element});

        /**
         * Stage to add objects to.
         * @type {PIXI.DisplayObjectContainer}
         */
        this.stage = new PIXI.Container();

        // Add the renderer to the element.
        //element.appendChild(this._renderer.view);
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

    /**
     * Adds a child to the layer.
     * @param child the child to add to the layer.
     */
    addChild(child) {
        this.stage.addChild(child);
    }

    /**
     * Removes a child from the layer.
     * @param child the child to remove from the layer.
     */
    removeChild(child) {
        this.stage.removeChild(child);
    }

    /**
     * Retrieve the renderer.
     * @returns {PIXI.WebGLRenderer}
     */
    get renderer() {
        return this._renderer;
    }
}


export default PixiRenderLayer;