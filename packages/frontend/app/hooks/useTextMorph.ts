import { useState, useEffect, useMemo } from 'react';

function useStableSuffixes(suffixes: string[]) {
    return useMemo(() => suffixes, []);
}

export function useTextMorph(
    prefix: string,
    suffixes: string[],
    interval = 5000,
) {
    const stableSuffixes = useStableSuffixes(suffixes);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        let initialTimer: NodeJS.Timeout;
        let timer: NodeJS.Timeout;

        const changeSuffix = () => {
            // Start fade out
            setIsVisible(false);

            // After fade out completes, change suffix and fade back in
            setTimeout(() => {
                setCurrentIndex((prev) => (prev + 1) % stableSuffixes.length);
                setIsVisible(true);
            }, 800); // Fade out duration
        };

        initialTimer = setTimeout(() => {
            changeSuffix();

            // Set up the interval for subsequent changes
            timer = setInterval(() => {
                changeSuffix();
            }, interval);
        }, interval);

        return () => {
            clearTimeout(initialTimer);
            if (timer) clearInterval(timer);
        };
    }, [stableSuffixes, interval]);

    const currentSuffix = stableSuffixes[currentIndex];

    return {
        prefix,
        suffix: currentSuffix,
        isVisible,
        animationDuration: '800ms',
    };
}
