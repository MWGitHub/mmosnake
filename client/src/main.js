"use strict";
import Core from './core/core';
import StateSwitcher from './core/state-switcher';
import StartState from './game/start-state';
import GameState from './game/game-state';
import EndState from './game/end-state';
import BotState from './game/bot-state';
import Debug from './debug/debug';
import RenderLayer from './pixi/layer';
import Config from '../config.json';
var CoreCallbacks = Core.Callbacks;

document.addEventListener('DOMContentLoaded', function() {
    var elapsed = {elapsed: 0};
    Debug.Globals.instance.addControl(elapsed, 'elapsed', {listen: true});

    // Create the core to update the main loop
    var core = new Core(window);
    core.updateStepSize = 1000 / 15;
    core.renderStepSize = 1000 / 15;

    var layer = new RenderLayer(document.getElementById('game'));
    core.addRenderLayer(layer);

    // Create the state switcher and add the states
    var stateSwitcher = new StateSwitcher();
    core.addLoopCallback(CoreCallbacks.preRender, stateSwitcher.preRender.bind(stateSwitcher));
    core.addLoopCallback(CoreCallbacks.postRender, stateSwitcher.postRender.bind(stateSwitcher));
    core.addLoopCallback(CoreCallbacks.update, stateSwitcher.update.bind(stateSwitcher));
    var startState = new StartState(window, layer);
    stateSwitcher.addState(startState);
    var gameState = new GameState(window, layer);
    stateSwitcher.addState(gameState);
    var endState = new EndState(window, layer);
    stateSwitcher.addState(endState);
    var botState = new BotState(window, layer);
    stateSwitcher.addState(botState);

    stateSwitcher.enterState(startState);

    // Start the main loop
    core.start();
    core.addLoopCallback(CoreCallbacks.postLoop, function(dt) {
        elapsed.elapsed = core.timeElapsed;
    });

    var resizeCanvas = function() {
        /*
        var canvas = document.getElementById('canvas');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        */
        //core.resize(window.innerWidth, window.innerHeight);
        core.resize(Config.screenWidth * Config.blockWidth, Config.screenHeight * Config.blockWidth);
    };
    resizeCanvas();

    //window.addEventListener('resize', resizeCanvas);
});