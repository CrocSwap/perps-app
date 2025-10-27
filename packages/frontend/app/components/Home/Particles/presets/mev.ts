// ============================================================================
// PRESET 4: MEV PROTECTION (ON-CHAIN PERPS EXCHANGE)
// Two pools of traders exchange back and forth in the center (trading activity).
// Attacker dots (MEV bots) try to enter but get deflected by orbital defense.
// Shows active MEV protection keeping trades safe.
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
    RADIUS_CHANGE_PROBABILITY,
    TWO_PI,
} from './types';
import { updatePoolOrbit, transitionPoolCenter } from './utils/pool';

// ============================================================================
// EASY ADJUSTMENT CONTROLS
// ============================================================================

// Trading Pools Configuration (as fractions of DOT_COUNT)
const POOL_A_FRACTION = 0.34; // Portion of dots assigned to pool A
const POOL_B_FRACTION = 0.34; // Portion of dots assigned to pool B
const POOL_MOVEMENT_SPEED = 0.005; // Angular velocity for pool orbiting traders
const CROSS_POOL_SPEED = 0.0015; // Interpolation speed when traders switch pools
const CROSS_POOL_PERCENTAGE = 0.05; // Chance per trader to begin crossing pools
const POOL_SEPARATION_FRACTION = 0.24; // Distance between pool centers vs container
const POOL_RADIUS_FRACTION = 0.09; // Pool radius vs container size

// Trader settings
const TRADER_SIZE = 1.0; // Renderer size for trader dots
const TRADER_OPACITY_MIN = 0.3; // Lowest trader opacity in pool noise sampling
const TRADER_OPACITY_MAX = 1.0; // Highest trader opacity in pool noise sampling
const CROSS_POOL_TRADER_OPACITY = 0.5; // Opacity applied while a trader is crossing pools

// Defense settings
const DEFENSE_SIZE = 1.0; // Renderer size for defense ring dots
const MIN_ORBIT_RADIUS_FRACTION = 0.24; // Defense ring radius vs container size
const DEFENSE_ORBIT_SPEED = 0.001; // Angular speed of defense dots around center
const DEFENSE_OPACITY_MIN = 0.8; // Minimum opacity for orbiting defense dots
const DEFENSE_OPACITY_MAX = 1.0; // Maximum opacity for orbiting defense dots

// Attacker settings
const ATTACKER_FRACTION = 0.305; // Portion of dots allocated to attacker behavior
const ATTACKER_SPAWN_RADIUS_FRACTION = 0.4; // Outer attacker band radius vs container
const ATTACKER_SIZE = 1.0; // Renderer size for attacker dots
const ATTACKER_SPEED = 0.003; // Radial lerp speed when attackers charge the center
const ATTACKER_WAIT_OPACITY_MIN = 0.2; // Minimum opacity while attackers idle in the ring
const ATTACKER_WAIT_OPACITY_MAX = 1; // Maximum opacity while attackers idle in the ring
const ATTACKER_OPACITY_MIN = 0.2; // Minimum opacity during the attack phase
const ATTACKER_OPACITY_MAX = 0.5; // Maximum opacity during the attack phase
const ATTACKER_RING_RADIUS_MIN = 0.98; // Inner bound multiplier for spawn radius jitter
const ATTACKER_RING_RADIUS_MAX = 1.02; // Outer bound multiplier for spawn radius jitter
const ATTACKER_IDLE_JITTER_RATIO = 0.06; // Percentage of radius used for idle jitter amplitude
const ATTACKER_IDLE_JITTER_SPEED_MIN = 0.0002; // Slowest jitter speed for idle attackers
const ATTACKER_IDLE_JITTER_SPEED_MAX = 0.001; // Fastest jitter speed for idle attackers
const ORBIT_ANGLE_PROGRESSION = 0.5; // Multiplier converting defense speed to attacker orbit speed
const ATTACKER_RESPAWN_DELAY = 0; // Time attackers remain hidden after deflection (ms)
const ATTACKER_ATTACK_DURATION = 50000; // Duration window for staggering initial attacks (ms)
const ATTACKER_ORBIT_SPEED_MIN_FACTOR = 1; // Slowest multiplier for attacker orbit speed
const ATTACKER_ORBIT_SPEED_MAX_FACTOR = 3; // Fastest multiplier for attacker orbit speed
const DEFLECTION_DISTANCE_FRACTION = 0.0; // Additional radius for deflected attackers
const ATTACKER_TARGET_ATTACKING = 0.1; // Desired attackers actively attacking (<=1 treated as fraction of total)
const ATTACKER_TARGET_WAITING = 0.9; // Desired attackers idling in the ring (<=1 treated as fraction of total)

