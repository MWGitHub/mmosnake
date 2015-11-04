"use strict";
/**
 * Represents a camera.
 */
class Camera {
    constructor() {
        /**
         * Position of the camera.
         */
        this.position = {x: 0, y: 0};

        /**
         * Rotation in radians.
         */
        this.rotation = 0;

        /**
         * Scale for the camera.
         */
        this.scale = {x: 1.0, y: 1.0};
    }
}

export default Camera;