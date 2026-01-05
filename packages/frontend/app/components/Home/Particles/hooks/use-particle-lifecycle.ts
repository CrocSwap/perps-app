import { useCallback, useEffect, useRef } from 'react';
import type { MutableRefObject } from 'react';
import { createResponsiveConfig } from '../presets/types';
import type {
    Dot,
    PresetInitialPositions,
    ResponsiveConfig,
} from '../presets/types';

import type { useDotPositions } from './use-dot-positions';
import type { useCanvasRenderer } from './use-canvas-renderer';
import type { PresetTransitionController } from './use-preset-transition';

interface UseParticleLifecycleOptions {
    canvasRef: MutableRefObject<HTMLCanvasElement | null>;
    animationRef: MutableRefObject<number | undefined>;
    isVisibleRef: MutableRefObject<boolean>;
    responsiveConfigRef: MutableRefObject<ResponsiveConfig | null>;
    dotsRef: MutableRefObject<Dot[]>;
    initialPositionsRef: MutableRefObject<
        Record<string, PresetInitialPositions>
    >;
    handleResize: () => void;
    transition: PresetTransitionController;
    isMobile: boolean;
    updateDots: ReturnType<typeof useDotPositions>['updateDots'];
    draw: ReturnType<typeof useCanvasRenderer>['draw'];
    calculateInitialPositions: ReturnType<
        typeof useDotPositions
    >['calculateInitialPositions'];
    initializePresetMovement: ReturnType<
        typeof useDotPositions
    >['initializePresetMovement'];
    startFadeIn: ReturnType<typeof useCanvasRenderer>['startFadeIn'];
}

export function useParticleLifecycle({
    canvasRef,
    animationRef,
    isVisibleRef,
    responsiveConfigRef,
    dotsRef,
    initialPositionsRef,
    handleResize,
    transition,
    isMobile,
    updateDots,
    draw,
    calculateInitialPositions,
    initializePresetMovement,
    startFadeIn,
}: UseParticleLifecycleOptions) {
    const {
        state,
        presetRef,
        modeRef,
        markFadeInStart,
        markTransitionStart,
        completeInitialLoad,
    } = transition;
    const previousValuesRef = useRef({
        preset: state.preset,
        displayMode: state.displayMode,
        effectiveMode: state.effectiveMode,
    });

    const animate = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) {
            return;
        }

        if (!isVisibleRef.current) {
            animationRef.current = requestAnimationFrame(animate);
            return;
        }

        try {
            const ctx = canvas.getContext('2d');
            if (!ctx || !responsiveConfigRef.current) {
                return;
            }

            const { width, height } = canvas;
            const { preset: currentPreset, effectiveMode } = state;

            updateDots(
                width,
                height,
                responsiveConfigRef.current,
                effectiveMode,
                currentPreset,
            );
            draw(ctx, width, height, dotsRef.current);

            animationRef.current = requestAnimationFrame(animate);
        } catch (error) {
            console.error('[Particles] Animation error:', error);
        }
    }, [
        canvasRef,
        isVisibleRef,
        responsiveConfigRef,
        state.effectiveMode,
        state.preset,
        updateDots,
        draw,
        dotsRef,
    ]);

    useEffect(() => {
        handleResize();

        const canvas = canvasRef.current;
        if (canvas && responsiveConfigRef.current) {
            const rect = canvas.getBoundingClientRect();
            const responsive = responsiveConfigRef.current;

            const effectiveMode =
                responsive.isMobile && modeRef.current === 'right-side'
                    ? 'bottom'
                    : modeRef.current;

            calculateInitialPositions(
                presetRef.current,
                rect.width,
                rect.height,
                responsive,
                effectiveMode,
            );

            if (state.isInitialLoad) {
                const dots = dotsRef.current;
                const cacheKey = `${presetRef.current}-${responsive.isMobile}-${responsive.isTablet}`;
                const storedPositions = initialPositionsRef.current[cacheKey];

                if (storedPositions) {
                    for (let i = 0; i < dots.length; i++) {
                        const dot = dots[i];
                        const target = storedPositions[i];
                        if (target) {
                            dot.x = target.x;
                            dot.y = target.y;
                            dot.opacity = 0;
                            dot.size = target.size;
                            dot.color = target.color;
                        }
                    }
                }

                markFadeInStart(Date.now());
                startFadeIn();
                initializePresetMovement(
                    presetRef.current,
                    rect.width,
                    rect.height,
                    responsive,
                    effectiveMode,
                );
                completeInitialLoad();
            }
        }

        animate();

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [
        handleResize,
        animate,
        calculateInitialPositions,
        initializePresetMovement,
        startFadeIn,
    ]);

    useEffect(() => {
        const prev = previousValuesRef.current;
        const presetChanged = prev.preset !== state.preset;
        const displayChanged = prev.displayMode !== state.displayMode;
        const effectiveChanged = prev.effectiveMode !== state.effectiveMode;

        if (!presetChanged && !displayChanged && !effectiveChanged) {
            return;
        }

        previousValuesRef.current = {
            preset: state.preset,
            displayMode: state.displayMode,
            effectiveMode: state.effectiveMode,
        };

        const canvas = canvasRef.current;
        if (!canvas) {
            return;
        }

        if (!responsiveConfigRef.current) {
            handleResize();
        }

        if (!responsiveConfigRef.current) {
            return;
        }

        const rect = canvas.getBoundingClientRect();

        if (presetChanged) {
            presetRef.current = state.preset;
        }

        if (effectiveChanged) {
            responsiveConfigRef.current = createResponsiveConfig(
                rect.width,
                rect.height,
                isMobile,
            );
            initialPositionsRef.current = {};
        }

        const responsive = responsiveConfigRef.current;
        const effectiveMode =
            responsive.isMobile && state.effectiveMode === 'right-side'
                ? 'bottom'
                : state.effectiveMode;

        calculateInitialPositions(
            presetRef.current,
            rect.width,
            rect.height,
            responsive,
            effectiveMode,
        );
        initializePresetMovement(
            presetRef.current,
            rect.width,
            rect.height,
            responsive,
            effectiveMode,
        );

        markTransitionStart(Date.now());
    }, [
        state.preset,
        state.displayMode,
        state.effectiveMode,
        calculateInitialPositions,
        initializePresetMovement,
        handleResize,
        isMobile,
        markTransitionStart,
        presetRef,
        modeRef,
        initialPositionsRef,
        responsiveConfigRef,
    ]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) {
            return;
        }

        const resizeObserver = new ResizeObserver(handleResize);
        resizeObserver.observe(canvas);

        return () => {
            resizeObserver.disconnect();
        };
    }, [canvasRef, handleResize]);

    useEffect(() => {
        handleResize();
    }, [state.preset, state.displayMode, handleResize]);
}
