// ============================================================================
// PRESET 3: ZERO SYMBOL - REPRESENTING ZERO FEES
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
    TWO_PI,
} from './types';

// ============================================================================
// EASY ADJUSTMENT CONTROLS
// ============================================================================

// Zero Shape Settings
const ZERO_HEIGHT_SCALE = 0.38; // 30% of container as radius (60% as diameter) - leaves 20% padding
const ZERO_ASPECT_RATIO = 0.65; // Width is 65% of height to maintain proper "0" ellipse shape
const ZERO_THICKNESS_SCALE = 0.15; // 10% of container for thickness variation

// 3D Effect Settings
const DEPTH_LAYERS = 8; // Number of depth layers for 3D effect
const DEPTH_RANGE = 100; // Range of simulated Z-depth

// Animation Settings
const ROTATION_SPEED = 0.0002; // Speed of rotation around Y-axis (3D rotation)
const WAVE_SPEED = 0.002; // Speed of wave traveling through the thickness
const WAVE_AMPLITUDE = 6; // How much dots move during wave

// Visual Settings
const BASE_OPACITY = 1; // Base opacity of dots
const DEPTH_OPACITY_RANGE = 1.2; // How much opacity varies with depth (closer = more opaque)

// ============================================================================

/**
 * Calculate positions for 3D zero symbol
 */
export function calculatePositions(
    _width: number,
    _height: number,
    center: CenterPosition,
    responsiveConfig: ResponsiveConfig,
): PresetInitialPositions {
    const positions: PresetInitialPositions = {};
    const dotCount = responsiveConfig.dotCount;
    const dotsPerLayer = Math.floor(dotCount / DEPTH_LAYERS);

    const containerSize = responsiveConfig.containerSize;
    const ZERO_HEIGHT = containerSize * ZERO_HEIGHT_SCALE;
    const ZERO_WIDTH = ZERO_HEIGHT * ZERO_ASPECT_RATIO;
    const ZERO_THICKNESS = containerSize * ZERO_THICKNESS_SCALE;

    let dotIndex = 0;

    const initialRotationAngle = 0;

    for (let layer = 0; layer < DEPTH_LAYERS; layer++) {
        const depthRatio = layer / (DEPTH_LAYERS - 1);
        const z = (depthRatio - 0.5) * DEPTH_RANGE;

        const dotsInLayer =
            layer === DEPTH_LAYERS - 1 ? dotCount - dotIndex : dotsPerLayer;

        for (
            let i = 0;
            i < dotsInLayer && dotIndex < dotCount;
            i++, dotIndex++
        ) {
            const baseAngle = (i / dotsInLayer) * TWO_PI;
            const currentAngle = baseAngle + initialRotationAngle;
            const thicknessOffset = (Math.random() - 0.5) * ZERO_THICKNESS;

            const perspectiveScale = 1 + z / 500;
            const radiusX = (ZERO_WIDTH + thicknessOffset) * perspectiveScale;
            const radiusY = (ZERO_HEIGHT + thicknessOffset) * perspectiveScale;

            const x = Math.cos(currentAngle) * radiusX;
            const y = Math.sin(currentAngle) * radiusY;

            const depthOpacity =
                BASE_OPACITY +
                (0.5 - Math.abs(depthRatio - 0.5)) * DEPTH_OPACITY_RANGE;

            positions[dotIndex] = {
                x: center.x + x,
                y: center.y + y,
                opacity: depthOpacity,
                size: 1,
                color: COLORS.PRIMARY,
                presetData: {
                    baseAngle: baseAngle,
                    thicknessOffset: thicknessOffset,
                    depth: z,
                    depthRatio: depthRatio,
                    layer: layer,
                    zeroWidth: ZERO_WIDTH,
                    zeroHeight: ZERO_HEIGHT,
                    zeroThickness: ZERO_THICKNESS,
                },
            };
        }
    }

    return positions;
}

/**
 * Initialize 3D zero symbol movement data
 */
