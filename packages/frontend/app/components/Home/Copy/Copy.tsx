import {
    useMemo,
    useRef,
    type WheelEventHandler,
    type TouchEventHandler,
} from 'react';
import styles from './Copy.module.css';
import type { PresetId } from '../types';
import {
    OVERLAY_SLIDE_CONFIG,
    type SlideConfig,
    type HeroSlideConfig,
    type FeatureSlideConfig,
} from '../config/overlay-config';
import { useOverlayFocus } from '../hooks/use-overlay-focus';
import { HeroSlide } from './slides/HeroSlide';
import { FeatureSlide } from './slides/FeatureSlide';
import { LinksSlide } from './slides/LinksSlide';

interface CopyProps {
    active: PresetId;
    onWheel?: WheelEventHandler<HTMLDivElement>;
    onScrollToPreset?: (preset: PresetId) => void;
    onSwipe?: (direction: 'next' | 'prev') => void;
}

const EMPTY_HEADINGS: Record<PresetId, string> = {
    hero: '',
    speed: '',
    fees: '',
    mev: '',
    vault: '',
    links: '',
};

export function Copy({
    active,
    onWheel,
    onScrollToPreset,
    onSwipe,
}: CopyProps) {
    const {
        isReady,
        liveStatus,
        registerSlide,
        isSlideActive,
        getFocusableState,
    } = useOverlayFocus({
        active,
    });

    const touchStartYRef = useRef<number | null>(null);
    const hasTriggeredSwipeRef = useRef(false);

    const headingIds = useMemo<Record<PresetId, string>>(() => {
        // Map each preset to a stable heading id for aria-labelledby wiring.
        const map = { ...EMPTY_HEADINGS };
        for (const slide of OVERLAY_SLIDE_CONFIG) {
            map[slide.id] = `overlay-${slide.id}-heading`;
        }
        return map;
    }, []);

    // Allow child slides to trigger the global scroll handler (e.g., CTA buttons).
    const scrollToPreset = (preset: PresetId) => {
        onScrollToPreset?.(preset);
    };

    const containerClassName = `${styles.overlayContainer} ${
        isReady ? styles.overlayContainerReady : ''
    }`.trim();

    const handleTouchStart: TouchEventHandler<HTMLDivElement> = (event) => {
        if (event.touches.length !== 1) {
            touchStartYRef.current = null;
            return;
        }
        touchStartYRef.current = event.touches[0].clientY;
        hasTriggeredSwipeRef.current = false;
    };

    const handleTouchMove: TouchEventHandler<HTMLDivElement> = (event) => {
        if (!onSwipe) {
            return;
        }
        const startY = touchStartYRef.current;
        if (
            startY === null ||
            event.touches.length !== 1 ||
            hasTriggeredSwipeRef.current
        ) {
            return;
        }
        const currentY = event.touches[0].clientY;
        const deltaY = startY - currentY;
        const threshold = 30;
        if (Math.abs(deltaY) >= threshold) {
            onSwipe(deltaY > 0 ? 'next' : 'prev');
            event.preventDefault();
            hasTriggeredSwipeRef.current = true;
        }
    };

    const handleTouchEnd: TouchEventHandler<HTMLDivElement> = () => {
        touchStartYRef.current = null;
        hasTriggeredSwipeRef.current = false;
    };

    return (
        <div
            className={containerClassName}
            aria-live='polite'
            onWheel={onWheel}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
        >
            <span className={styles.srOnly} aria-live='polite'>
                {liveStatus ? `Showing section: ${liveStatus}` : ''}
            </span>
            {OVERLAY_SLIDE_CONFIG.map((slide) => {
                // Each slide registers for focus management and toggles visibility via aria.
                const headingId = headingIds[slide.id];
                const activeClass = isSlideActive(slide.id)
                    ? styles.overlaySlideActive
                    : '';
                const focusState = getFocusableState(slide.id);
                return (
                    <div
                        key={slide.id}
                        ref={registerSlide(slide.id)}
                        className={`${styles.overlaySlide} ${activeClass}`}
                        aria-hidden={!isSlideActive(slide.id)}
                        aria-labelledby={headingId}
                        role='region'
                        tabIndex={-1}
                        data-focus-state={focusState}
                    >
                        {renderSlideContent(
                            slide,
                            headingId,
                            scrollToPreset,
                            isSlideActive(slide.id),
                        )}
                    </div>
                );
            })}
        </div>
    );
}

function renderSlideContent(
    slide: SlideConfig,
    headingId: string,
    scrollToPreset: (preset: PresetId) => void,
    isActive: boolean,
) {
    if (slide.type === 'hero') {
        return (
            <HeroSlide
                slide={slide as HeroSlideConfig}
                headingId={headingId}
                onScrollToPreset={scrollToPreset}
                isActive={isActive}
            />
        );
    }

    if (slide.type === 'feature') {
        return (
            <FeatureSlide
                slide={slide as FeatureSlideConfig}
                headingId={headingId}
            />
        );
    }

    return <LinksSlide />;
}
