import { useEffect, useRef } from 'react';
import type { PresetId } from '../types';
import { resolveMode } from './mode';
import styles from './Particles.module.css';
import type { ResponsiveConfig } from './presets/types';
import { useIsMobile } from '../hooks/use-mobile';
import { useCanvasRenderer } from './hooks/use-canvas-renderer';
import { useDotPositions } from './hooks/use-dot-positions';
import { useParticleVisibility } from './hooks/use-particle-visibility';
import { useParticleResponsiveConfig } from './hooks/use-particle-responsive-config';
import { useParticleLifecycle } from './hooks/use-particle-lifecycle';
import { usePresetTransitionController } from './hooks/use-preset-transition';
import useMediaQuery, { useMobileLandscape } from '~/hooks/useMediaQuery';

// ============================================================================
// TYPES
// ============================================================================

interface DotFieldProps {
    preset: PresetId;
}

// ============================================================================
// COMPONENT

export function Particles({ preset }: DotFieldProps) {
    const isMobileDevice = useMediaQuery('(max-width: 768px)');
    const isMobileLandscape = useMobileLandscape();

    // Resolve how the preset should be displayed based on device breakpoint.
    const { mode: resolvedMode, effectiveMode } = resolveMode({
        preset,
        isMobile: isMobileDevice,
    });

    const {
        dotsRef,
        initialPositionsRef,
        getContainerCenter,
        initializeDots,
        calculateInitialPositions,
        initializePresetMovement,
        updateDots,
    } = useDotPositions();

    const { draw, startFadeIn } = useCanvasRenderer();

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number | undefined>(undefined);
    const responsiveConfigRef = useRef<ResponsiveConfig | null>(null);

    // Centralized state controller keeps track of preset + layout transitions.
    const transition = usePresetTransitionController({
        preset,
        displayMode: resolvedMode,
        effectiveMode,
    });

    const { state, setPreset, setModes, presetRef, modeRef } = transition;

    const { handleResize } = useParticleResponsiveConfig({
        canvasRef,
        isMobile: isMobileDevice,
        isLandscape: isMobileLandscape,
        modeRef,
        presetRef,
        responsiveConfigRef,
        dotsRef,
        initialPositionsRef,
        initializeDots,
        calculateInitialPositions,
        initializePresetMovement,
        getContainerCenter,
    });

    const isVisibleRef = useParticleVisibility(canvasRef);

    useEffect(() => {
        setPreset(preset);

        const { mode: nextMode, effectiveMode: nextEffectiveMode } =
            resolveMode({
                preset,
                isMobile: isMobileDevice,
            });

        const { effectiveChanged } = setModes(nextMode, nextEffectiveMode);

        if (effectiveChanged) {
            initialPositionsRef.current = {};
        }
    }, [preset, isMobileDevice, setPreset, setModes, initialPositionsRef]);

    // Entrypoint that wires sizing, animation loop, and preset transitions together.
    useParticleLifecycle({
        canvasRef,
        animationRef,
        isVisibleRef,
        responsiveConfigRef,
        dotsRef,
        initialPositionsRef,
        handleResize,
        isMobile: isMobileDevice,
        updateDots,
        draw,
        calculateInitialPositions,
        initializePresetMovement,
        startFadeIn,
        transition,
    });

    const getCanvasClassName = () => {
        if (!responsiveConfigRef.current) return styles.canvas;

        const displayMode = state.displayMode;
        const effectiveModeForLayout =
            responsiveConfigRef.current.isMobile && displayMode === 'right-side'
                ? 'bottom'
                : displayMode;

        let className = styles.canvas;

        if (effectiveModeForLayout === 'right-side') {
            className = `${className} ${styles.canvasRightSide}`;
        } else if (effectiveModeForLayout === 'bottom') {
            className = `${className} ${styles.canvasBottom}`;
        }

        // Add special class for links preset on mobile to avoid footer overlap
        if (preset === 'links' && responsiveConfigRef.current.isMobile) {
            className = `${className} ${styles.canvasLinks}`;
        }

        return className;
    };

    return (
        <>
            <canvas ref={canvasRef} className={getCanvasClassName()} />
        </>
    );
}
