import { useCallback, useRef } from 'react';
import type { Dot, ResponsiveConfig, CenterPosition } from '../presets/types';
import type { PresetId } from '../../types';
import * as HeroPreset from '../presets/hero';
import * as SpeedPreset from '../presets/speed';
import * as FeesPreset from '../presets/fees';
import * as MevPreset from '../presets/mev';
import * as VaultPreset from '../presets/vault';
import * as LinksPreset from '../presets/links';

const PRESETS: Record<PresetId, any> = {
    hero: HeroPreset,
    speed: SpeedPreset,
    fees: FeesPreset,
    mev: MevPreset,
    vault: VaultPreset,
    links: LinksPreset,
};

export function useDotPositions() {
    const dotsRef = useRef<Dot[]>([]);
    const initialPositionsRef = useRef<Record<string, any>>({});
    const presetRefsRef = useRef<Record<string, any>>({
        speed: { moonAngle: 0 },
    });

    const getCenterPosition = useCallback(
        (
            width: number,
            height: number,
            effectiveMode: string,
        ): CenterPosition => {
            switch (effectiveMode) {
                case 'right-side':
                    const halfWidth = width / 2;
                    const targetX = halfWidth + 320;
                    const maxX = Math.max(halfWidth, width - 160);
                    return {
                        x: Math.min(targetX, maxX),
                        y: height * 0.5 + 56 / 2,
                    };
                case 'bottom':
                    return {
                        x: width / 2,
                        y: height * 0.7,
                    };
                default:
                    return {
                        x: width / 2,
                        y: height * 0.5 + 56 / 2,
                    };
            }
        },
        [],
    );

    const getContainerCenter = useCallback(
        (
            width: number,
            height: number,
            effectiveMode: string,
        ): CenterPosition => {
            const center = getCenterPosition(width, height, effectiveMode);
            return center;
        },
        [getCenterPosition],
    );

    const initializeDots = useCallback(
        (
            width: number,
            height: number,
            responsive: ResponsiveConfig,
            effectiveMode: string,
        ) => {
            const dots: Dot[] = [];
            const center = getCenterPosition(width, height, effectiveMode);
            const count = responsive.dotCount;

            for (let i = 0; i < count; i++) {
                const x = center.x + (Math.random() - 0.5) * 100;
                const y = center.y + (Math.random() - 0.5) * 100;
                const opacity = 0;

                dots.push({
                    x,
                    y,
                    size: 1,
                    targetSize: 1,
                    opacity,
                    targetOpacity: opacity,
                    color: '#f0f0f8',
                    presetData: {},
                });
            }

            dotsRef.current = dots;
        },
        [getCenterPosition],
    );

    const calculateInitialPositions = useCallback(
        (
            targetPreset: string,
            width: number,
            height: number,
            responsive: ResponsiveConfig,
            effectiveMode: string,
        ) => {
            const cacheKey = `${targetPreset}-${responsive.isMobile}-${responsive.isTablet}`;
            if (initialPositionsRef.current[cacheKey]) {
                return;
            }

            const center = getContainerCenter(width, height, effectiveMode);
            const presetModule = PRESETS[targetPreset as keyof typeof PRESETS];

            if (!presetModule) {
                console.error(`[v0] Unknown preset: ${targetPreset}`);
                return;
            }

            try {
                const positions = presetModule.calculatePositions(
                    width,
                    height,
                    center,
                    responsive,
                );
                initialPositionsRef.current[cacheKey] = positions;
            } catch (error) {
                console.error(
                    `[useDotPositions] Error calculating positions for preset ${targetPreset}:`,
                    error,
                );
            }
        },
        [getContainerCenter],
    );

    const initializePresetMovement = useCallback(
        (
            targetPreset: string,
            width: number,
            height: number,
            responsive: ResponsiveConfig,
            effectiveMode: string,
        ) => {
            const dots = dotsRef.current;
            const center = getContainerCenter(width, height, effectiveMode);
            const cacheKey = `${targetPreset}-${responsive.isMobile}-${responsive.isTablet}`;
            const positions = initialPositionsRef.current[cacheKey];

            if (!positions) return;

            const presetModule = PRESETS[targetPreset as keyof typeof PRESETS];
            if (!presetModule) {
                console.error(`[v0] Unknown preset: ${targetPreset}`);
                return;
            }

            try {
                presetModule.initializeMovement(
                    dots,
                    positions,
                    width,
                    height,
                    center,
                    responsive,
                );
            } catch (error) {
                console.error(
                    `[useDotPositions] Error initializing movement for preset ${targetPreset}:`,
                    error,
                );
            }
        },
        [getContainerCenter],
    );

    const updateDots = useCallback(
        (
            width: number,
            height: number,
            responsive: ResponsiveConfig,
            effectiveMode: string,
            currentPreset: string,
        ) => {
            const dots = dotsRef.current;
            const center = getContainerCenter(width, height, effectiveMode);
            const presetModule = PRESETS[currentPreset as keyof typeof PRESETS];

            if (!presetModule) {
                console.error(`[v0] Unknown preset: ${currentPreset}`);
                return;
            }

            try {
                const presetRefs = presetRefsRef.current[currentPreset];
                if (presetRefs) {
                    presetModule.update(
                        dots,
                        width,
                        height,
                        center,
                        responsive,
                        presetRefs,
                    );
                } else {
                    presetModule.update(
                        dots,
                        width,
                        height,
                        center,
                        responsive,
                    );
                }
            } catch (error) {
                console.error(
                    `[useDotPositions] Error updating dots for preset ${currentPreset}:`,
                    error,
                );
            }
        },
        [getContainerCenter],
    );

    return {
        dotsRef,
        initialPositionsRef,
        presetRefsRef,
        getCenterPosition,
        getContainerCenter,
        initializeDots,
        calculateInitialPositions,
        initializePresetMovement,
        updateDots,
    };
}
