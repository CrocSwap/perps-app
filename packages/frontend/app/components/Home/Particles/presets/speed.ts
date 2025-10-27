// ============================================================================
// PRESET 2: LIGHTNING BOLT FIELD  — dynamic SVG path sampling
// ============================================================================
//
// EASY ADJUSTMENT CONTROLS:
// - Tweak BOLT_SAMPLES for polygon fidelity
// - Tune EDGE_WEIGHT to prioritize outlining vs interior filling
// - Modify jitter/flicker constants for motion profiles
//
// ============================================================================

import type {
    Dot,
    PresetInitialPositions,
    CenterPosition,
    ResponsiveConfig,
} from './types';
import { LERP_SPEED_SLOW, LERP_SPEED_TRANSITION, COLORS } from './types';

// ---------------------------------------------------------------------------
// Geometry configuration
// ---------------------------------------------------------------------------

interface Vector2 {
    x: number;
    y: number;
}

// Source SVG path and viewBox
const BOLT_PATH =
    'M14.7249 0H6.36488L5.16688 4.804H1.55688L0.0388764 10.898C-0.00832338 11.0864 -0.0120135 11.2831 0.0280858 11.4732C0.0681851 11.6633 0.151022 11.8418 0.270319 11.9951C0.389616 12.1484 0.542244 12.2725 0.716639 12.3581C0.891033 12.4437 1.08262 12.4884 1.27688 12.489H4.33288L1.46588 24L11.2099 13.691C11.9809 12.875 11.4049 11.529 10.2849 11.529H5.62488L7.05988 5.764H14.9229L15.9609 1.592C16.0082 1.40358 16.0121 1.20684 15.9721 1.01672C15.9322 0.826586 15.8494 0.648047 15.7302 0.494632C15.611 0.341217 15.4585 0.21695 15.2841 0.13125C15.1097 0.0455505 14.9182 0.000666465 14.7239 0Z';

const VIEWBOX_W = 16;
const VIEWBOX_H = 24;
const BOLT_SAMPLES = 600; // increase for denser outline and tighter fill

const MAX_SAMPLE_ATTEMPTS = 20000;
const EDGE_WEIGHT = 0.0; // Portion of dots dedicated to outlining the bolt
const EDGE_SAMPLES_PER_SEGMENT = 4; // Higher = denser outline
const JITTER_RADIUS_MIN = 2;
const JITTER_RADIUS_MAX = 16;
const FLICKER_SPEED_MIN = 1.5;
const FLICKER_SPEED_MAX = 3.5;
const FLICKER_INTENSITY = 1;
const BASE_OPACITY = 0;
const WIDTH_SCALE = 0.65; // relative to responsive container size
const HEIGHT_SCALE = WIDTH_SCALE * 1.4; // bolt is taller than it is wide
const ROTATION_AMPLITUDE_DEG = 5; // max tilt left/right
const ROTATION_SPEED = 0.5;
const PERSPECTIVE_SKEW = 0.12; // how much perspective distortion to apply at peak rotation
const PERSPECTIVE_EASING = 2.2; // higher = perspective snaps back faster than rotation
const DEPTH_SWAY_FRACTION = 0.02; // vertical bob while rotating

// ---------------------------------------------------------------------------
// SVG path → polygon sampler (memoized per session)
// ---------------------------------------------------------------------------

let _boltPolygonMemo: ReadonlyArray<Vector2> | null = null;

function getBoltPolygon(): ReadonlyArray<Vector2> {
    if (_boltPolygonMemo) return _boltPolygonMemo;

    // Use real DOM path APIs; assumes browser environment.
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    const path = document.createElementNS(ns, 'path');
    path.setAttribute('d', BOLT_PATH);
    svg.appendChild(path);
    // no need to attach to document; path geometry works off-DOM in modern browsers

    const len = path.getTotalLength();
    const pts: Vector2[] = [];
    for (let i = 0; i < BOLT_SAMPLES; i++) {
        const p = path.getPointAtLength((i / BOLT_SAMPLES) * len);
        pts.push({ x: p.x / VIEWBOX_W, y: p.y / VIEWBOX_H });
    }
    _boltPolygonMemo = pts;
    return _boltPolygonMemo;
}

