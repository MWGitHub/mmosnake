import RenderLayer from '../core/render-layer';

/**
 * Pixi rendering layer.
 */
class Layer extends RenderLayer {
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
         * @type {PIXI.DisplayObject}
         */
        this._stage = new PIXI.Container();
    }

    /**
     * Render the layer.
     * @param {number} dt the render step size.
     */
    render(dt) {
        this._renderer.render(this._stage);
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
        this._stage.addChild(child);
    }

    /**
     * Removes a child from the layer.
     * @param child the child to remove from the layer.
     */
    removeChild(child) {
        this._stage.removeChild(child);
    }

    /**
     * Retrieves the renderer.
     * @returns {PIXI.WebGLRenderer}
     */
    get renderer() {
        return this._renderer;
    }
}


export default Layer;