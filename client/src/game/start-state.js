"use strict";
import CoreState from '../core/core-state';
import Input from '../core/input';
import PIXI from 'pixi.js';

class StartState extends CoreState {
    /**
     * Creates the end state.
     * @param {RenderLayer} layer the layer to add children to.
     * @param {Input} input the input to attach events to.
     * @param resources
     */
    constructor(layer, input, resources) {
        super();

        this.type = 'StartState';

        this._input = input;
        this._layer = layer;
        this._resources = resources;

        this._container = null;
    }

    onEnter() {
        console.log('entering start state');
        this._container = new PIXI.Container();
        this._layer.addChild(this._container);

        var text = new PIXI.Text('Press R to start\nPress B to enter bot mode', {
            fill: "#000000",
            align: 'center'
        });
        text.position.x = 2;
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
        } else if (this._input.keysJustDown[Input.CharToKeyCode('B')]) {
            this.switcher.switchState(this, this.switcher.retrieveState('BotState'));
        }
    }

    preRender() {
    }

    onLeave() {
        console.log('leaving start state');

        this._layer.removeChild(this._container);
    }
}

export default StartState;