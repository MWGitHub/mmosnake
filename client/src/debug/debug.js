"use strict";
import _ from 'lodash';
import dat from 'dat-gui';

class Debug {
    constructor() {
        /**
         * Debug GUI.
         * @type {dat.GUI}
         */
        this._gui = new dat.GUI();

        /**
         * Folders for the gui.
         * @dict
         */
        this._folders = {};

        // Add a default folder
        this._folders.debug = this._gui.addFolder('Debug');
        this._folders.debug.open();
    }

    /**
     * Adds a control to the gui.
     * @param {*} object the object containing the variable.
     * @param {string} variable the name of the variable.
     * @param {Object} options the folder to place the control in.
     * options = {
     *  folder: String,
     *  listen: Boolean,
     *  step: Number,
     *  min: Number,
     *  max: Number,
     *  name: String
     * }
     */
    addControl(object, variable, options) {
        var folder;
        options = options || {};
        if (!options.folder) {
            folder = this._folders.debug;
        } else {
            // Create new folder if none exists
            if (!(this._folders[options.folder])) {
                this._folders[options.folder] = this._gui.addFolder(options.folder);
            }
            folder = this._folders[options.folder];
            folder.open();
        }
        var controller = folder.add(object, variable);
        if (options.name) controller.name(options.name);
        if (options.min) controller.min(options.min);
        if (options.max) controller.max(options.max);
        if (options.step) controller.step(options.step);
        if (options.listen) controller.listen();
    }
}

/**
 * User created global debug values and a default debug instance.
 * @type {{instance: Debug}}
 * @dict
 */
Debug.Globals = {
    instance: new Debug()
};

module.exports = Debug;