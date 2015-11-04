"use strict";
import CoreState from '../core/core-state';
import PIXI from 'pixi.js';

class EndState extends CoreState {
    /**
     * Creates the end state.
     * @param window the window to attach input events to.
     * @param {RenderLayer} layer the layer to add children to.
     */
    constructor(window, layer) {
        super();

        this.type = 'EndState';

        this._window = window;
        this._layer = layer;

        this._container = null;

        this._keyDown = this._onKeyDown.bind(this);
    }

    _onKeyDown(e) {
        var key = e.key || e.keyIdentifier || e.keyCode;
        if (key === 'U+0052') {
            this.switcher.switchState(this, this.switcher.retrieveState('GameState'));
        }
    }

    onEnter(options) {
        console.log('entering end state');
        this._container = new PIXI.Container();
        this._layer.addChild(this._container);
        this._window.addEventListener('keydown', this._keyDown);

        var text = new PIXI.Text('Score\n' + options.score + '\npress R to restart', {
            fill: "#FFFFFF",
            align: 'center'
        });
        text.position.x = 60;
        text.position.y = 50;
        this._container.addChild(text);
    }

    onLeave() {
        console.log('leaving end state');
        this._window.removeEventListener('keydown', this._keyDown);

        this._layer.removeChild(this._container);
    }
}

export default EndState;