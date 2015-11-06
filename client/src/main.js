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
    PIXI.SCALE_MODES.DEFAULT = PIXI.SCALE_MODES.NEAREST;

    function start(resources) {
        var elapsed = {elapsed: 0};
        Debug.Globals.instance.addControl(elapsed, 'elapsed', {listen: true});

        // Create the core to update the main loop
        var core = new Core(window);
        core.updateStepSize = 1000 / 60;
        core.renderStepSize = 1000 / 30;
        core.allowUpdateSkips = true;
        core.allowRenderSkips = true;

        // Intialize the input
        var input = new Input(window, document.getElementById('game'));

        // Initialize and add the renderer
        var layer = new Layer(document.getElementById('game'));
        layer.renderer.backgroundColor = 0xc4cc22;
        core.addRenderLayer(layer);

        // Create the state switcher and add the states
        var stateSwitcher = new StateSwitcher();
        core.addLoopCallback(CoreCallbacks.preRender, stateSwitcher.preRender.bind(stateSwitcher));
        core.addLoopCallback(CoreCallbacks.postRender, stateSwitcher.postRender.bind(stateSwitcher));
        core.addLoopCallback(CoreCallbacks.update, stateSwitcher.update.bind(stateSwitcher));
        var startState = new StartState(layer, input);
        stateSwitcher.addState(startState);
        var gameState = new GameState(layer, input, resources);
        stateSwitcher.addState(gameState);
        var endState = new EndState(layer, input);
        stateSwitcher.addState(endState);
        var botState = new BotState(layer, input);
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
        // Resize game screen
        // var canvas = document.getElementById('game');
        // canvas.style.width = Config.screenWidth * Config.blockWidth * 2 + 'px';
        // canvas.style.height = Config.screenHeight * Config.blockWidth * 2 + 'px';
    }

    var loader = PIXI.loader;
    loader.add('segment-southeast', '/media/images/segment-southeast.png');
    loader.add('segment-southwest', '/media/images/segment-southwest.png');
    loader.add('segment-northeast', '/media/images/segment-northeast.png');
    loader.add('segment-northwest', '/media/images/segment-northwest.png');
    loader.add('segment-horizontal', '/media/images/segment-horizontal.png');
    loader.add('segment-vertical', '/media/images/segment-vertical.png');
    loader.add('head-north', '/media/images/head-north.png');
    loader.add('head-east', '/media/images/head-east.png');
    loader.add('head-south', '/media/images/head-south.png');
    loader.add('head-west', '/media/images/head-west.png');
    loader.add('food', '/media/images/food.png');
    loader.add('screen-pattern', '/media/images/screen-pattern.png');

    loader.load(function(loader, resources) {
        start(resources);
    });
});