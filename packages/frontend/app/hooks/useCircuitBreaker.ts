import { useSyncExternalStore } from 'react';
import {
    getCircuitBreaker,
    type circuitStatusT,
    type HealthSnapshotIF,
} from '~/utils/circuitBreaker/CircuitBreaker';

// Read-only React hook that subscribes to a CircuitBreaker's health state.
//
// Usage:
//   const { status, snapshot } = useCircuitBreaker('fuul');
//
// The breaker must already exist in the registry (via `getCircuitBreaker`).
// If no breaker is found for `label`, one is created with default config.
export function useCircuitBreaker(label: string): {
    status: circuitStatusT;
    snapshot: HealthSnapshotIF;
} {
    const breaker = getCircuitBreaker(label);

    const snapshot = useSyncExternalStore(
        (onStoreChange) => breaker.subscribe(onStoreChange),
        () => breaker.getSnapshot(),
        // SSR fallback: return the same snapshot getter
        () => breaker.getSnapshot(),
    );

    return {
        status: snapshot.status,
        snapshot,
    };
}
