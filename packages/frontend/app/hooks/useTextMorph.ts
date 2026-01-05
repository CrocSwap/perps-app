import { useState, useEffect, useMemo, useRef } from 'react';

function useStableWords(words: string[]) {
    return useMemo(() => words, []);
}

export function useTextMorph(
    firstWord: string[],
    secondWord: string[],
    interval = 5000,
    isActive: boolean,
) {
    const stableFirstWords = useStableWords(firstWord);
    const stableSecondWords = useStableWords(secondWord);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(true);
    const timerRef = useRef<NodeJS.Timeout | undefined>(undefined);
    const intervalRef = useRef<number | undefined>(undefined);

    useEffect(() => {
        if (!isActive) {
            // Clear any pending timers when becoming inactive
            clearTimeout(timerRef.current);
            cancelAnimationFrame(intervalRef.current as unknown as number);
            return;
        }

        // Reset to initial state when becoming active
        setCurrentIndex(0);
        setIsVisible(true);

        // Clear any existing timers before setting new ones
        clearTimeout(timerRef.current);
        cancelAnimationFrame(intervalRef.current as unknown as number);

        const FADE_DURATION = 800; // Match this with the CSS transition duration
        let isMounted = true;
        let animationFrameId: number;

        const scheduleNextChange = () => {
            if (!isMounted) return;
            const startTime = performance.now();

            const animate = () => {
                if (!isMounted) return;
                const now = performance.now();
                const elapsed = now - startTime;

                if (elapsed >= interval) {
                    changeWords();
                } else {
                    animationFrameId = requestAnimationFrame(animate);
                }
            };

            animationFrameId = requestAnimationFrame(animate);
        };

        const changeWords = () => {
            if (!isMounted) return;

            // Start fade out
            setIsVisible(false);

            // After fade out completes, change words and fade back in
            timerRef.current = setTimeout(() => {
                if (!isMounted) return;

                // Update both words simultaneously
                setCurrentIndex((prev) => (prev + 1) % stableFirstWords.length);

                // Fade back in after a small delay to ensure the text has updated
                timerRef.current = setTimeout(() => {
                    if (isMounted) {
                        setIsVisible(true);
                        // Schedule the next word change
                        scheduleNextChange();
                    }
                }, 50);
            }, FADE_DURATION);
        };

        // Start the first animation after a delay
        const initialDelay = setTimeout(() => {
            if (isMounted) {
                changeWords();
            }
        }, 5000); // Initial delay before first transition

        return () => {
            isMounted = false;
            clearTimeout(initialDelay);
            clearTimeout(timerRef.current);
            cancelAnimationFrame(animationFrameId);
            cancelAnimationFrame(intervalRef.current as unknown as number);
        };
    }, [isActive, stableFirstWords, stableSecondWords, interval]);

    const currentFirstWord = stableFirstWords[currentIndex];
    const currentSecondWord = stableSecondWords[currentIndex];

    return {
        firstWord: currentFirstWord,
        secondWord: currentSecondWord,
        isVisible,
        animationDuration: '800ms',
    };
}
