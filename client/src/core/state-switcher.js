"use strict";

import _ from 'lodash';

/**
 * Updates and switches states.
 */
class StateSwitcher {
    constructor() {
        /**
         * States that can be switched to.
         * @type {Array.<CoreState>}
         * @private
         */
        this._states = [];

        /**
         * Currently active states that update in add order.
         * @type {Array.<CoreState>}
         * @private
         */
        this._activeStates = [];
    }

    /**
     * Update all the active states.
     * @param {Number} dt the time between frames.
     */
    update(dt) {
        for (var i = 0; i < this._activeStates.length; i++) {
            this._activeStates[i].update(dt);
        }
    }

    /**
     * Calls pre-render on all states.
     * @param {Number} dt the time between frames.
     */
    preRender(dt) {
        for (var i = 0; i < this._activeStates.length; i++) {
            this._activeStates[i].preRender(dt);
        }
    }

    /**
     * Calls post-render on all states.
     * @param {Number} dt the time between frames.
     */
    postRender(dt) {
        for (var i = 0; i < this._activeStates.length; i++) {
            this._activeStates[i].postRender(dt);
        }
    }

    /**
     * Adds a state to the switcher.
     * @param {CoreState} state the state to add.
     * @param {{}=} params parameters to pass to the state.
     */
    addState(state, params) {
        if (!_.includes(this._states, state)) {
            this._states.push(state);
            if (!state.switcher) {
                state.switcher = this;
            }
            state.onAdd(params);
        }
    }

    /**
     * Remove a state from the switcher.
     * A removed state must not be active.
     * @param {CoreState} state the state to remove.
     * @param {{}=} params parameters to pass to the state.
     * @returns {Boolean} true if the state has been removed.
     */
    removeState(state, params) {
        if (_.includes(this._activeStates, state)) return false;

        state.onRemove(params);
        _.pull(this._states, state);

        return true;
    }

    /**
     * Retrieves the first state found by name or null if none found.
     * @param {String} name the name of the state to retrieve.
     * @returns {CoreState} the state or null if none found.
     */
    retrieveState(name) {
        for (var i = 0; i < this._states.length; i++) {
            var state = this._states[i];
            if (state.type === name) {
                return state;
            }
        }

        return null;
    }

    /**
     * Switches a state with another state.
     * Both states must already be valid states to switch to and the state to switch must be active.
     * @param {CoreState} state the state to switch out.
     * @param {CoreState} newState the state to switch in to replace in the array.
     * @param {{}=} leaveParams the parameters to input for the left state.
     * @param {{}=} enterParams the parameters to input for the entering state.
     * @returns {Boolean} true if the state has been switched to.
     */
    switchState(state, newState, leaveParams, enterParams) {
        var index = this._activeStates.indexOf(state);

        // Check if invalid state to switch to.
        if (index < 0) return false;
        if (this._states.indexOf(newState) < 0) return false;

        state.onLeave(leaveParams);
        this._activeStates[index] = newState;
        newState.onEnter(enterParams);

        return true;
    }

    /**
     * Adds a state to the end of the active states.
     * The state must be a valid state and must not be active.
     * @param {CoreState} state the state to push in.
     * @param {{}=} enterParams optional parameters to pass to enter.
     * @returns {Boolean} true if the state has been entered.
     */
    enterState(state, enterParams) {
        if (!_.includes(this._states, state)) return false;
        if (_.includes(this._activeStates, state)) return false;

        this._activeStates.push(state);
        state.onEnter(enterParams);

        return true;
    }

    /**
     * Leaves a state and removes it from the active states.
     * The state must be a valid state and must be active.
     * @param {CoreState} state the state to leave.
     * @param {{}=} leaveParams optional parameters to pass to leave.
     * @returns {Boolean} true if the state has been left.
     */
    leaveState(state, leaveParams) {
        if (!_.includes(this._states, state)) return false;

        var index = this._activeStates.indexOf(state);
        if (index === -1) return false;

        state.onLeave(leaveParams);
        this._activeStates.splice(index, 1);

        return true;
    }
}

export default StateSwitcher;