// ============================================================================
// PRESET 6: VECTOR SPACE WAVE VISUALIZATION (BOTTOM POSITIONED WITH PERSPECTIVE)
// Same as Preset 1 but positioned at the bottom with floor perspective
// ============================================================================

import type {
    Dot,
    PresetInitialPositions,
    CenterPosition,
    ResponsiveConfig,
} from './types';
import {
    LERP_SPEED_MEDIUM,
    LERP_SPEED_TRANSITION,
    COLORS,
    ANIMATION_SPEED,
} from './types';
import { fractalNoise } from './utils/noise';
import {
    calculateWaveHeight,
    calculateMaxWaveHeight,
    type WaveConfig,
} from './utils/wave';
import { calculateGridRows, getGridPosition } from './utils/grid';
import {
    calculateDepthOpacity,
    calculateRowFade,
    clampOpacity,
} from './utils/opacity';

// ============================================================================
// EASY ADJUSTMENT CONTROLS
// ============================================================================

// GRID SETTINGS
const GRID_COLS = 96; // Number of dots horizontally (higher = more horizontal detail)
const PERSPECTIVE_STRENGTH = 2.0; // How strong the perspective effect is (higher = more dramatic)
const GRID_VERTICAL_OFFSET = 0.1; // Vertical offset as percentage of viewport height (0.1 = 10% down)

// WAVE SETTINGS
const WAVE_AMPLITUDE = 40; // Base height of waves (higher = taller waves)
const WAVE_FREQUENCY_X = 0.012; // Primary wave frequency horizontally (higher = more waves across screen)
const WAVE_FREQUENCY_Y = 0.012; // Primary wave frequency vertically (higher = more waves top to bottom)
const WAVE_FREQUENCY_X2 = 0.02; // Secondary wave frequency X (creates complexity)
const WAVE_FREQUENCY_Y2 = 0.01; // Secondary wave frequency Y (creates complexity)
const WAVE_2_AMPLITUDE = 1.2; // Secondary wave strength multiplier (higher = more influence)
const WAVE_3_AMPLITUDE = 1.0; // Tertiary wave strength multiplier (higher = more influence)

// NOISE SETTINGS
const NOISE_SCALE = 0.00001; // Detail level of noise (smaller = more detailed/turbulent)
const NOISE_AMPLITUDE = 25; // How much noise affects the wave (higher = more chaotic)
const NOISE_OCTAVES = 2; // Number of noise layers (higher = more detail, but slower)

// DEPTH & OVERLAP SETTINGS
const Y_OFFSET_MULTIPLIER = 0.5; // How much depth affects vertical position (higher = more overlap between rows)
const X_OFFSET_MULTIPLIER = 0.4; // How much depth affects horizontal position (higher = more horizontal shift)

// OPACITY SETTINGS
const MIN_OPACITY = 0.02; // Minimum dot opacity (0 = invisible, 1 = fully visible)
const MAX_OPACITY = 1.0; // Maximum dot opacity
const OPACITY_MULTIPLIER = 1.5; // Overall opacity boost (higher = brighter overall)
const DEPTH_OPACITY_MIN = 0.02; // Minimum opacity based on depth (prevents dots from disappearing completely)
const DEPTH_OPACITY_POWER = 1; // Depth opacity curve (lower = gentler fade, higher = sharper fade)

export function calculatePositions(
    width: number,
    height: number,
    center: CenterPosition,
    responsiveConfig: ResponsiveConfig,
): PresetInitialPositions {
    const positions: PresetInitialPositions = {};

    const dotCount = responsiveConfig.dotCount;
    const gridCols = responsiveConfig.isMobile
        ? 24
        : responsiveConfig.isTablet
          ? 32
          : GRID_COLS;
    const gridRows = calculateGridRows(dotCount, gridCols);

    const gridHeight = height * 0.35 * responsiveConfig.scaleFactor;
    const bottomOffset = height * 0.05;

    const gridCenterY =
        height - bottomOffset - gridHeight / 2 + height * GRID_VERTICAL_OFFSET;

    const scale_min = 1 / (1 + PERSPECTIVE_STRENGTH);
    const baseSpacing = width / ((gridCols - 1) * scale_min);

    for (let i = 0; i < dotCount; i++) {
        const { col, row } = getGridPosition(i, gridCols);

        const depth = 1 - row / (gridRows - 1);

        const scale = 1 / (1 + depth * PERSPECTIVE_STRENGTH);

        const normalizedX = col / (gridCols - 1) - 0.5;
        const x = center.x + normalizedX * baseSpacing * (gridCols - 1) * scale;

        const y =
            gridCenterY - gridHeight / 2 + (row / (gridRows - 1)) * gridHeight;

        const baseOpacity = calculateRowFade(
            row,
            gridRows,
            MIN_OPACITY,
            MAX_OPACITY,
        );

        positions[i] = {
            x,
            y,
            opacity: baseOpacity,
            size: 1,
            color: COLORS.PRIMARY,
        };
    }

    return positions;
}

