import { useCallback, useState } from 'react';
import type { CSSProperties, MutableRefObject } from 'react';
import { createResponsiveConfig } from '../presets/types';
import type {
    Dot,
    PresetInitialPositions,
    ResponsiveConfig,
} from '../presets/types';
import type { DotFieldMode, PresetId } from '../../types';

interface UseParticleResponsiveConfigOptions {
    canvasRef: MutableRefObject<HTMLCanvasElement | null>;
    isMobile: boolean;
    isLandscape: boolean;
    modeRef: MutableRefObject<DotFieldMode>;
    presetRef: MutableRefObject<PresetId>;
    responsiveConfigRef: MutableRefObject<ResponsiveConfig | null>;
    dotsRef: MutableRefObject<Dot[]>;
    initialPositionsRef: MutableRefObject<
        Record<string, PresetInitialPositions>
    >;
    initializeDots: ReturnType<
        (typeof import('./use-dot-positions'))['useDotPositions']
    >['initializeDots'];
    calculateInitialPositions: ReturnType<
        (typeof import('./use-dot-positions'))['useDotPositions']
    >['calculateInitialPositions'];
    initializePresetMovement: ReturnType<
        (typeof import('./use-dot-positions'))['useDotPositions']
    >['initializePresetMovement'];
    getContainerCenter: ReturnType<
        (typeof import('./use-dot-positions'))['useDotPositions']
    >['getContainerCenter'];
}

interface UseParticleResponsiveConfigResult {
    debugRect: CSSProperties | null;
    handleResize: () => void;
}

export function useParticleResponsiveConfig({
    canvasRef,
    isMobile,
    isLandscape,
    modeRef,
    presetRef,
    responsiveConfigRef,
    dotsRef,
    initialPositionsRef,
    initializeDots,
    calculateInitialPositions,
    initializePresetMovement,
    getContainerCenter,
}: UseParticleResponsiveConfigOptions): UseParticleResponsiveConfigResult {
    const [debugRect, setDebugRect] = useState<CSSProperties | null>(null);

    const handleResize = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) {
            return;
        }

        const rect = canvas.getBoundingClientRect();
        const width = Math.max(1, rect.width);
        const height = Math.max(1, rect.height);

        canvas.width = width;
        canvas.height = height;

        const responsive = createResponsiveConfig(
            width,
            height,
            isMobile,
            isLandscape,
        );
        const previousConfig = responsiveConfigRef.current;
        responsiveConfigRef.current = responsive;

        const effectiveMode =
            responsive.isMobile && modeRef.current === 'right-side'
                ? 'bottom'
                : modeRef.current;

        // Clear cached positions when the responsive config changes
        initialPositionsRef.current = {};

        const dotCountChanged =
            !previousConfig || previousConfig.dotCount !== responsive.dotCount;

        if (dotCountChanged || dotsRef.current.length === 0) {
            initializeDots(width, height, responsive, effectiveMode);
        }

        calculateInitialPositions(
            presetRef.current,
            width,
            height,
            responsive,
            effectiveMode,
        );

        initializePresetMovement(
            presetRef.current,
            width,
            height,
            responsive,
            effectiveMode,
        );

        if (effectiveMode === 'right-side') {
            const center = getContainerCenter(width, height, effectiveMode);
            const containerSize = responsive.containerSize;
            const maxSize = Math.min(containerSize, width, height);
            const halfSize = maxSize / 2;
            const clampedCenterX = Math.min(
                Math.max(center.x, halfSize),
                width - halfSize,
            );
            const clampedCenterY = Math.min(
                Math.max(center.y, halfSize),
                height - halfSize,
            );
            const adjustedLeft = rect.left + (clampedCenterX - halfSize);
            const adjustedTop = rect.top + (clampedCenterY - halfSize);
            setDebugRect({
                top: adjustedTop,
                left: adjustedLeft,
                width: maxSize,
                height: maxSize,
            });
        } else {
            setDebugRect(null);
        }
    }, [
        canvasRef,
        isMobile,
        isLandscape,
        modeRef,
        presetRef,
        responsiveConfigRef,
        initialPositionsRef,
        initializeDots,
        calculateInitialPositions,
        initializePresetMovement,
        getContainerCenter,
        dotsRef,
    ]);

    return {
        handleResize,
        debugRect,
    };
}