// Colors - all white/grey
const TRADER_COLOR = COLORS.PRIMARY;
const DEFENSE_COLOR = COLORS.PRIMARY;
const ATTACKER_COLOR = COLORS.PRIMARY;

// ============================================================================

function sampleAttackerRingRadius(baseRadius: number): number {
    const ratio =
        ATTACKER_RING_RADIUS_MIN +
        Math.random() * (ATTACKER_RING_RADIUS_MAX - ATTACKER_RING_RADIUS_MIN);
    return baseRadius * ratio;
}

function sampleIdleJitterSpeed(): number {
    return (
        ATTACKER_IDLE_JITTER_SPEED_MIN +
        Math.random() *
            (ATTACKER_IDLE_JITTER_SPEED_MAX - ATTACKER_IDLE_JITTER_SPEED_MIN)
    );
}

function sampleAttackerOrbitSpeed(baseSpeed: number): number {
    const min = baseSpeed * ATTACKER_ORBIT_SPEED_MIN_FACTOR;
    const max = baseSpeed * ATTACKER_ORBIT_SPEED_MAX_FACTOR;
    return min + Math.random() * (max - min);
}

function sampleBetween(min: number, max: number): number {
    return min + Math.random() * (max - min);
}

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

function resolveAttackerQuota(target: number, total: number): number {
    if (total <= 0 || target <= 0) {
        return 0;
    }

    const resolved =
        target <= 1 ? Math.round(total * target) : Math.round(target);
    return Math.max(0, Math.min(total, resolved));
}

