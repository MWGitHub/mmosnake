/**
 * Repeating timer that is manually updated.
 */
class Timer {
    /**
     * Creates the timer.
     * @param {number} period the period before the timer becomes ready.
     */
    constructor(period) {
        this.period = period;

        this._currentTime = 0;
    }

    /**
     * Update the timer.
     * @param {number} dt the time to add to the current time.
     */
    update(dt) {
        this._currentTime += dt;
    }

    /**
     * Reset the timer.
     */
    reset() {
        this._currentTime = 0;
    }

    get currentTime() {
        return this._currentTime;
    }

    /**
     * Returns true when the timer is ready.
     * @returns {boolean}
     */
    isReady() {
        return this._currentTime >= this.period;
    }
}

export default Timer;