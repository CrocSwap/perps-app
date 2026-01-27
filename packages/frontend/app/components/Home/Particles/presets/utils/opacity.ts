// ============================================================================
// OPACITY CALCULATION UTILITIES
// Shared opacity calculation functions for animated dots presets
// ============================================================================

/**
 * Calculate depth-based opacity with power curve
 * @param normalizedDepth - Depth value between 0 and 1 (0 = far, 1 = near)
 * @param minOpacity - Minimum opacity to prevent complete invisibility
 * @param power - Curve exponent (higher = sharper fade)
 * @returns Opacity value between minOpacity and 1
 * @example
 * // Linear fade
 * const opacity = calculateDepthOpacity(0.5, 0.1, 1) // Returns 0.5
 *
 * // Sharp fade (dots stay bright until they're far away)
 * const opacity = calculateDepthOpacity(0.5, 0.1, 3) // Returns 0.125
 */
export function calculateDepthOpacity(
    normalizedDepth: number,
    minOpacity: number,
    power = 1,
): number {
    return Math.pow(Math.max(minOpacity, normalizedDepth), power);
}

/**
 * Calculate center fade based on distance from center
 * @param position - Current position in the sequence
 * @param totalPositions - Total number of positions
 * @param power - Fade curve power (higher = sharper fade from center)
 * @returns Fade multiplier between 0 and 1
 * @example
 * // Gentle fade from center to edges
 * const fade = calculateCenterFade(10, 20, 2) // Center position, gentle fade
 *
 * // Sharp fade (only center is bright)
 * const fade = calculateCenterFade(10, 20, 5) // Sharp falloff
 */
export function calculateCenterFade(
    position: number,
    totalPositions: number,
    power = 3,
): number {
    const distanceFromCenter =
        Math.abs(position - totalPositions / 2) / (totalPositions / 2);
    return 1 - Math.pow(distanceFromCenter, power);
}

/**
 * Calculate row-based fade (for floor-like effects)
 * @param row - Current row index
 * @param totalRows - Total number of rows
 * @param minOpacity - Minimum opacity (furthest row)
 * @param maxOpacity - Maximum opacity (nearest row)
 * @returns Opacity value between minOpacity and maxOpacity
 * @example
 * // Floor fade: row 0 (far) is dim, last row (near) is bright
 * const opacity = calculateRowFade(0, 24, 0.2, 1.0) // Returns 0.2 (far)
 * const opacity = calculateRowFade(23, 24, 0.2, 1.0) // Returns 1.0 (near)
 */
export function calculateRowFade(
    row: number,
    totalRows: number,
    minOpacity: number,
    maxOpacity: number,
): number {
    const rowFade = row / (totalRows - 1);
    return minOpacity + rowFade * (maxOpacity - minOpacity);
}

/**
 * Clamp opacity to valid range
 * @param opacity - Input opacity value
 * @param min - Minimum allowed opacity
 * @param max - Maximum allowed opacity
 * @returns Clamped opacity value
 * @example
 * clampOpacity(1.5, 0, 1) // Returns 1.0
 * clampOpacity(-0.2, 0, 1) // Returns 0.0
 * clampOpacity(0.5, 0, 1) // Returns 0.5
 */
export function clampOpacity(opacity: number, min = 0, max = 1): number {
    return Math.max(min, Math.min(max, opacity));
}
