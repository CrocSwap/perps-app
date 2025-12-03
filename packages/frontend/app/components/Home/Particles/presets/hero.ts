// ============================================================================
// PRESET 1: VECTOR SPACE WAVE VISUALIZATION
// Rows are primary. Columns are derived from the chosen row count.
// ============================================================================

import type {
    Dot,
    PresetInitialPositions,
    CenterPosition,
    ResponsiveConfig,
} from './types';
import { LERP_SPEED_MEDIUM, LERP_SPEED_TRANSITION, COLORS } from './types';
import { fractalNoise } from './utils/noise';
import {
    calculateWaveHeight,
    calculateMaxWaveHeight,
    type WaveConfig,
} from './utils/wave';
// getGridPosition still expects total columns; we now derive columns from rows.
import { getGridPosition } from './utils/grid';
import {
    calculateDepthOpacity,
    calculateCenterFade,
    clampOpacity,
} from './utils/opacity';

// ============================================================================
// EASY ADJUSTMENT CONTROLS
// ============================================================================

// GRID SETTINGS
interface HeroGridSettings {
    rowsBase: number;
    heightScale: number;
    verticalOffset: number;
    tiltAngle: number;
    horizontalOverscan: number;
}

const HERO_GRID_SETTINGS_BASE: HeroGridSettings = {
    rowsBase: 32,
    heightScale: 0.25,
    verticalOffset: 0.2,
    tiltAngle: 45,
    horizontalOverscan: 0.1,
};

const HERO_GRID_SETTINGS_MOBILE: Partial<HeroGridSettings> = {
    rowsBase: 40,
    verticalOffset: 0.1,
    tiltAngle: 45,
    horizontalOverscan: 0.15,
};

// WAVE SETTINGS
const WAVE_AMPLITUDE_SCALE = 0.05; // Wave amplitude as fraction of viewport size (5%)
const WAVE_FREQUENCY_X = 0.012; // Primary wave frequency horizontally (higher = more waves across screen)
const WAVE_FREQUENCY_Y = 0.006; // Primary wave frequency vertically (higher = more waves top to bottom)
const WAVE_FREQUENCY_X2 = 0.02; // Secondary wave frequency X (creates complexity)
const WAVE_FREQUENCY_Y2 = 0.02; // Secondary wave frequency Y (creates complexity)
const WAVE_2_AMPLITUDE = 1.2; // Secondary wave strength multiplier (higher = more influence)
const WAVE_3_AMPLITUDE = 2.0; // Tertiary wave strength multiplier (higher = more influence)
const ANIMATION_SPEED = 0.4; // How fast waves flow (higher = faster movement)

// NOISE SETTINGS
const NOISE_SCALE = 0.00001; // Detail level of noise (smaller = more detailed/turbulent)
const NOISE_AMPLITUDE_SCALE = 0.2; // Noise amplitude as fraction of viewport size (3%)
const NOISE_OCTAVES = 2; // Number of noise layers (higher = more detail, but slower)

// DEPTH & OVERLAP SETTINGS
const Y_OFFSET_MULTIPLIER = 1.5; // How much depth affects vertical position (higher = more overlap between rows)
const X_OFFSET_MULTIPLIER = 0.5; // How much depth affects horizontal position (higher = more horizontal shift)

// OPACITY SETTINGS
const MIN_OPACITY = 0.02; // Minimum dot opacity (0 = invisible, 1 = fully visible)
const MAX_OPACITY = 1; // Maximum dot opacity
const OPACITY_MULTIPLIER = 1; // Overall opacity boost (higher = brighter overall)
const DEPTH_OPACITY_MIN = 0.02; // Minimum opacity based on depth (prevents dots from disappearing completely)
const DEPTH_OPACITY_POWER = 1; // Depth opacity curve (lower = gentler fade, higher = sharper fade)
const CENTER_FADE_POWER = 1; // How quickly opacity fades from center to edges (higher = sharper fade)

function resolveGridSettings(responsive: ResponsiveConfig): HeroGridSettings {
    if (responsive.isMobile) {
        return {
            ...HERO_GRID_SETTINGS_BASE,
            ...HERO_GRID_SETTINGS_MOBILE,
        };
    }
    return HERO_GRID_SETTINGS_BASE;
}

// Helper: derive columns from rows and dot count
function calculateGridCols(dotCount: number, rows: number): number {
    const safeRows = Math.max(1, rows);
    return Math.max(1, Math.ceil(dotCount / safeRows));
}

