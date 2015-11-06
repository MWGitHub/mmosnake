/**
 * @author MW
 * Filter for spacing texture pixels.
 */

import PIXI from 'pixi.js';

function PixelFilter() {
    'use strict';
    PIXI.AbstractFilter.call(this,
        null,
        [
            'precision mediump float;',
            'uniform vec4 dimensions;',
            'varying vec2 vTextureCoord;',
            'varying vec4 vColor;',
            'uniform sampler2D uSampler;',
            'uniform float x;',
            'uniform float y;',

            'void main(void) {',
            '   vec4 color = texture2D(uSampler, vTextureCoord);',
            '   color.r = color.r * r;',
            '   color.g = color.g * g;',
            '   color.b = color.b * b;',
            '   gl_FragColor = color;',
            '}'
        ].join('\n'),
        {
            x: {type: '1f', value: 1.0},
            y: {type: '1f', value: 1.0}
        }
    );
}
PixelFilter.prototype = Object.create(PIXI.AbstractFilter.prototype);
PixelFilter.prototype.constructor = OverlayFilter;

/**
 * Sets the color for the overlay.
 * @param {number} x the x spacing.
 * @param {number} y the y spacing.
 */
PixelFilter.prototype.setSpacing = function(x, y) {
    'use strict';

    this.uniforms.x.value = x;
    this.uniforms.y.value = y;
};

export default PixelFilter;