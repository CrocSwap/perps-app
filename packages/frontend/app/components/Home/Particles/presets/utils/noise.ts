// ============================================================================
// SHARED NOISE UTILITY FUNCTIONS
// Used by multiple presets for generating smooth, organic noise patterns
// ============================================================================

/**
 * Generates a pseudo-random hash value from 2D coordinates
 * @param x - X coordinate
 * @param y - Y coordinate
 * @returns A pseudo-random value between 0 and 1
 * @example
 * const randomValue = hash2D(10, 20) // Returns ~0.7234 (deterministic for same inputs)
 */
export function hash2D(x: number, y: number): number {
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453123;
    return n - Math.floor(n);
}

/**
 * Smooth interpolation function (Hermite interpolation)
 * @param t - Input value between 0 and 1
 * @returns Smoothly interpolated value between 0 and 1
 * @example
 * smoothstep(0) // Returns 0
 * smoothstep(0.5) // Returns 0.5
 * smoothstep(1) // Returns 1
 * // Creates smooth S-curve between 0 and 1
 */
export function smoothstep(t: number): number {
    return t * t * (3 - 2 * t);
}

/**
 * Generates 2D Perlin-like noise
 * @param x - X coordinate in noise space
 * @param y - Y coordinate in noise space
 * @returns Noise value between 0 and 1
 * @example
 * const noise = noise2D(10.5, 20.3) // Returns smooth noise value
 * // Use with time for animation: noise2D(x, y + time * 0.1)
 */
export function noise2D(x: number, y: number): number {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const xf = x - xi;
    const yf = y - yi;

    const a = hash2D(xi, yi);
    const b = hash2D(xi + 1, yi);
    const c = hash2D(xi, yi + 1);
    const d = hash2D(xi + 1, yi + 1);

    const u = smoothstep(xf);
    const v = smoothstep(yf);

    const ab = a * (1 - u) + b * u;
    const cd = c * (1 - u) + d * u;

    return ab * (1 - v) + cd * v;
}

/**
 * Generates fractal (multi-octave) noise for more organic patterns
 * @param x - X coordinate in noise space
 * @param y - Y coordinate in noise space
 * @param octaves - Number of noise layers to combine (default: 4)
 * @returns Normalized fractal noise value between 0 and 1
 * @example
 * // Basic usage with default octaves
 * const noise = fractalNoise(x * 0.01, y * 0.01)
 *
 * // More detail with additional octaves
 * const detailedNoise = fractalNoise(x * 0.01, y * 0.01, 6)
 *
 * // Animated noise field
 * const animatedNoise = fractalNoise(x * 0.01, (y + time) * 0.01, 4)
 */
export function fractalNoise(x: number, y: number, octaves = 4): number {
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
        value += noise2D(x * frequency, y * frequency) * amplitude;
        maxValue += amplitude;
        amplitude *= 0.5;
        frequency *= 2;
    }

    return value / maxValue;
}
