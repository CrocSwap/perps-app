import { useCallback, useRef, useState, type WheelEventHandler } from 'react';
import { Background } from './Background/Background';
import { Copy } from './Copy/Copy';
import styles from './HomePage.module.css';
import { Particles } from './Particles/Particles';
import { SectionIndicators } from './SectionIndicators/SectionIndicators';
import { Ticker } from './Ticker/Ticker';
import { SectionObserver } from './hooks/section-observer';
import { useSectionScroll } from './hooks/use-section-scroll';
import { PRESET_IDS, type PresetId } from './types';

/*************  ✨ Windsurf Command ⭐  *************/
/**
 * The main entry point of the Home page component.
 * It maintains the active preset, which drives the particles, overlay content, and navigation highlight.
 * It also handles the section scroll wheel gestures to keep the copy and visuals in sync.
 */
/*******  040359b3-c798-4ac4-8bd0-6b7789a35858  *******/
export default function HomePage() {
    // Active preset drives particles, overlay content, and navigation highlight.
    const [currentPreset, setCurrentPreset] = useState<PresetId>('hero');
    // Scroll-snapping container holds invisible marker sections we observe.
    const snapContainerRef = useRef<HTMLDivElement>(null);
    const { scrollToPreset, scrollByDelta } =
        useSectionScroll(snapContainerRef);
    // Cooldown to prevent multiple scrolls from a single trackpad gesture
    const scrollCooldownRef = useRef(false);
    const lastScrollTimeRef = useRef(0);
    const accumulatedDeltaRef = useRef(0);
    const lastEventTimeRef = useRef(0);

    const presets = PRESET_IDS;

    const handleSwipe = useCallback(
        (direction: 'next' | 'prev') => {
            const currentIndex = presets.indexOf(currentPreset);
            if (currentIndex === -1) {
                return;
            }
            const targetIndex =
                direction === 'next'
                    ? Math.min(currentIndex + 1, presets.length - 1)
                    : Math.max(currentIndex - 1, 0);
            if (targetIndex === currentIndex) {
                return;
            }
            scrollToPreset(presets[targetIndex], 'smooth');
        },
        [currentPreset, presets, scrollToPreset],
    );

    // Divert overlay wheel gestures to the snap container so copy and visuals stay in sync.
    const handleOverlayWheel: WheelEventHandler<HTMLDivElement> = useCallback(
        (event) => {
            if (event.deltaY === 0 || scrollCooldownRef.current) {
                return;
            }

            const now = Date.now();
            const timeSinceLastEvent = now - lastEventTimeRef.current;
            lastEventTimeRef.current = now;

            // Detect trackpad vs mouse wheel
            // Trackpad: frequent events (< 100ms apart) with smaller deltas
            // Mouse wheel: discrete events with larger deltas
            const isTrackpad =
                Math.abs(event.deltaY) < 50 && timeSinceLastEvent < 100;

            if (isTrackpad) {
                // Trackpad logic: accumulate delta over time
                accumulatedDeltaRef.current += event.deltaY;

                // Reset accumulator if gesture paused (> 100ms gap)
                if (timeSinceLastEvent > 100) {
                    accumulatedDeltaRef.current = event.deltaY;
                }

                // Only trigger when accumulated delta crosses threshold
                if (Math.abs(accumulatedDeltaRef.current) < 50) {
                    return;
                }

                // Trigger swipe and reset
                const direction =
                    accumulatedDeltaRef.current > 0 ? 'next' : 'prev';
                accumulatedDeltaRef.current = 0;
                scrollCooldownRef.current = true;
                lastScrollTimeRef.current = now;
                handleSwipe(direction);

                setTimeout(() => {
                    scrollCooldownRef.current = false;
                }, 1200);
            } else {
                // Mouse wheel logic: respond immediately to significant events
                if (Math.abs(event.deltaY) < 4) {
                    return;
                }

                const direction = event.deltaY > 0 ? 'next' : 'prev';
                scrollCooldownRef.current = true;
                lastScrollTimeRef.current = now;
                handleSwipe(direction);

                setTimeout(() => {
                    scrollCooldownRef.current = false;
                }, 1200);
            }
        },
        [handleSwipe],
    );

    return (
        <div className={styles.container}>
            {/* <div className={styles.debugCenterGuides} aria-hidden='true' /> */}
            <Background />
            <div className={styles.particlesWrap}>
                <Particles preset={currentPreset} />
            </div>
            <SectionObserver
                containerRef={snapContainerRef}
                onPresetChange={setCurrentPreset}
            />
            <Copy
                active={currentPreset}
                onWheel={handleOverlayWheel}
                onScrollToPreset={scrollToPreset}
                onSwipe={handleSwipe}
            />
            <SectionIndicators
                presets={presets}
                currentPreset={currentPreset}
                onSelectPreset={scrollToPreset}
            />
            {currentPreset !== 'links' && <Ticker />}
            <div className={styles.snapContainer} ref={snapContainerRef}>
                <section
                    className={styles.heroSection}
                    data-preset='hero'
                    aria-hidden='true'
                />
                <section
                    className={styles.presetSection}
                    data-preset='speed'
                    aria-hidden='true'
                />
                <section
                    className={styles.presetSection}
                    data-preset='fees'
                    aria-hidden='true'
                />
                <section
                    className={styles.presetSection}
                    data-preset='mev'
                    aria-hidden='true'
                />
                <section
                    className={styles.presetSection}
                    data-preset='vault'
                    aria-hidden='true'
                />
                <section
                    className={styles.presetSection}
                    data-preset='links'
                    aria-hidden='true'
                />
            </div>
        </div>
    );
}