export function calculatePositions(
    width: number,
    height: number,
    center: CenterPosition,
    responsive: ResponsiveConfig,
): PresetInitialPositions {
    const positions: PresetInitialPositions = {};

    const {
        rowsBase,
        heightScale,
        verticalOffset,
        tiltAngle,
        horizontalOverscan,
    } = resolveGridSettings(responsive);

    // Rows are primary
    const GRID_ROWS = Math.max(
        2,
        Math.floor(rowsBase * responsive.gridDensity),
    );
    const gridCols = calculateGridCols(responsive.dotCount, GRID_ROWS);

    const GRID_HEIGHT = height * heightScale;
    const GRID_WIDTH = width * (1 + horizontalOverscan);
    const GRID_HORIZONTAL_OFFSET = horizontalOverscan / 2;
    const GRID_X_START = -width * GRID_HORIZONTAL_OFFSET;
    const offsetY = height * verticalOffset;

    const tiltRadians = (tiltAngle * Math.PI) / 180;
    const maxTiltOffset = GRID_HEIGHT * Math.tan(tiltRadians);

    for (let i = 0; i < responsive.dotCount; i++) {
        const { col, row } = getGridPosition(i, gridCols);

        // Avoid divide-by-zero when GRID_COLS or GRID_ROWS == 1
        const normalizedX = gridCols > 1 ? col / (gridCols - 1) : 0.5;
        const x = GRID_X_START + normalizedX * GRID_WIDTH;

        const tiltOffset = normalizedX * maxTiltOffset;

        const y =
            (GRID_ROWS > 1
                ? center.y +
                  offsetY -
                  GRID_HEIGHT / 2 +
                  (row / (GRID_ROWS - 1)) * GRID_HEIGHT
                : center.y + offsetY) - tiltOffset;

        positions[i] = {
            x,
            y,
            opacity: 0.6,
            size: 1,
            color: COLORS.PRIMARY,
        };
    }

    return positions;
}

export function initializeMovement(
    dots: Dot[],
    positions: PresetInitialPositions,
    width: number,
    height: number,
    _center: CenterPosition,
    responsive: ResponsiveConfig,
): void {
    const { rowsBase, heightScale, tiltAngle } =
        resolveGridSettings(responsive);

    const GRID_ROWS = Math.max(
        2,
        Math.floor(rowsBase * responsive.gridDensity),
    );
    const gridCols = calculateGridCols(responsive.dotCount, GRID_ROWS);

    const GRID_HEIGHT = height * heightScale;
    const tiltRadians = (tiltAngle * Math.PI) / 180;
    const maxTiltOffset = GRID_HEIGHT * Math.tan(tiltRadians);

    for (let i = 0; i < responsive.dotCount; i++) {
        const dot = dots[i];
        if (positions[i]) {
            dot.targetOpacity = positions[i].opacity;
            dot.targetSize = 1;
            dot.color = positions[i].color;

            const { col, row } = getGridPosition(i, gridCols);

            const tiltOffset = (positions[i].x / width) * maxTiltOffset;

            dot.presetData = {
                gridX: positions[i].x,
                gridY: positions[i].y,
                col,
                row,
                tiltOffset,
            };
        }
    }
}

export function update(
    dots: Dot[],
    width: number,
    height: number,
    _center: CenterPosition,
    responsive: ResponsiveConfig,
    _refs?: any,
): void {
    const time = -Date.now() * 0.001 * ANIMATION_SPEED;

    const minDimension = Math.min(width, height);
    const WAVE_AMPLITUDE = minDimension * WAVE_AMPLITUDE_SCALE;
    const NOISE_AMPLITUDE = minDimension * NOISE_AMPLITUDE_SCALE;

    // Rows primary, derive columns
    const { rowsBase } = resolveGridSettings(responsive);
    const GRID_ROWS = Math.max(
        2,
        Math.floor(rowsBase * responsive.gridDensity),
    );
    const gridCols = calculateGridCols(responsive.dotCount, GRID_ROWS);

    const waveConfig: WaveConfig = {
        amplitude: WAVE_AMPLITUDE,
        frequencyX: WAVE_FREQUENCY_X,
        frequencyY: WAVE_FREQUENCY_Y,
        frequencyX2: WAVE_FREQUENCY_X2,
        frequencyY2: WAVE_FREQUENCY_Y2,
        amplitude2: WAVE_2_AMPLITUDE,
        amplitude3: WAVE_3_AMPLITUDE,
    };

    const maxZ = calculateMaxWaveHeight(waveConfig, NOISE_AMPLITUDE);

    dots.forEach((dot) => {
        if (dot.presetData?.gridX !== undefined) {
            const { gridX, gridY, row } = dot.presetData;

            const noiseValue = fractalNoise(
                gridX * NOISE_SCALE,
                gridY * NOISE_SCALE + time * 0.3,
                NOISE_OCTAVES,
            );
            const noiseOffset = (noiseValue - 0.5) * NOISE_AMPLITUDE;

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
            const centerFade = calculateCenterFade(
                row,
                GRID_ROWS,
                CENTER_FADE_POWER,
            );

            dot.targetOpacity = clampOpacity(
                depthOpacity * centerFade * OPACITY_MULTIPLIER,
                MIN_OPACITY,
                MAX_OPACITY,
            );
        }

        dot.opacity += (dot.targetOpacity - dot.opacity) * LERP_SPEED_MEDIUM;
        dot.size += (dot.targetSize - dot.size) * LERP_SPEED_MEDIUM;
    });
}
