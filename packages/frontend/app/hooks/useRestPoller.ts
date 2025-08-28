/* eslint-disable @typescript-eslint/no-explicit-any */

import { useCallback, useEffect } from 'react';
import { POLLING_API_URL } from '~/utils/Constants';

export interface UsePollerIF {
    url?: string;
}

export function useRestPoller(props: UsePollerIF = {}) {
    const { url = POLLING_API_URL } = props;

    const intervalMap = new Map<string, NodeJS.Timeout>();

    useEffect(() => {}, []);

    const toKey = useCallback((endpoint: string, payload: any) => {
        return `${endpoint}-${JSON.stringify(payload)}`;
    }, []);

    const subscribeToPoller = (
        endpoint: string,
        payload: any,
        handler: (data: any) => void,
        intervalMs: number,
        callInit: boolean = false,
    ) => {
        const key = toKey(endpoint, payload);
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

        intervalMap.set(key, interval);
    };

    const unsubscribeFromPoller = (endpoint: string, payload: any) => {
        const key = toKey(endpoint, payload);
        const interval = intervalMap.get(key);
        if (interval) {
            clearInterval(interval);
            intervalMap.delete(key);
        }
    };

    return { subscribeToPoller, unsubscribeFromPoller };
}