/**
 * Calculate initial positions - traders in two fixed pools, defense orbits, attackers outside
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
    const poolSeparation = containerSize * POOL_SEPARATION_FRACTION;
    const poolRadius = containerSize * POOL_RADIUS_FRACTION;
    const minOrbitRadius = containerSize * MIN_ORBIT_RADIUS_FRACTION;
    const deflectionDistance = containerSize * DEFLECTION_DISTANCE_FRACTION;
    const attackerSpawnRadius = containerSize * ATTACKER_SPAWN_RADIUS_FRACTION;

    const numAttackers = Math.floor(dotCount * ATTACKER_FRACTION);
    const numDefense =
        dotCount -
        Math.floor(dotCount * POOL_A_FRACTION) -
        Math.floor(dotCount * POOL_B_FRACTION) -
        numAttackers;

    const poolACenter = { x: center.x - poolSeparation / 2, y: center.y };
    const poolBCenter = { x: center.x + poolSeparation / 2, y: center.y };

    // Pool A traders (left side) - randomly distributed within pool
    for (let i = 0; i < Math.floor(dotCount * POOL_A_FRACTION); i++) {
        const angle = Math.random() * TWO_PI;
        const radius = Math.random() * poolRadius;
        const baseOpacity = sampleBetween(
            TRADER_OPACITY_MIN,
            TRADER_OPACITY_MAX,
        );

        positions[dotIndex] = {
            x: poolACenter.x + Math.cos(angle) * radius,
            y: poolACenter.y + Math.sin(angle) * radius,
            opacity: baseOpacity,
            size: TRADER_SIZE,
            color: TRADER_COLOR,
            presetData: {
                initialAngle: angle,
                initialRadius: radius,
                baseOpacity,
                poolRadius,
                minOrbitRadius,
                deflectionDistance,
                attackerSpawnRadius,
                poolSeparation,
            },
        };
        dotIndex++;
    }

    // Pool B traders (right side) - randomly distributed within pool
    for (let i = 0; i < Math.floor(dotCount * POOL_B_FRACTION); i++) {
        const angle = Math.random() * TWO_PI;
        const radius = Math.random() * poolRadius;
        const baseOpacity = sampleBetween(
            TRADER_OPACITY_MIN,
            TRADER_OPACITY_MAX,
        );

        positions[dotIndex] = {
            x: poolBCenter.x + Math.cos(angle) * radius,
            y: poolBCenter.y + Math.sin(angle) * radius,
            opacity: baseOpacity,
            size: TRADER_SIZE,
            color: TRADER_COLOR,
            presetData: {
                initialAngle: angle,
                initialRadius: radius,
                baseOpacity,
                poolRadius,
                minOrbitRadius,
                deflectionDistance,
                attackerSpawnRadius,
                poolSeparation,
            },
        };
        dotIndex++;
    }

    // Defense orbiting dots - single ring
    for (let i = 0; i < numDefense; i++) {
        const angle = (i / numDefense) * TWO_PI;
        const defenseOpacity = sampleBetween(
            DEFENSE_OPACITY_MIN,
            DEFENSE_OPACITY_MAX,
        );

        positions[dotIndex] = {
            x: center.x + Math.cos(angle) * minOrbitRadius,
            y: center.y + Math.sin(angle) * minOrbitRadius,
            opacity: defenseOpacity,
            size: DEFENSE_SIZE,
            color: DEFENSE_COLOR,
            presetData: {
                minOrbitRadius,
            },
        };
        dotIndex++;
    }

    // Attacker dots - start outside the protection ring
    for (let i = 0; i < numAttackers; i++) {
        const angle = Math.random() * TWO_PI;
        const spawnRadius = sampleAttackerRingRadius(attackerSpawnRadius);
        const waitOpacity = sampleBetween(
            ATTACKER_WAIT_OPACITY_MIN,
            ATTACKER_WAIT_OPACITY_MAX,
        );
        const attackOpacity = sampleBetween(
            ATTACKER_OPACITY_MIN,
            ATTACKER_OPACITY_MAX,
        );

        positions[dotIndex] = {
            x: center.x + Math.cos(angle) * spawnRadius,
            y: center.y + Math.sin(angle) * spawnRadius,
            opacity: waitOpacity,
            size: ATTACKER_SIZE,
            color: ATTACKER_COLOR,
            presetData: {
                initialAngle: angle,
                spawnRadius,
                baseRingRadius: attackerSpawnRadius,
                waitOpacity,
                attackOpacity,
                minOrbitRadius,
                deflectionDistance,
            },
        };
        dotIndex++;
    }

    return positions;
}

/**
 * Initialize MEV protection animation
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
    const poolSeparation = containerSize * 0.24;
    const poolRadius = containerSize * 0.07;
    const minOrbitRadius = containerSize * 0.24;
    const deflectionDistance = containerSize * 0.16;
    const attackerSpawnRadius = containerSize * 0.4;

    const poolACenter = { x: center.x - poolSeparation / 2, y: center.y };
    const poolBCenter = { x: center.x + poolSeparation / 2, y: center.y };

    // Pool A traders
    for (let i = 0; i < Math.floor(dotCount * POOL_A_FRACTION); i++) {
        const dot = dots[dotIndex];
        const posData = positions[dotIndex].presetData || {};

        dot.targetOpacity = positions[dotIndex].opacity;
        dot.targetSize = positions[dotIndex].size;
        dot.color = positions[dotIndex].color;

        const isCrossPoolTrader = Math.random() < CROSS_POOL_PERCENTAGE;

        dot.presetData = {
            type: 'trader',
            pool: 'A',
            poolCenter: poolACenter,
            targetAngle: posData.initialAngle || Math.random() * TWO_PI,
            targetRadius: posData.initialRadius || Math.random() * poolRadius,
            isCrossPoolTrader: isCrossPoolTrader,
            crossPoolProgress: 0,
            crossPoolDirection: 1,
            nextCrossPoolTime: isCrossPoolTrader
                ? Date.now() + Math.random() * 3000
                : 0,
            poolCenterTransition: 0,
            poolRadius,
            poolSeparation,
        };
        dotIndex++;
    }

    // Pool B traders
    for (let i = 0; i < Math.floor(dotCount * POOL_B_FRACTION); i++) {
        const dot = dots[dotIndex];
        const posData = positions[dotIndex].presetData || {};

        dot.targetOpacity = positions[dotIndex].opacity;
        dot.targetSize = positions[dotIndex].size;
        dot.color = positions[dotIndex].color;

        const isCrossPoolTrader = Math.random() < CROSS_POOL_PERCENTAGE;

        dot.presetData = {
            type: 'trader',
            pool: 'B',
            poolCenter: poolBCenter,
            targetAngle: posData.initialAngle || Math.random() * TWO_PI,
            targetRadius: posData.initialRadius || Math.random() * poolRadius,
            isCrossPoolTrader: isCrossPoolTrader,
            crossPoolProgress: 0,
            crossPoolDirection: 1,
            nextCrossPoolTime: isCrossPoolTrader
                ? Date.now() + Math.random() * 3000
                : 0,
            poolCenterTransition: 0,
            poolRadius,
            poolSeparation,
        };
        dotIndex++;
    }

    // Defense orbiting dots
    for (
        let i = 0;
        i <
        dotCount -
            Math.floor(dotCount * POOL_A_FRACTION) -
            Math.floor(dotCount * POOL_B_FRACTION) -
            Math.floor(dotCount * ATTACKER_FRACTION);
        i++
    ) {
        const dot = dots[dotIndex];
        dot.targetOpacity = positions[dotIndex].opacity;
        dot.targetSize = positions[dotIndex].size;
        dot.color = positions[dotIndex].color;

        const angle =
            (i /
                (dotCount -
                    Math.floor(dotCount * POOL_A_FRACTION) -
                    Math.floor(dotCount * POOL_B_FRACTION) -
                    Math.floor(dotCount * ATTACKER_FRACTION))) *
            TWO_PI;

        dot.presetData = {
            type: 'defense',
            orbitRadius: minOrbitRadius,
            angle: angle,
        };
        dotIndex++;
    }

    // Attacker dots
    for (let i = 0; i < Math.floor(dotCount * ATTACKER_FRACTION); i++) {
        const dot = dots[dotIndex];
        dot.targetOpacity = positions[dotIndex].opacity;
        dot.targetSize = positions[dotIndex].size;
        dot.color = positions[dotIndex].color;

        const angle = Math.random() * TWO_PI;
        const baseRingRadius =
            positions[dotIndex].presetData?.baseRingRadius ||
            attackerSpawnRadius;
        const spawnRadius =
            positions[dotIndex].presetData?.spawnRadius ||
            sampleAttackerRingRadius(baseRingRadius);
        const waitOpacity =
            positions[dotIndex].presetData?.waitOpacity ||
            sampleBetween(ATTACKER_WAIT_OPACITY_MIN, ATTACKER_WAIT_OPACITY_MAX);
        const attackOpacity =
            positions[dotIndex].presetData?.attackOpacity ||
            sampleBetween(ATTACKER_OPACITY_MIN, ATTACKER_OPACITY_MAX);
        const idleJitterAmplitude = spawnRadius * ATTACKER_IDLE_JITTER_RATIO;
        const idleJitterSpeed = sampleIdleJitterSpeed();
        const idleJitterPhase = Math.random() * TWO_PI;
        const attackStartTime =
            Date.now() +
            (i / Math.floor(dotCount * ATTACKER_FRACTION)) *
                ATTACKER_ATTACK_DURATION;
        const orbitAngularSpeed = sampleAttackerOrbitSpeed(
            DEFENSE_ORBIT_SPEED * ORBIT_ANGLE_PROGRESSION,
        );

        dot.presetData = {
            type: 'attacker',
            angle: angle,
            spawnRadius,
            idleJitterAmplitude,
            idleJitterSpeed,
            idleJitterPhase,
            state: 'waiting',
            attackStartTime,
            attackProgress: 0,
            attackStartRadius: spawnRadius,
            deflectionAngle: angle,
            deflectionStartAngle: angle,
            deflectionRadius: minOrbitRadius + deflectionDistance,
            attackerSpawnRadius: baseRingRadius,
            startAngle: angle,
            targetAngle: angle,
            respawnReadyTime: 0,
            minOrbitRadius,
            deflectionDistance,
            waitOpacity,
            attackOpacity,
            orbitAngularSpeed,
        };
        dotIndex++;
    }
}

/**
 * Update MEV protection animation
 */
