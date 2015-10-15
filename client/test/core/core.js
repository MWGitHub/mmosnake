"use strict";
import Core from '../../src/core/core';
import chai from 'chai';
import jsdom from 'jsdom';

var assert = chai.assert;

describe('core', function() {
    var doc;
    var window;
    beforeEach(function() {
        doc = jsdom.jsdom('../../index.html');
        window = doc.defaultView;
    });

    it('should create with the given window', function() {
        var core = new Core(window);

        assert.ok(core);
    });

    it('should throw an error when no window is given', function() {
        assert.throw(()=>{new Core()});
    });

    it('should start and stop', function(done) {
        var core = new Core(window);

        assert.isFalse(core.isRunning);

        core.addLoopCallback(Core.Callbacks.postLoop, () => {
            assert.isTrue(core.isRunning);
            core.stop();
            assert.isFalse(core.isRunning);
            done();
        });

        core.start();
    });

    it('should run the update callbacks', function(done) {
        var core = new Core(window);

        var count = 0;
        var types = Core.Callbacks;
        for (var key in types) {
            if (!types.hasOwnProperty(key)) continue;

            if (types[key] === Core.Callbacks.postLoop) {
                core.addLoopCallback(Core.Callbacks.postLoop, (dt) => {
                    count++;
                    assert.equal(count, 7);
                    core.stop();
                    assert.isFalse(core.isRunning);
                    done();
                });
            } else {
                core.addLoopCallback(types[key], (dt) => {
                    count++;
                });
            }
        }

        core.start();
    });

    it('should update in steps', function(done) {
        var core = new Core(window);
        core.updateStepSize = 20;
        core.renderStepSize = 10;

        var renderCount = 0;
        core.addLoopCallback(Core.Callbacks.postRender, () => {
            renderCount++;
        });

        core.addLoopCallback(Core.Callbacks.postLoop, () => {
            if (core.timeElapsed < 15) {
                assert.equal(core.timeElapsed, core.updateStepSize);
            } else if (core.timeElapsed > 65) {
                assert.equal(core.timeElapsed, 80);
                assert.equal(renderCount, 7);
                core.stop();
                done();
            }
        });

        core.start();
    });
});