export function initializeMovement(
    dots: Dot[],
    positions: PresetInitialPositions,
    _width: number,
    _height: number,
    _center: CenterPosition,
    responsiveConfig: ResponsiveConfig,
): void {
    const gridCols = responsiveConfig.isMobile
        ? 24
        : responsiveConfig.isTablet
          ? 32
          : GRID_COLS;

    for (let i = 0; i < responsiveConfig.dotCount; i++) {
        const dot = dots[i];
        if (positions[i]) {
            dot.targetOpacity = positions[i].opacity;
            dot.targetSize = 1;
            dot.color = positions[i].color;

            const { col, row } = getGridPosition(i, gridCols);
            dot.presetData = {
                gridX: positions[i].x,
                gridY: positions[i].y,
                col,
                row,
                baseOpacity: positions[i].opacity,
            };
        }
    }
}

export function update(
    dots: Dot[],
    _width: number,
    _height: number,
    _center: CenterPosition,
    responsiveConfig: ResponsiveConfig,
    _refs?: any,
): void {
    const time = Date.now() * 0.001 * ANIMATION_SPEED;

    const waveAmplitude = WAVE_AMPLITUDE * responsiveConfig.scaleFactor;

    const waveConfig: WaveConfig = {
        amplitude: waveAmplitude,
        frequencyX: WAVE_FREQUENCY_X,
        frequencyY: WAVE_FREQUENCY_Y,
        frequencyX2: WAVE_FREQUENCY_X2,
        frequencyY2: WAVE_FREQUENCY_Y2,
        amplitude2: WAVE_2_AMPLITUDE,
        amplitude3: WAVE_3_AMPLITUDE,
    };

    const noiseAmplitude = NOISE_AMPLITUDE * responsiveConfig.scaleFactor;
    const maxZ = calculateMaxWaveHeight(waveConfig, noiseAmplitude);

    dots.forEach((dot) => {
        if (dot.presetData?.gridX !== undefined) {
            const { gridX, gridY, baseOpacity } = dot.presetData;

            const noiseValue = fractalNoise(
                gridX * NOISE_SCALE,
                gridY * NOISE_SCALE + time * 0.3,
                NOISE_OCTAVES,
            );
            const noiseOffset = (noiseValue - 0.5) * noiseAmplitude;

            const z = calculateWaveHeight(
                gridX,
                gridY,
                time,
                noiseOffset,
                waveConfig,
            );

            const yOffset = z * Y_OFFSET_MULTIPLIER;
            const xOffset = z * X_OFFSET_MULTIPLIER;

            const targetX = gridX + xOffset;
            const targetY = gridY + yOffset;

            dot.x += (targetX - dot.x) * LERP_SPEED_TRANSITION;
            dot.y += (targetY - dot.y) * LERP_SPEED_TRANSITION;

            const normalizedZ = (z + maxZ) / (maxZ * 2);

            const depthOpacity = calculateDepthOpacity(
                normalizedZ,
                DEPTH_OPACITY_MIN,
                DEPTH_OPACITY_POWER,
            );

            dot.targetOpacity = clampOpacity(
                depthOpacity * OPACITY_MULTIPLIER * (baseOpacity || 1),
                MIN_OPACITY,
                MAX_OPACITY,
            );

            dot.targetSize = 1;
        }

        dot.opacity += (dot.targetOpacity - dot.opacity) * LERP_SPEED_MEDIUM;
        dot.size += (dot.targetSize - dot.size) * LERP_SPEED_MEDIUM;
    });
}
