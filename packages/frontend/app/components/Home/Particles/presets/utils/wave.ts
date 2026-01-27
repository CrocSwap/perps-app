// ============================================================================
// WAVE CALCULATION UTILITIES
// Shared wave calculation functions for presets
// ============================================================================

export interface WaveConfig {
    amplitude: number;
    frequencyX: number;
    frequencyY: number;
    frequencyX2: number;
    frequencyY2: number;
    amplitude2: number;
    amplitude3: number;
}

/**
 * Calculates the combined wave height (z-value) for a given grid position and time
 * Uses three overlapping sine/cosine waves for complex, organic movement
 * @example
 * const config = {
 *   amplitude: 40,
 *   frequencyX: 0.012,
 *   frequencyY: 0.012,
 *   frequencyX2: 0.02,
 *   frequencyY2: 0.01,
 *   amplitude2: 1.2,
 *   amplitude3: 1.0
 * }
 * const height = calculateWaveHeight(100, 200, time, noiseOffset, config)
 */
export function calculateWaveHeight(
    gridX: number,
    gridY: number,
    time: number,
    noiseOffset: number,
    config: WaveConfig,
): number {
    // Primary wave - main undulation pattern
    const wave1 =
        Math.sin(gridX * config.frequencyX + time) *
        Math.cos(gridY * config.frequencyY + time * 0.7) *
        config.amplitude;

    // Secondary wave - adds complexity and variation
    const wave2 =
        Math.sin(gridX * config.frequencyX2 + time * 1.3) *
        Math.cos(gridY * config.frequencyY2 + time * 0.5) *
        config.amplitude *
        config.amplitude2;

    // Tertiary wave - fine detail and turbulence
    const wave3 =
        Math.sin(gridX * 0.005 + gridY * 0.008 + time * 0.8) *
        config.amplitude *
        config.amplitude3;

    return wave1 + wave2 + wave3 + noiseOffset;
}

/**
 * Calculates the maximum possible Z value for normalization
 * Used to convert wave heights to 0-1 range for opacity calculations
 * @example
 * const maxZ = calculateMaxWaveHeight(waveConfig, 25)
 * const normalizedHeight = (actualHeight + maxZ) / (maxZ * 2) // Now between 0 and 1
 */
export function calculateMaxWaveHeight(
    config: WaveConfig,
    noiseAmplitude: number,
): number {
    return (
        config.amplitude * (1 + config.amplitude2 + config.amplitude3) +
        noiseAmplitude / 2
    );
}
