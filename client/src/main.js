"use strict";
import Core from './core/core';
import Input from './core/input';
import StateSwitcher from './core/state-switcher';
import StartState from './game/start-state';
import GameState from './game/game-state';
import EndState from './game/end-state';
import BotState from './game/bot-state';
import Debug from './debug/debug';
import Layer from './pixi/layer';
import Config from '../config.json';
import PIXI from 'pixi.js';
var CoreCallbacks = Core.Callbacks;

document.addEventListener('DOMContentLoaded', function() {
    function start(resources) {
        var elapsed = {elapsed: 0};
        Debug.Globals.instance.addControl(elapsed, 'elapsed', {listen: true});

        // Create the core to update the main loop
        var core = new Core(window);
        core.updateStepSize = 1000 / 60;
        core.renderStepSize = 1000 / 60;
        core.allowUpdateSkips = true;
        core.allowRenderSkips = true;

        // Intialize the input
        var input = new Input(window, document.getElementById('game'));

        // Initialize and add the renderer
        var layer = new Layer(document.getElementById('game'));
        core.addRenderLayer(layer);

        // Create the state switcher and add the states
        var stateSwitcher = new StateSwitcher();
        core.addLoopCallback(CoreCallbacks.preRender, stateSwitcher.preRender.bind(stateSwitcher));
        core.addLoopCallback(CoreCallbacks.postRender, stateSwitcher.postRender.bind(stateSwitcher));
        core.addLoopCallback(CoreCallbacks.update, stateSwitcher.update.bind(stateSwitcher));
        var startState = new StartState(window, layer);
        stateSwitcher.addState(startState);
        var gameState = new GameState(layer, input, resources);
        stateSwitcher.addState(gameState);
        var endState = new EndState(window, layer);
        stateSwitcher.addState(endState);
        var botState = new BotState(window, layer);
        stateSwitcher.addState(botState);

        stateSwitcher.enterState(startState);

        // Start the main loop
        core.start();
        core.addLoopCallback(CoreCallbacks.preUpdate, function(dt) {
            input.update();
        });
        core.addLoopCallback(CoreCallbacks.postUpdate, function(dt) {
            input.flush();
        });
        core.addLoopCallback(CoreCallbacks.postLoop, function(dt) {
            elapsed.elapsed = core.timeElapsed;
        });
        core.resize(Config.screenWidth * Config.blockWidth, Config.screenHeight * Config.blockWidth);
    }

    var loader = PIXI.loader;
    loader.add('segment-southeast', '/media/images/segment-southeast.png');
    loader.add('segment-southwest', '/media/images/segment-southwest.png');
    loader.add('segment-northeast', '/media/images/segment-northeast.png');
    loader.add('segment-northwest', '/media/images/segment-northwest.png');
    loader.add('segment-horizontal', '/media/images/segment-horizontal.png');
    loader.add('segment-vertical', '/media/images/segment-vertical.png');

    loader.load(function(loader, resources) {
        console.log(resources);
        start(resources);
    });
});