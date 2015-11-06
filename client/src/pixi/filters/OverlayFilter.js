/**
 * @author MW
 * Filter for overlaying a color over a texture.
 */

import PIXI from 'pixi.js';

function OverlayFilter() {
    'use strict';
    PIXI.AbstractFilter.call(this,
        null,
        [
            'precision mediump float;',
            'varying vec2 vTextureCoord;',
            'varying vec4 vColor;',
            'uniform sampler2D uSampler;',
            'uniform float r;',
            'uniform float g;',
            'uniform float b;',

            'void main(void) {',
            '   vec4 color = texture2D(uSampler, vTextureCoord);',
            '   color.r = color.r * r;',
            '   color.g = color.g * g;',
            '   color.b = color.b * b;',
            '   gl_FragColor = color;',
            '}'
        ].join('\n'),
        {
            r: {type: '1f', value: 1.0},
            g: {type: '1f', value: 1.0},
            b: {type: '1f', value: 1.0}
        }
    );
}
OverlayFilter.prototype = Object.create(PIXI.AbstractFilter.prototype);
OverlayFilter.prototype.constructor = OverlayFilter;

/**
 * Sets the color for the overlay.
 * @param {Number} r the red multiplier.
 * @param {Number} g the green multiplier.
 * @param {Number} b the blue multiplier.
 */
OverlayFilter.prototype.setColor = function(r, g, b) {
    'use strict';

    this.uniforms.r.value = r;
    this.uniforms.g.value = g;
    this.uniforms.b.value = b;
};

export default OverlayFilter;