export function initializeMovement(
    dots: Dot[],
    positions: PresetInitialPositions,
    _width: number,
    _height: number,
    _center: CenterPosition,
    responsiveConfig: ResponsiveConfig,
): void {
    const containerSize = responsiveConfig.containerSize;
    const ZERO_HEIGHT = containerSize * ZERO_HEIGHT_SCALE;
    const ZERO_WIDTH = ZERO_HEIGHT * ZERO_ASPECT_RATIO;
    const ZERO_THICKNESS = containerSize * ZERO_THICKNESS_SCALE;

    const dotCount = responsiveConfig.dotCount;
    const dotsPerLayer = Math.floor(dotCount / DEPTH_LAYERS);
    let dotIndex = 0;

    for (let layer = 0; layer < DEPTH_LAYERS; layer++) {
        const depthRatio = layer / (DEPTH_LAYERS - 1);
        const z = (depthRatio - 0.5) * DEPTH_RANGE;

        const dotsInLayer =
            layer === DEPTH_LAYERS - 1 ? dotCount - dotIndex : dotsPerLayer;

        for (
            let i = 0;
            i < dotsInLayer && dotIndex < dotCount;
            i++, dotIndex++
        ) {
            const dot = dots[dotIndex];
            const posData = positions[dotIndex].presetData || {};

            const angle = (i / dotsInLayer) * TWO_PI;

            dot.presetData = {
                baseAngle:
                    posData.baseAngle !== undefined ? posData.baseAngle : angle,
                depth: posData.depth !== undefined ? posData.depth : z,
                depthRatio:
                    posData.depthRatio !== undefined
                        ? posData.depthRatio
                        : depthRatio,
                layer: posData.layer !== undefined ? posData.layer : layer,
                thicknessOffset:
                    posData.thicknessOffset !== undefined
                        ? posData.thicknessOffset
                        : (Math.random() - 0.5) * ZERO_THICKNESS,
                zeroWidth: ZERO_WIDTH,
                zeroHeight: ZERO_HEIGHT,
                zeroThickness: ZERO_THICKNESS,
            };

            const depthOpacity =
                BASE_OPACITY +
                (0.5 - Math.abs(depthRatio - 0.5)) * DEPTH_OPACITY_RANGE;
            dot.opacity = depthOpacity;
            dot.targetOpacity = depthOpacity;
            dot.targetSize = 1;
            dot.color = COLORS.PRIMARY;
        }
    }
}

/**
 * Update 3D zero symbol animation
 */
export function update(
    dots: Dot[],
    _width: number,
    _height: number,
    center: CenterPosition,
    _responsiveConfig: ResponsiveConfig,
): void {
    const time = Date.now() * ANIMATION_SPEED;

    dots.forEach((dot) => {
        if (!dot.presetData) return;

        const rotationAngle = time * ROTATION_SPEED;
        const currentAngle = dot.presetData.baseAngle + rotationAngle;

        const z = dot.presetData.depth;
        const perspectiveScale = 1 + z / 500;

        const wavePhase = time * WAVE_SPEED;
        const waveOffset =
            Math.sin(
                dot.presetData.baseAngle * 4 +
                    dot.presetData.layer * 0.5 +
                    wavePhase,
            ) * WAVE_AMPLITUDE;

        const ZERO_WIDTH = dot.presetData.zeroWidth;
        const ZERO_HEIGHT = dot.presetData.zeroHeight;

        const radiusX =
            (ZERO_WIDTH + dot.presetData.thicknessOffset + waveOffset) *
            perspectiveScale;
        const radiusY =
            (ZERO_HEIGHT + dot.presetData.thicknessOffset + waveOffset) *
            perspectiveScale;

        const targetX = center.x + Math.cos(currentAngle) * radiusX;
        const targetY = center.y + Math.sin(currentAngle) * radiusY;

        dot.x += (targetX - dot.x) * LERP_SPEED_TRANSITION;
        dot.y += (targetY - dot.y) * LERP_SPEED_TRANSITION;

        const baseDepthOpacity =
            BASE_OPACITY +
            (0.5 - Math.abs(dot.presetData.depthRatio - 0.5)) *
                DEPTH_OPACITY_RANGE;
        const waveIntensity =
            (Math.sin(
                dot.presetData.baseAngle * 4 +
                    dot.presetData.layer * 0.5 +
                    wavePhase,
            ) +
                1) /
            2;
        dot.targetOpacity = baseDepthOpacity * (0.3 + waveIntensity * 0.7);

        dot.opacity += (dot.targetOpacity - dot.opacity) * LERP_SPEED_MEDIUM;
        dot.size += (dot.targetSize - dot.size) * LERP_SPEED_MEDIUM;
    });
}