// ---------------------------------------------------------------------------
// Geometry utils
// ---------------------------------------------------------------------------

function pointInPolygon(
    point: Vector2,
    polygon: ReadonlyArray<Vector2>,
): boolean {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x;
        const yi = polygon[i].y;
        const xj = polygon[j].x;
        const yj = polygon[j].y;

        const intersect =
            yi > point.y !== yj > point.y &&
            point.x <
                ((xj - xi) * (point.y - yi)) / (yj - yi + Number.EPSILON) + xi;

        if (intersect) inside = !inside;
    }
    return inside;
}

function interpolate(a: Vector2, b: Vector2, t: number): Vector2 {
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

function generateOutlinePoints(
    polygon: ReadonlyArray<Vector2>,
    count: number,
): Vector2[] {
    const outline: Vector2[] = [];
    const segments = polygon.length;
    const samplesPerSegment = Math.max(1, Math.floor(count / segments));
    for (let i = 0; i < segments; i++) {
        const start = polygon[i];
        const end = polygon[(i + 1) % segments];
        for (let s = 0; s < samplesPerSegment; s++) {
            const t = s / Math.max(1, samplesPerSegment - 1);
            outline.push(interpolate(start, end, t));
        }
    }
    return outline;
}

function sampleInteriorPoint(polygon: ReadonlyArray<Vector2>): Vector2 {
    let attempts = 0;
    while (attempts++ < MAX_SAMPLE_ATTEMPTS) {
        const candidate = { x: Math.random(), y: Math.random() };
        if (pointInPolygon(candidate, polygon)) return candidate;
    }
    return { x: 0.5, y: 0.5 }; // fallback
}

// ---------------------------------------------------------------------------
// Placement
// ---------------------------------------------------------------------------

/**
 * Calculate initial bolt positions
 */
export function calculatePositions(
    _width: number,
    _height: number,
    center: CenterPosition,
    responsive: ResponsiveConfig,
): PresetInitialPositions {
    const polygon = getBoltPolygon();

    const positions: PresetInitialPositions = {};
    const totalDots = responsive.dotCount;
    const outlineTarget = Math.floor(totalDots * EDGE_WEIGHT);
    const size = responsive.containerSize;
    const halfWidth = (size * WIDTH_SCALE) / 2;
    const halfHeight = (size * HEIGHT_SCALE) / 2;

    let placed = 0;

    // Outline
    const outlinePoints = generateOutlinePoints(
        polygon,
        outlineTarget * EDGE_SAMPLES_PER_SEGMENT,
    );
    for (
        let i = 0;
        placed < Math.min(totalDots, outlineTarget) && i < outlinePoints.length;
        i++
    ) {
        const point = outlinePoints[i];
        const worldX = center.x + (point.x - 0.5) * 2 * halfWidth;
        const worldY = center.y + (point.y - 0.5) * 2 * halfHeight;

        positions[placed] = {
            x: worldX,
            y: worldY,
            opacity: BASE_OPACITY + 0.15,
            size: 1,
            color: COLORS.PRIMARY,
            presetData: {
                normX: point.x,
                normY: point.y,
            },
        };
        placed++;
    }

    // Interior
    while (placed < totalDots) {
        const interiorPoint = sampleInteriorPoint(polygon);
        const worldX = center.x + (interiorPoint.x - 0.5) * 2 * halfWidth;
        const worldY = center.y + (interiorPoint.y - 0.5) * 2 * halfHeight;

        positions[placed] = {
            x: worldX,
            y: worldY,
            opacity: BASE_OPACITY + Math.random() * 0.1,
            size: 1,
            color: COLORS.PRIMARY,
            presetData: {
                normX: interiorPoint.x,
                normY: interiorPoint.y,
            },
        };
        placed++;
    }

    return positions;
}

/**
 * Initialize lightning bolt animation metadata
 */
export function initializeMovement(
    dots: Dot[],
    positions: PresetInitialPositions,
    _width: number,
    _height: number,
    _center: CenterPosition,
    _responsive: ResponsiveConfig,
): void {
    dots.forEach((dot, i) => {
        const position = positions[i];
        if (!position) return;

        dot.color = position.color;
        dot.targetOpacity = position.opacity;
        dot.targetSize = position.size;

        dot.presetData = {
            baseX: position.x,
            baseY: position.y,
            jitterRadius:
                JITTER_RADIUS_MIN +
                Math.random() * (JITTER_RADIUS_MAX - JITTER_RADIUS_MIN),
            jitterAngle: Math.random() * Math.PI * 2,
            flickerSpeed:
                FLICKER_SPEED_MIN +
                Math.random() * (FLICKER_SPEED_MAX - FLICKER_SPEED_MIN),
            phase: Math.random() * Math.PI * 2,
            normX: position.presetData?.normX ?? 0.5,
            normY: position.presetData?.normY ?? 0.5,
        };
    });
}

/**
 * Update lightning bolt animation
 */
export function update(
    dots: Dot[],
    _width: number,
    _height: number,
    center: CenterPosition,
    responsive: ResponsiveConfig,
    _refs?: Record<string, never>,
): void {
    const time = performance.now() * 0.001;
    const rotationPhase = time * ROTATION_SPEED;
    const rotationRadians =
        (Math.sin(rotationPhase) * ROTATION_AMPLITUDE_DEG * Math.PI) / 180;
    const perspectiveMix = Math.pow(
        Math.abs(Math.sin(rotationPhase)),
        PERSPECTIVE_EASING,
    );
    const skewAmount = perspectiveMix * PERSPECTIVE_SKEW;
    const swayAmplitude = responsive.containerSize * DEPTH_SWAY_FRACTION;

    dots.forEach((dot) => {
        const data = dot.presetData;
        if (!data) return;

        const size = responsive.containerSize;
        const halfWidth = (size * WIDTH_SCALE) / 2;
        const halfHeight = (size * HEIGHT_SCALE) / 2;
        const baseX = center.x + ((data.normX ?? 0.5) - 0.5) * 2 * halfWidth;
        const baseY = center.y + ((data.normY ?? 0.5) - 0.5) * 2 * halfHeight;
        data.baseX = baseX;
        data.baseY = baseY;
        const oscillation = Math.sin(time * data.flickerSpeed + data.phase);
        const jitter = Math.sin(
            time * data.flickerSpeed * 1.3 + data.phase * 1.7,
        );
        const depthSway =
            Math.sin(rotationPhase + (data.normX ?? 0.5)) * swayAmplitude;
        const relativeX = (data.normX ?? 0.5) - 0.5;
        const relativeY = (data.normY ?? 0.5) - 0.5;
        const rotatedX =
            relativeX * Math.cos(rotationRadians) -
            relativeY * Math.sin(rotationRadians);
        const rotatedY =
            relativeX * Math.sin(rotationRadians) +
            relativeY * Math.cos(rotationRadians);
        const perspectiveX = rotatedX + skewAmount * rotatedY;
        const perspectiveY = rotatedY;
        const twistX = perspectiveX - relativeX;
        const twistY = perspectiveY - relativeY;
        const scaleFactor = responsive.containerSize * WIDTH_SCALE;
        const twistOffsetX = twistX * scaleFactor;
        const twistOffsetY =
            twistY * scaleFactor * (HEIGHT_SCALE / WIDTH_SCALE);

        const targetX =
            data.baseX + oscillation * data.jitterRadius * 0.25 + twistOffsetX;
        const targetY =
            data.baseY +
            jitter * data.jitterRadius * 0.5 +
            twistOffsetY +
            depthSway;

        dot.x += (targetX - dot.x) * LERP_SPEED_TRANSITION;
        dot.y += (targetY - dot.y) * LERP_SPEED_TRANSITION;

        dot.targetOpacity =
            BASE_OPACITY + FLICKER_INTENSITY * Math.max(0, oscillation + 0.5);
        dot.opacity += (dot.targetOpacity - dot.opacity) * LERP_SPEED_SLOW;
        dot.targetSize = 1;
    });
}
