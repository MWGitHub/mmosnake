"use strict";
import Core from './core/core';
import StateSwitcher from './core/state-switcher';
import dat from 'dat-gui';
import GameState from './game/game-state';
var CoreCallbacks = Core.Callbacks;

function resizeCanvas() {
    var canvas = document.getElementById('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

document.addEventListener('DOMContentLoaded', function() {
    var gui = new dat.GUI();
    var debug = {elapsed: 0};
    gui.add(debug, 'elapsed').listen();

    var core = new Core(window);
    core.start();
    core.addLoopCallback(CoreCallbacks.postLoop, function(dt) {
        debug.elapsed = core.timeElapsed;
    });
    var stateSwitcher = new StateSwitcher();
    core.addLoopCallback(CoreCallbacks.preRender, stateSwitcher.preRender.bind(stateSwitcher));
    core.addLoopCallback(CoreCallbacks.postRender, stateSwitcher.postRender.bind(stateSwitcher));
    core.addLoopCallback(CoreCallbacks.update, stateSwitcher.update.bind(stateSwitcher));
    var gameState = new GameState(stateSwitcher);
    stateSwitcher.addState(gameState);
    stateSwitcher.enterState(gameState);

    resizeCanvas();
});

window.addEventListener('resize', resizeCanvas);