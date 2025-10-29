import { useState, useEffect, useMemo, useRef } from 'react';

function useStableSuffixes(suffixes: string[]) {
    return useMemo(() => suffixes, []);
}

export function useTextMorph(
    prefix: string,
    suffixes: string[],
    interval = 5000,
    isActive: boolean,
) {
    const stableSuffixes = useStableSuffixes(suffixes);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(true);
    const timerRef = useRef<NodeJS.Timeout | undefined>(undefined);
    const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

    // Reset the animation state when isActive changes
    useEffect(() => {
        if (isActive) {
            // Reset to initial state when becoming active
            setCurrentIndex(0);
            setIsVisible(true);
        } else {
            // Clear any pending timers when becoming inactive
            if (timerRef.current) clearTimeout(timerRef.current);
            if (intervalRef.current) clearInterval(intervalRef.current);
        }

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isActive]);

    useEffect(() => {
        if (!isActive) return;

        const changeSuffix = () => {
            // Start fade out
            setIsVisible(false);

            // After fade out completes, change suffix and fade back in
            timerRef.current = setTimeout(() => {
                setCurrentIndex((prev) => (prev + 1) % stableSuffixes.length);
                setIsVisible(true);
            }, 800); // Fade out duration
        };

        // Initial delay before starting the animation
        timerRef.current = setTimeout(() => {
            changeSuffix();

            // Set up the interval for subsequent changes
            intervalRef.current = setInterval(() => {
                changeSuffix();
            }, interval);
        }, interval);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [stableSuffixes, interval, isActive]);

    const currentSuffix = stableSuffixes[currentIndex];

    return {
        prefix,
        suffix: currentSuffix,
        isVisible,
        animationDuration: '800ms',
    };
}
