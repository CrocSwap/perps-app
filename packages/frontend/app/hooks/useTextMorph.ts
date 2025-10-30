import { useState, useEffect, useMemo, useRef } from 'react';

function useStableSecondWords(secondWord: string[]) {
    return useMemo(() => secondWord, []);
}

export function useTextMorph(
    secondWord: string[],
    interval = 5000,
    isActive: boolean,
) {
    const stableSecondWords = useStableSecondWords(secondWord);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(true);
    const timerRef = useRef<NodeJS.Timeout | undefined>(undefined);
    const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

    useEffect(() => {
        if (!isActive) {
            // Clear any pending timers when becoming inactive
            if (timerRef.current) clearTimeout(timerRef.current);
            if (intervalRef.current) clearInterval(intervalRef.current);
            return;
        }

        // Reset to initial state when becoming active
        setCurrentIndex(0);
        setIsVisible(true);

        // Clear any existing timers before setting new ones
        if (timerRef.current) clearTimeout(timerRef.current);
        if (intervalRef.current) clearInterval(intervalRef.current);

        const FADE_DURATION = 800; // Match this with the CSS transition duration
        let isMounted = true;
        let initialAnimationComplete = false;

        const changeSecondWord = () => {
            if (!isMounted) return;

            // Start fade out
            setIsVisible(false);

            // After fade out completes, change suffix and fade back in
            timerRef.current = setTimeout(() => {
                if (!isMounted) return;

                setCurrentIndex(
                    (prev) => (prev + 1) % stableSecondWords.length,
                );

                // Add a small delay before fading back in to ensure the text has updated
                timerRef.current = setTimeout(() => {
                    if (isMounted) {
                        setIsVisible(true);
                        // After first animation completes, set up the interval
                        if (!initialAnimationComplete) {
                            initialAnimationComplete = true;
                            // Set up the interval for subsequent animations
                            intervalRef.current = setInterval(
                                changeSecondWord,
                                interval,
                            );
                        }
                    }
                }, 50);
            }, FADE_DURATION);
        };

        // Initial delay before starting the first animation
        const initialDelay = setTimeout(() => {
            if (!isMounted) return;
            // Start the first animation after the initial delay
            timerRef.current = setTimeout(changeSecondWord, interval);
        }, 1000); // Wait 1 second before starting the first transition

        return () => {
            isMounted = false;
            clearTimeout(initialDelay);
            if (timerRef.current) clearTimeout(timerRef.current);
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isActive, stableSecondWords, interval]);

    const currentSecondWord = stableSecondWords[currentIndex];

    return {
        secondWord: currentSecondWord,
        isVisible,
        animationDuration: '800ms',
    };
}
