import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * A custom hook that debounces a value.
 *
 * @param value The value to debounce
 * @param delay The delay in milliseconds
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        // Set a timeout to update the debounced value after the specified delay
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // Clean up the timeout if the value changes before the delay has passed
        return () => {
            clearTimeout(timer);
        };
    }, [value, delay]);

    return debouncedValue;
}

/**
 * A custom hook that returns a debounced version of a callback function.
 *
 * @param callback The function to debounce
 * @param delay The delay in milliseconds
 * @returns The debounced function
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useDebouncedCallback<T extends (...args: any[]) => any>(
    callback: T,
    delay: number,
): (...args: Parameters<T>) => void {
    const callbackRef = useRef<T>(callback);

    // Update the callback ref when the callback changes
    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    // Use useRef to store the timeout ID between renders
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Clean up pending timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return useCallback(
        (...args: Parameters<T>) => {
            // Clear the previous timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            // Set a new timeout
            timeoutRef.current = setTimeout(() => {
                callbackRef.current(...args);
            }, delay);
        },
        [delay],
    );
}

export default useDebounce;
