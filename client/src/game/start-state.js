"use strict";
import CoreState from '../core/core-state';
import PIXI from 'pixi.js';

class StartState extends CoreState {
    /**
     * Creates the end state.
     * @param window the window to attach input events to.
     * @param {RenderLayer} layer the layer to add children to.
     */
    constructor(window, layer) {
        super();

        this.type = 'StartState';

        this._window = window;
        this._layer = layer;

        this._container = null;

        this._keyDown = this._onKeyDown.bind(this);
    }

    _onKeyDown(e) {
        var key = e.key || e.keyIdentifier || e.keyCode;
        if (key === 'U+0052') {
            this.switcher.switchState(this, this.switcher.retrieveState('GameState'));
        } else if (key === 'U+0042') {
            console.log('s');
            this.switcher.switchState(this, this.switcher.retrieveState('BotState'));
        }
    }

    onEnter() {
        console.log('entering start state');
        this._container = new PIXI.Container();
        this._layer.addChild(this._container);
        this._window.addEventListener('keydown', this._keyDown);

        var text = new PIXI.Text('press R to start\npress B to enter bot mode', {
            fill: "#FFFFFF",
            align: 'center'
        });
        text.position.x = 2;
        text.position.y = 50;
        this._container.addChild(text);
    }

    update(dt) {
    }

    preRender() {
    }

    onLeave() {
        console.log('leaving start state');
        this._window.removeEventListener('keydown', this._keyDown);

        this._layer.removeChild(this._container);
    }
}

export default StartState;