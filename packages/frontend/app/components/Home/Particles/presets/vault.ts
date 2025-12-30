// ============================================================================
// PRESET 5: HUB AND SPOKE - CENTRALIZED VAULT MANAGEMENT
// Central vault pool facilitating multiple spoke vault pools.
// Shows one professional trading firm managing multiple vaults.
// ============================================================================

import type {
    Dot,
    PresetInitialPositions,
    CenterPosition,
    ResponsiveConfig,
} from './types';
import {
    LERP_SPEED_TRANSITION,
    COLORS,
    RADIUS_CHANGE_PROBABILITY,
    TWO_PI,
} from './types';
import { updatePoolOrbit, calculateStreamPosition } from './utils/pool';

// ============================================================================
// CONFIGURATION
// ============================================================================

const NUM_SPOKE_POOLS = 6; // Number of vault pools around perimeter
const SPOKE_POOL_DISTANCE = 0.38; // Distance from center to spoke pools (as fraction of canvas)
const POOL_MOVEMENT_SPEED = 0.005; // Speed of dots moving within pools

// Dot distribution (as fractions of DOT_COUNT)
const CENTRAL_POOL_FRACTION = 0.2; // 20% in central pool
const SPOKE_POOLS_FRACTION = 0.5; // 50% distributed among spoke pools
const TRAVELERS_FRACTION = 0.3; // 30% traveling between pools
const DOTS_PER_STREAM = 8; // Number of dots traveling together in a stream
const TRAVEL_SPEED = 0.003; // Speed of dots traveling between pools

const POOL_OPACITY = 0.9;
const TRAVELER_OPACITY = 0.6;

// ============================================================================

type DotRole = 'central_pool' | 'spoke_pool' | 'traveler';

interface PoolData {
    role: DotRole;
    poolIndex?: number; // For spoke_pool dots
    targetAngle: number; // Angle within pool
    targetRadius: number; // Radius within pool
    poolCenter?: { x: number; y: number }; // Current pool center

    // For travelers
    targetSpokeIndex?: number; // Which spoke pool to travel to
    travelProgress?: number; // 0 to 1
    isReturning?: boolean; // Traveling to spoke (false) or back to center (true)
    streamOffset?: number; // Perpendicular offset for thick streams
    centralPoolRadius?: number;
    spokePoolRadius?: number;
    streamWidth?: number;
}

/**
 * Calculate initial positions - all dots start in their respective pools
 */
export function calculatePositions(
    _width: number,
    _height: number,
    center: CenterPosition,
    responsiveConfig: ResponsiveConfig,
): PresetInitialPositions {
    const positions: PresetInitialPositions = {};
    let dotIndex = 0;

    const dotCount = responsiveConfig.dotCount;

    const containerSize = responsiveConfig.containerSize;
    const centralPoolRadius = containerSize * 0.11;
    const spokePoolRadius = containerSize * 0.074;
    const streamWidth = containerSize * 0.05;
    const spokeDistance = containerSize * SPOKE_POOL_DISTANCE;

    const numCentralPool = Math.floor(dotCount * CENTRAL_POOL_FRACTION);
    const numTravelers = Math.floor(dotCount * TRAVELERS_FRACTION);
    const remaining = Math.max(0, dotCount - numCentralPool - numTravelers);
    const dotsPerSpokePool = Math.max(
        1,
        Math.floor(remaining / NUM_SPOKE_POOLS),
    );

    // Central pool dots
    for (let i = 0; i < numCentralPool; i++) {
        const angle = Math.random() * TWO_PI;
        const radius = Math.random() * centralPoolRadius;

        positions[dotIndex] = {
            x: center.x + Math.cos(angle) * radius,
            y: center.y + Math.sin(angle) * radius,
            opacity: POOL_OPACITY,
            size: 1,
            color: COLORS.PRIMARY,
            presetData: {
                initialAngle: angle,
                initialRadius: radius,
                centralPoolRadius,
                spokePoolRadius,
                streamWidth,
            },
        };
        dotIndex++;
    }

    // Spoke pool dots
    for (let spokeIdx = 0; spokeIdx < NUM_SPOKE_POOLS; spokeIdx++) {
        const spokeAngle = (spokeIdx / NUM_SPOKE_POOLS) * TWO_PI - Math.PI / 2;
        const spokeCenter = {
            x: center.x + Math.cos(spokeAngle) * spokeDistance,
            y: center.y + Math.sin(spokeAngle) * spokeDistance,
        };

        for (let i = 0; i < dotsPerSpokePool; i++) {
            const angle = Math.random() * TWO_PI;
            const radius = Math.random() * spokePoolRadius;

            positions[dotIndex] = {
                x: spokeCenter.x + Math.cos(angle) * radius,
                y: spokeCenter.y + Math.sin(angle) * radius,
                opacity: POOL_OPACITY,
                size: 1,
                color: COLORS.PRIMARY,
                presetData: {
                    initialAngle: angle,
                    initialRadius: radius,
                    centralPoolRadius,
                    spokePoolRadius,
                    streamWidth,
                },
            };
            dotIndex++;
        }
    }

    // Traveler dots - start at central pool
    for (let i = 0; i < numTravelers; i++) {
        const angle = Math.random() * TWO_PI;
        const radius = Math.random() * centralPoolRadius * 0.5;

        positions[dotIndex] = {
            x: center.x + Math.cos(angle) * radius,
            y: center.y + Math.sin(angle) * radius,
            opacity: TRAVELER_OPACITY,
            size: 1,
            color: COLORS.PRIMARY,
            presetData: {
                centralPoolRadius,
                spokePoolRadius,
                streamWidth,
            },
        };
        dotIndex++;
    }

    return positions;
}

