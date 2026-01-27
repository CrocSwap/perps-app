// ============================================================================
// POOL MOVEMENT UTILITIES
// Shared functions for managing pool-based dot movement patterns
// ============================================================================

import type { Dot } from '../types';
import { LERP_SPEED_TRANSITION } from '../types';

/**
 * Update a dot's position to orbit within a pool
 * @example
 * updatePoolOrbit(
 *   dot,
 *   { x: centerX, y: centerY },
 *   Math.PI / 4, // 45 degree angle
 *   100, // 100px radius
 *   0.05 // lerp speed
 * )
 */
export function updatePoolOrbit(
    dot: Dot,
    poolCenter: { x: number; y: number },
    targetAngle: number,
    targetRadius: number,
    lerpSpeed: number = LERP_SPEED_TRANSITION,
): void {
    const targetX = poolCenter.x + Math.cos(targetAngle) * targetRadius;
    const targetY = poolCenter.y + Math.sin(targetAngle) * targetRadius;

    dot.x += (targetX - dot.x) * lerpSpeed;
    dot.y += (targetY - dot.y) * lerpSpeed;
}

/**
 * Calculate position along a path between two points with perpendicular offset
 * Useful for creating thick streams of traveling dots
 * @example
 * // Simple path position (no offset)
 * const pos = calculateStreamPosition(startPoint, endPoint, 0.5)
 *
 * // Thick stream with perpendicular spread
 * const offset = (Math.random() - 0.5) * 20 // Random offset ±10px
 * const pos = calculateStreamPosition(startPoint, endPoint, 0.5, offset)
 */
export function calculateStreamPosition(
    startPoint: { x: number; y: number },
    endPoint: { x: number; y: number },
    progress: number,
    perpendicularOffset = 0,
): { x: number; y: number } {
    // Calculate position along the path
    const pathX = startPoint.x + (endPoint.x - startPoint.x) * progress;
    const pathY = startPoint.y + (endPoint.y - startPoint.y) * progress;

    // If no offset, return the path position
    if (perpendicularOffset === 0) {
        return { x: pathX, y: pathY };
    }

    // Calculate perpendicular offset for thick stream
    const pathAngle = Math.atan2(
        endPoint.y - startPoint.y,
        endPoint.x - startPoint.x,
    );
    const perpAngle = pathAngle + Math.PI / 2;

    return {
        x: pathX + Math.cos(perpAngle) * perpendicularOffset,
        y: pathY + Math.sin(perpAngle) * perpendicularOffset,
    };
}

/**
 * Smoothly transition a dot's pool center from one location to another
 * @example
 * const newCenter = transitionPoolCenter(
 *   currentCenter,
 *   targetCenter,
 *   0.1 // 10% transition progress
 * )
 */
export function transitionPoolCenter(
    currentCenter: { x: number; y: number },
    targetCenter: { x: number; y: number },
    transitionProgress: number,
): { x: number; y: number } {
    return {
        x:
            currentCenter.x +
            (targetCenter.x - currentCenter.x) * transitionProgress,
        y:
            currentCenter.y +
            (targetCenter.y - currentCenter.y) * transitionProgress,
    };
}
