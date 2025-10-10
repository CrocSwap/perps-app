import { useRef } from 'react';

// interface for the methods returned by this hook
export interface BackgroundCounterIF {
    reset(resetTo?: number): void;
    increment(): void;
    decrement(): void;
    getCount(): number;
    log(label?: string): void;
}

// hook to track a count in the app without triggering re-renders
// this is useful for tracking excessive render loops
export default function useBackgroundCounter(
    initial?: number,
): BackgroundCounterIF {
    // value to initialize the count
    // overridden if user provides a value for optional param `initial`
    const DEFAULT_COUNT_START = 0;

    // ref to store the count
    // this is not a state variable, DOM will not update when value changes
    const count = useRef<number>(initial || DEFAULT_COUNT_START);

    // return object with methods to interact with the count
    // do not return the count directly, it will be incorrect
    return {
        // reset the count to a given value or the default
        reset(resetTo?: number): void {
            count.current = resetTo || DEFAULT_COUNT_START;
        },
        // increment the count by a given number (or 1)
        increment(incrementBy?: number): void {
            count.current += incrementBy || 1;
        },
        // decrement the count by a given number (or 1)
        decrement(decrementBy?: number): void {
            count.current -= decrementBy || 1;
        },
        // get the current count, value is held in a ref so this must be
        // ...  retrieved by a helper function
        getCount(): number {
            return count.current;
        },
        // log the current count to the console, with an optional label
        log(label?: string): void {
            console.log(label ? `${label}: ${count.current}` : count.current);
        },
    };
}