/**
 * Initialize hub and spoke movement
 */
export function initializeMovement(
    dots: Dot[],
    positions: PresetInitialPositions,
    _width: number,
    _height: number,
    center: CenterPosition,
    responsiveConfig: ResponsiveConfig,
): void {
    let dotIndex = 0;

    const dotCount = responsiveConfig.dotCount;

    const containerSize = responsiveConfig.containerSize;
    const centralPoolRadius = containerSize * 0.11;
    const spokePoolRadius = containerSize * 0.074;
    const streamWidth = containerSize * 0.05;
    const spokeDistance = containerSize * SPOKE_POOL_DISTANCE;

    const numCentralPool = Math.floor(dotCount * CENTRAL_POOL_FRACTION);
    const numSpokePoolsTotal = Math.floor(dotCount * SPOKE_POOLS_FRACTION);
    const dotsPerSpokePool = Math.floor(numSpokePoolsTotal / NUM_SPOKE_POOLS);

    for (let i = 0; i < numCentralPool; i++) {
        const dot = dots[dotIndex];
        const posData = positions[dotIndex].presetData || {};

        const poolData: PoolData = {
            role: 'central_pool',
            targetAngle: posData.initialAngle || Math.random() * TWO_PI,
            targetRadius:
                posData.initialRadius || Math.random() * centralPoolRadius,
            poolCenter: center,
            centralPoolRadius,
        };

        dot.presetData = poolData;
        dot.targetOpacity = POOL_OPACITY;
        dot.opacity = POOL_OPACITY;
        dot.targetSize = 1;
        dot.color = COLORS.PRIMARY;
        dotIndex++;
    }

    for (let spokeIdx = 0; spokeIdx < NUM_SPOKE_POOLS; spokeIdx++) {
        const spokeAngle = (spokeIdx / NUM_SPOKE_POOLS) * TWO_PI - Math.PI / 2;
        const spokeCenter = {
            x: center.x + Math.cos(spokeAngle) * spokeDistance,
            y: center.y + Math.sin(spokeAngle) * spokeDistance,
        };

        for (let i = 0; i < dotsPerSpokePool; i++) {
            const dot = dots[dotIndex];
            const posData = positions[dotIndex].presetData || {};

            const poolData: PoolData = {
                role: 'spoke_pool',
                poolIndex: spokeIdx,
                targetAngle: posData.initialAngle || Math.random() * TWO_PI,
                targetRadius:
                    posData.initialRadius || Math.random() * spokePoolRadius,
                poolCenter: spokeCenter,
                spokePoolRadius,
            };

            dot.presetData = poolData;
            dot.targetOpacity = POOL_OPACITY;
            dot.opacity = POOL_OPACITY;
            dot.targetSize = 1;
            dot.color = COLORS.PRIMARY;
            dotIndex++;
        }
    }

    const numTravelers = dotCount - dotIndex;
    for (let i = 0; i < numTravelers; i++) {
        const dot = dots[dotIndex];

        const poolData: PoolData = {
            role: 'traveler',
            targetSpokeIndex: Math.floor(i / DOTS_PER_STREAM) % NUM_SPOKE_POOLS,
            travelProgress: (i % DOTS_PER_STREAM) / DOTS_PER_STREAM,
            isReturning: Math.random() > 0.5,
            streamOffset:
                ((i % DOTS_PER_STREAM) - DOTS_PER_STREAM / 2) *
                (streamWidth / DOTS_PER_STREAM),
            targetAngle: 0,
            targetRadius: 0,
            streamWidth,
        };

        dot.presetData = poolData;
        dot.targetOpacity = TRAVELER_OPACITY;
        dot.opacity = TRAVELER_OPACITY;
        dot.targetSize = 1;
        dot.color = COLORS.PRIMARY;
        dotIndex++;
    }
}

