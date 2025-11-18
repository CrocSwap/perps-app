import { useEffect, useState } from 'react';

/**
 * Custom hook that returns whether the current viewport matches the provided media query
 * @param query - CSS media query to match against
 * @returns boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
    // Initialize with the current match state
    const [matches, setMatches] = useState<boolean>(() => {
        return window.matchMedia(query).matches;
    });

    useEffect(() => {
        // Create a media query list
        const mediaQueryList = window.matchMedia(query);

        // Update the state initially
        setMatches(mediaQueryList.matches);

        // Define a callback function to handle changes
        const handleChange = (event: MediaQueryListEvent): void => {
            setMatches(event.matches);
        };

        // Modern browsers
        mediaQueryList.addEventListener('change', handleChange);

        // Cleanup function to remove the listener
        return () => {
            mediaQueryList.removeEventListener('change', handleChange);
        };
    }, [query]); // Re-run effect if the query changes

    return matches;
}

export function useShortScreen(breakpoint: number = 750): boolean {
    return useMediaQuery(`(max-height: ${breakpoint}px)`);
}

/**
 * Predefined media query hook for mobile devices
 * @param breakpoint - Optional custom breakpoint in pixels (default: 768)
 * @returns boolean indicating if the current viewport is mobile-sized
 */
export function useMobile(breakpoint: number = 768): boolean {
    return useMediaQuery(`(max-width: ${breakpoint}px)`);
}

/**
 * Predefined media query hook for tablet devices
 * @param minBreakpoint - Minimum breakpoint in pixels (default: 768)
 * @param maxBreakpoint - Maximum breakpoint in pixels (default: 1024)
 * @returns boolean indicating if the current viewport is tablet-sized
 */
export function useTablet(
    minBreakpoint: number = 768,
    maxBreakpoint: number = 1024,
): boolean {
    return useMediaQuery(
        `(min-width: ${minBreakpoint}px) and (max-width: ${maxBreakpoint}px)`,
    );
}

/**
 * Predefined media query hook for desktop devices
 * @param breakpoint - Optional custom breakpoint in pixels (default: 1024)
 * @returns boolean indicating if the current viewport is desktop-sized
 */
export function useDesktop(breakpoint: number = 1024): boolean {
    return useMediaQuery(`(min-width: ${breakpoint}px)`);
}

/**
 * Predefined media query hook for detecting dark mode preference
 * @returns boolean indicating if the user prefers dark mode
 */
export function useDarkMode(): boolean {
    return useMediaQuery('(prefers-color-scheme: dark)');
}

/**
 * Predefined media query hook for detecting reduced motion preference
 * @returns boolean indicating if the user prefers reduced motion
 */
export function useReducedMotion(): boolean {
    return useMediaQuery('(prefers-reduced-motion: reduce)');
}

export default useMediaQuery;