export function update(
    dots: Dot[],
    _width: number,
    _height: number,
    center: CenterPosition,
    responsiveConfig: ResponsiveConfig,
): void {
    const currentTime = Date.now();

    const containerSize = responsiveConfig.containerSize;
    const poolSeparation = containerSize * POOL_SEPARATION_FRACTION;

    const poolACenter = { x: center.x - poolSeparation / 2, y: center.y };
    const poolBCenter = { x: center.x + poolSeparation / 2, y: center.y };

    let attackerTotal = 0;
    let attackerWaiting = 0;
    let attackerAttacking = 0;

    dots.forEach((dot) => {
        if (dot.presetData?.type === 'attacker') {
            attackerTotal += 1;
            if (dot.presetData.state === 'waiting') {
                attackerWaiting += 1;
            } else if (dot.presetData.state === 'attacking') {
                attackerAttacking += 1;
            }
        }
    });

    const targetAttacking = Math.min(
        resolveAttackerQuota(ATTACKER_TARGET_ATTACKING, attackerTotal),
        attackerTotal,
    );
    const targetWaiting = Math.min(
        resolveAttackerQuota(ATTACKER_TARGET_WAITING, attackerTotal),
        Math.max(0, attackerTotal - targetAttacking),
    );

    let currentAttacking = attackerAttacking;
    let currentWaiting = attackerWaiting;

    dots.forEach((dot) => {
        if (!dot.presetData) return;

        if (dot.presetData.type === 'trader') {
            const poolRadius = dot.presetData.poolRadius;

            const isTransitioning =
                dot.presetData.isCrossPoolTrader &&
                dot.presetData.poolCenterTransition > 0 &&
                dot.presetData.poolCenterTransition < 1;

            if (
                dot.presetData.isCrossPoolTrader &&
                currentTime >= dot.presetData.nextCrossPoolTime
            ) {
                const destinationPool =
                    dot.presetData.pool === 'A' ? poolBCenter : poolACenter;
                const currentPool =
                    dot.presetData.pool === 'A' ? poolACenter : poolBCenter;

                if (!dot.presetData.poolCenterTransition) {
                    dot.presetData.poolCenterTransition = 0;
                }

                dot.presetData.poolCenterTransition += CROSS_POOL_SPEED;

                dot.presetData.poolCenter = transitionPoolCenter(
                    currentPool,
                    destinationPool,
                    dot.presetData.poolCenterTransition,
                );

                if (dot.presetData.poolCenterTransition >= 1) {
                    if (dot.presetData.pool === 'A') {
                        dot.presetData.pool = 'B';
                        dot.presetData.poolCenter = poolBCenter;
                    } else {
                        dot.presetData.pool = 'A';
                        dot.presetData.poolCenter = poolACenter;
                    }
                    dot.presetData.targetAngle = Math.random() * TWO_PI;
                    dot.presetData.targetRadius = Math.random() * poolRadius;
                    dot.presetData.nextCrossPoolTime =
                        currentTime + 2000 + Math.random() * 3000;
                    dot.presetData.poolCenterTransition = 0;
                }
            }

            dot.presetData.targetAngle += POOL_MOVEMENT_SPEED;

            updatePoolOrbit(
                dot,
                dot.presetData.poolCenter,
                dot.presetData.targetAngle,
                dot.presetData.targetRadius,
                LERP_SPEED_TRANSITION,
            );

            if (Math.random() < RADIUS_CHANGE_PROBABILITY) {
                dot.presetData.targetRadius = Math.random() * poolRadius;
            }

            dot.targetOpacity = isTransitioning
                ? CROSS_POOL_TRADER_OPACITY
                : sampleBetween(TRADER_OPACITY_MIN, TRADER_OPACITY_MAX);
            dot.targetSize = TRADER_SIZE;
            dot.color = TRADER_COLOR;
        } else if (dot.presetData.type === 'defense') {
            dot.presetData.angle += DEFENSE_ORBIT_SPEED;

            const targetX =
                center.x +
                Math.cos(dot.presetData.angle) * dot.presetData.orbitRadius;
            const targetY =
                center.y +
                Math.sin(dot.presetData.angle) * dot.presetData.orbitRadius;
            dot.x += (targetX - dot.x) * LERP_SPEED_TRANSITION;
            dot.y += (targetY - dot.y) * LERP_SPEED_TRANSITION;
            dot.targetOpacity = sampleBetween(
                DEFENSE_OPACITY_MIN,
                DEFENSE_OPACITY_MAX,
            );
            dot.targetSize = DEFENSE_SIZE;
            dot.color = DEFENSE_COLOR;
        } else if (dot.presetData.type === 'attacker') {
            const baseRingRadius = dot.presetData.attackerSpawnRadius;
            const spawnRadius = dot.presetData.spawnRadius || baseRingRadius;
            const waitOpacity = clamp(
                dot.presetData.waitOpacity !== undefined
                    ? dot.presetData.waitOpacity
                    : ATTACKER_WAIT_OPACITY_MAX,
                ATTACKER_WAIT_OPACITY_MIN,
                ATTACKER_WAIT_OPACITY_MAX,
            );
            dot.presetData.waitOpacity = waitOpacity;

            if (dot.presetData.state === 'waiting') {
                const jitter =
                    Math.sin(dot.presetData.idleJitterPhase) *
                    dot.presetData.idleJitterAmplitude;
                const currentRadius = spawnRadius + jitter;
                const targetAngle =
                    dot.presetData.angle + dot.presetData.orbitAngularSpeed;
                const targetX =
                    center.x + Math.cos(targetAngle) * currentRadius;
                const targetY =
                    center.y + Math.sin(targetAngle) * currentRadius;
                dot.x += (targetX - dot.x) * LERP_SPEED_TRANSITION;
                dot.y += (targetY - dot.y) * LERP_SPEED_TRANSITION;
                dot.presetData.angle = targetAngle;
                dot.presetData.idleJitterPhase +=
                    dot.presetData.idleJitterSpeed * 16;

                const attackReady =
                    currentTime >= dot.presetData.attackStartTime;
                const attackAfterPromotion = currentAttacking + 1;
                const waitingAfterPromotion = currentWaiting - 1;
                const attackSlotsAvailable =
                    attackAfterPromotion <= targetAttacking;
                const waitingReserveThreshold = Math.max(0, targetWaiting - 1);
                const waitingReserveMet =
                    waitingAfterPromotion >= waitingReserveThreshold;

                if (attackReady && attackSlotsAvailable && waitingReserveMet) {
                    dot.presetData.state = 'attacking';
                    dot.presetData.attackProgress = 0;
                    dot.presetData.attackStartRadius = currentRadius;
                    dot.presetData.targetAngle = dot.presetData.angle;
                    currentAttacking += 1;
                    currentWaiting = Math.max(0, currentWaiting - 1);
                } else {
                    if (
                        attackReady &&
                        (!attackSlotsAvailable || !waitingReserveMet)
                    ) {
                        dot.presetData.attackStartTime = currentTime + 100;
                    }

                    dot.targetOpacity = waitOpacity;
                    dot.targetSize = ATTACKER_SIZE;
                    dot.color = ATTACKER_COLOR;
                    dot.opacity = waitOpacity;
                    return;
                }
            }

            if (dot.presetData.state === 'attacking') {
                dot.presetData.attackProgress += ATTACKER_SPEED;
                const progress = Math.min(dot.presetData.attackProgress, 1);
                const startRadius =
                    dot.presetData.attackStartRadius || spawnRadius;
                const currentDistance = Math.max(
                    dot.presetData.minOrbitRadius,
                    startRadius -
                        (startRadius - dot.presetData.minOrbitRadius) *
                            progress,
                );

                dot.x =
                    center.x +
                    Math.cos(dot.presetData.targetAngle) * currentDistance;
                dot.y =
                    center.y +
                    Math.sin(dot.presetData.targetAngle) * currentDistance;
                const attackOpacity = clamp(
                    dot.presetData.attackOpacity !== undefined
                        ? dot.presetData.attackOpacity
                        : ATTACKER_OPACITY_MAX,
                    ATTACKER_OPACITY_MIN,
                    ATTACKER_OPACITY_MAX,
                );
                dot.presetData.attackOpacity = attackOpacity;
                dot.targetOpacity = attackOpacity;
                dot.targetSize = ATTACKER_SIZE;
                dot.color = ATTACKER_COLOR;

                if (currentDistance <= dot.presetData.minOrbitRadius * 1.02) {
                    dot.presetData.state = 'respawning';
                    dot.presetData.respawnReadyTime =
                        currentTime + ATTACKER_RESPAWN_DELAY;
                    dot.targetOpacity = 0;
                    dot.targetSize = 0;
                    currentAttacking = Math.max(0, currentAttacking - 1);
                }
            }
            if (dot.presetData.state === 'respawning') {
                dot.targetOpacity = 0;
                dot.targetSize = 0;
                dot.color = ATTACKER_COLOR;

                if (currentTime >= dot.presetData.respawnReadyTime) {
                    if (currentWaiting >= targetWaiting) {
                        dot.presetData.respawnReadyTime = currentTime + 100;
                        return;
                    }

                    const newAngle = Math.random() * TWO_PI;
                    const newSpawnRadius =
                        sampleAttackerRingRadius(baseRingRadius);
                    const newWaitOpacity = sampleBetween(
                        ATTACKER_WAIT_OPACITY_MIN,
                        ATTACKER_WAIT_OPACITY_MAX,
                    );
                    const newAttackOpacity = sampleBetween(
                        ATTACKER_OPACITY_MIN,
                        ATTACKER_OPACITY_MAX,
                    );
                    dot.presetData.angle = newAngle;
                    dot.presetData.targetAngle = newAngle;
                    dot.presetData.spawnRadius = newSpawnRadius;
                    dot.presetData.attackStartRadius = newSpawnRadius;
                    dot.presetData.idleJitterAmplitude =
                        newSpawnRadius * ATTACKER_IDLE_JITTER_RATIO;
                    dot.presetData.idleJitterSpeed = sampleIdleJitterSpeed();
                    dot.presetData.idleJitterPhase = Math.random() * TWO_PI;
                    dot.presetData.orbitAngularSpeed = sampleAttackerOrbitSpeed(
                        DEFENSE_ORBIT_SPEED * ORBIT_ANGLE_PROGRESSION,
                    );
                    dot.presetData.attackStartTime =
                        currentTime + Math.random() * 4000;
                    dot.presetData.waitOpacity = newWaitOpacity;
                    dot.presetData.attackOpacity = newAttackOpacity;
                    dot.presetData.state = 'waiting';
                    dot.x = center.x + Math.cos(newAngle) * newSpawnRadius;
                    dot.y = center.y + Math.sin(newAngle) * newSpawnRadius;
                    dot.targetOpacity = newWaitOpacity;
                    dot.targetSize = ATTACKER_SIZE;
                    currentWaiting += 1;
                }
            }
        }

        dot.opacity += (dot.targetOpacity - dot.opacity) * LERP_SPEED_MEDIUM;
        dot.size += (dot.targetSize - dot.size) * LERP_SPEED_MEDIUM;
    });
}