/**
 * Update hub and spoke animation
 */
export function update(
    dots: Dot[],
    _width: number,
    _height: number,
    center: CenterPosition,
    responsiveConfig: ResponsiveConfig,
): void {
    const containerSize = responsiveConfig.containerSize;
    const spokeDistance = containerSize * SPOKE_POOL_DISTANCE;

    const spokePoolCenters: { x: number; y: number }[] = [];
    for (let i = 0; i < NUM_SPOKE_POOLS; i++) {
        const angle = (i / NUM_SPOKE_POOLS) * TWO_PI - Math.PI / 2;
        spokePoolCenters.push({
            x: center.x + Math.cos(angle) * spokeDistance,
            y: center.y + Math.sin(angle) * spokeDistance,
        });
    }

    dots.forEach((dot) => {
        if (!dot.presetData) return;

        const data = dot.presetData as PoolData;

        if (data.role === 'central_pool') {
            const centralPoolRadius =
                data.centralPoolRadius ?? containerSize * 0.11;

            data.targetAngle += POOL_MOVEMENT_SPEED;

            updatePoolOrbit(
                dot,
                center,
                data.targetAngle,
                data.targetRadius,
                LERP_SPEED_TRANSITION,
            );

            if (Math.random() < RADIUS_CHANGE_PROBABILITY) {
                data.targetRadius = Math.random() * centralPoolRadius;
            }

            dot.targetOpacity = POOL_OPACITY;
        } else if (data.role === 'spoke_pool') {
            const spokeCenter = spokePoolCenters[data.poolIndex!];
            const spokePoolRadius =
                data.spokePoolRadius ?? containerSize * 0.074;

            data.targetAngle += POOL_MOVEMENT_SPEED;

            updatePoolOrbit(
                dot,
                spokeCenter,
                data.targetAngle,
                data.targetRadius,
                LERP_SPEED_TRANSITION,
            );

            if (Math.random() < RADIUS_CHANGE_PROBABILITY) {
                data.targetRadius = Math.random() * spokePoolRadius;
            }

            dot.targetOpacity = POOL_OPACITY;
        } else if (data.role === 'traveler') {
            const spokeCenter = spokePoolCenters[data.targetSpokeIndex!];

            if (data.isReturning) {
                data.travelProgress! -= TRAVEL_SPEED;
                if (data.travelProgress! <= 0) {
                    data.travelProgress = 0;
                    data.isReturning = false;
                    data.targetSpokeIndex = Math.floor(
                        Math.random() * NUM_SPOKE_POOLS,
                    );
                }
            } else {
                data.travelProgress! += TRAVEL_SPEED;
                if (data.travelProgress! >= 1) {
                    data.travelProgress = 1;
                    data.isReturning = true;
                }
            }

            const streamPosition = calculateStreamPosition(
                center,
                spokeCenter,
                data.travelProgress!,
                data.streamOffset!,
            );

            dot.x += (streamPosition.x - dot.x) * LERP_SPEED_TRANSITION;
            dot.y += (streamPosition.y - dot.y) * LERP_SPEED_TRANSITION;

            dot.targetOpacity = TRAVELER_OPACITY;
        }

        dot.opacity +=
            (dot.targetOpacity - dot.opacity) * LERP_SPEED_TRANSITION;
        dot.size += (dot.targetSize - dot.size) * LERP_SPEED_TRANSITION;
    });
}
