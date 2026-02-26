/* eslint-disable @typescript-eslint/no-explicit-any */

import { useCallback, useEffect, useRef } from 'react';
import { POLLING_API_URL } from '~/utils/Constants';

export interface UsePollerIF {
    url?: string;
}

export function useRestPoller(props: UsePollerIF = {}) {
    const { url = POLLING_API_URL } = props;

    const intervalMapRef = useRef(new Map<string, NodeJS.Timeout>());

    // Clean up all intervals on unmount
    useEffect(() => {
        const map = intervalMapRef.current;
        return () => {
            map.forEach((interval) => clearInterval(interval));
            map.clear();
        };
    }, []);

    const toKey = useCallback((endpoint: string, payload: any) => {
        return `${endpoint}-${JSON.stringify(payload)}`;
    }, []);

    const subscribeToPoller = useCallback(
        (
            endpoint: string,
            payload: any,
            handler: (data: any) => void,
            intervalMs: number,
            callInit: boolean = false,
        ) => {
            const key = toKey(endpoint, payload);

            // Clear any existing interval for this key to prevent duplicates
            const existing = intervalMapRef.current.get(key);
            if (existing) {
                clearInterval(existing);
            }

            const interval = setInterval(() => {
                fetch(`${url}/${endpoint}`, {
                    method: 'POST',
                    body: JSON.stringify(payload),
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }).then(async (res) => {
                    const data = await res.json();
                    handler(data);
                    return data;
                });
            }, intervalMs);

            if (callInit) {
                fetch(`${url}/${endpoint}`, {
                    method: 'POST',
                    body: JSON.stringify(payload),
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }).then(async (res) => {
                    const data = await res.json();
                    handler(data);
                });
            }

            intervalMapRef.current.set(key, interval);
        },
        [url, toKey],
    );

    const unsubscribeFromPoller = useCallback(
        (endpoint: string, payload: any) => {
            const key = toKey(endpoint, payload);
            const interval = intervalMapRef.current.get(key);
            if (interval) {
                clearInterval(interval);
                intervalMapRef.current.delete(key);
            }
        },
        [toKey],
    );

    return { subscribeToPoller, unsubscribeFromPoller };
}
