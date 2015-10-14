"use strict";
/**
 * Create the state.
 * @constructor
 */
class CoreState {
    constructor() {
        /**
         * Name of the state used for switching and retrieval.
         * @type {string}
         */
        this.type = 'default';

        /**
         * Switcher for switching states.
         * @type {StateSwitcher}
         */
        this.switcher = null;
    }

    /**
     * Runs when the state is added to a switcher.
     * @param {{}=} params parameters to pass on the add.
     */
    onAdd(params) {
    }

    /**
     * Runs when the state is entered.
     * @param {{}=} params parameters to pass on entering.
     */
    onEnter(params) {
    }

    /**
     * Updates the state.
     * @param {Number} dt the time between updates in ms.
     */
    update(dt) {
    }

    /**
     * Updates before rendering.
     * @param {Number} dt the time between updates in ms.
     */
    preRender(dt) {
    }

    /**
     * Updates after rendering.
     * @param {Number} dt the time between updates in ms.
     */
    postRender(dt) {
    }

    /**
     * Runs when the state is left.
     * @param {{}=} params parameters to pass on leaving.
     */
    onLeave(params) {
    }

    /**
     * Runs when the state is removed from a switcher.
     * @param {{}=} params parameters to pass on leaving.
     */
    onRemove(params) {
    }
}

export default CoreState;