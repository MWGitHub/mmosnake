'use strict';
import Timer from '../../src/util/timer';
import chai from 'chai';
import jsdom from 'jsdom';

var assert = chai.assert;

describe('timer', function() {
    it('should be able to change settings', function() {
        var timer = new Timer(1000);
        assert.equal(timer.currentTime, 0);
        assert.equal(timer.period, 1000);
        assert.notOk(timer.isReady());
    });

    it('should be ready when time passes', function() {
        var timer = new Timer(1000);
        assert.notOk(timer.isReady());
        timer.update(500);
        assert.equal(timer.currentTime, 500);
        assert.notOk(timer.isReady());

        timer.update(500);
        assert.ok(timer.isReady());

        timer.update(500);
        assert.ok(timer.isReady());
        timer.reset();

        assert.notOk(timer.isReady());
        timer.update(999);
        assert.notOk(timer.isReady());
        timer.update(2);
        assert.ok(timer.isReady());
    });

    it('should reset properly', function() {
        var timer = new Timer(1000);
        timer.update(500);
        assert.notOk(timer.isReady());
        timer.update(500);
        assert.ok(timer.isReady());

        timer.reset();
        assert.notOk(timer.isReady());
        timer.update(999);
        assert.notOk(timer.isReady());
        timer.update(2);
        assert.ok(timer.isReady());
    });
});