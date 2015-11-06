"use strict";
import CoreState from '../core/core-state';
import Input from '../core/input';
import PIXI from 'pixi.js';

class EndState extends CoreState {
    /**
     * Creates the end state.
     * @param {RenderLayer} layer the layer to add children to.
     * @param {Input} input the input to attach events to.
     * @param resources
     */
    constructor(layer, input, resources) {
        super();

        this.type = 'EndState';

        this._layer = layer;
        this._input = input;
        this._resources = resources;

        this._container = null;
    }

    onEnter(options) {
        console.log('entering end state');
        this._container = new PIXI.Container();
        this._layer.addChild(this._container);

        var text = new PIXI.Text('Score\n' + options.score + '\nPress R to restart', {
            fill: "#000000",
            align: 'center'
        });
        text.position.x = 60;
        text.position.y = 50;
        this._container.addChild(text);

        var overlayScreen = new PIXI.Sprite(this._resources['screen-pattern'].texture);
        overlayScreen.position.x = 0;
        overlayScreen.position.y = 0;
        this._container.addChild(overlayScreen);
    }

    update(dt) {
        if (this._input.keysJustDown[Input.CharToKeyCode('R')]) {
            this.switcher.switchState(this, this.switcher.retrieveState('GameState'));
        }
    }

    onLeave() {
        console.log('leaving end state');

        this._layer.removeChild(this._container);
    }
}

export default EndState;