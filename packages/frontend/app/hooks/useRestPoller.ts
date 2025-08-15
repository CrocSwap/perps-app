import { useCallback, useEffect } from 'react';
import { ORDERBOOK_POLL_URL } from '~/utils/Constants';

export interface UsePollerIF {
    url?: string;
}

export function useRestPoller(props: UsePollerIF = {}) {
    const { url = ORDERBOOK_POLL_URL } = props;

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
    ) => {
        const key = toKey(endpoint, payload);
        const interval = setInterval(() => {
            fetch(`${url}/${endpoint}`, {
                method: 'POST',
                body: JSON.stringify(payload),
            }).then(async (res) => {
                const data = await res.json();
                handler(data);
                return data;
            });
        }, intervalMs);
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
