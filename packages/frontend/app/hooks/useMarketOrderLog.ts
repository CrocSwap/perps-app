import {
    isEstablished,
    useConnection,
    useSession,
} from '@fogo/sessions-sdk-react';
import { useCallback, useEffect, useRef } from 'react';
import { marketOrderLogManager } from '~/services/MarketOrderLogManager';

/**
 * Hook to manage market order log page pre-fetching
 * This hook subscribes to the market order log manager when the session is established
 * and ensures the log page is cached for faster transaction building
 */
export function useMarketOrderLog() {
    const sessionState = useSession();
    const connection = useConnection();
    const hasSubscribedRef = useRef(false);
    const lastSessionStateRef = useRef<boolean>(false);

    const isSessionEstablished = isEstablished(sessionState);

    useEffect(() => {
        // Track session state changes
        const sessionChanged =
            lastSessionStateRef.current !== isSessionEstablished;
        lastSessionStateRef.current = isSessionEstablished;

        if (!isSessionEstablished) {
            // Only unsubscribe if we were actually subscribed
            if (hasSubscribedRef.current) {
                hasSubscribedRef.current = false;
                marketOrderLogManager.unsubscribe();
            }
            return;
        }

        // Subscribe only if not already subscribed and session just became established
        if (!hasSubscribedRef.current && sessionChanged) {
            hasSubscribedRef.current = true;
            marketOrderLogManager.subscribe(connection);
        }

        // Cleanup function - runs on unmount and when dependencies change
        return () => {
            if (hasSubscribedRef.current) {
                hasSubscribedRef.current = false;
                marketOrderLogManager.unsubscribe();
            }
        };
    }, [isSessionEstablished, connection]); // Only depend on session established state

    const forceRefresh = useCallback(async () => {
        if (!isSessionEstablished) {
            throw new Error('Cannot refresh: session not established');
        }

        return marketOrderLogManager.forceRefresh();
    }, [isSessionEstablished]);

    const getCachedLogPage = useCallback(() => {
        return marketOrderLogManager.getCachedLogPage();
    }, []);

    return {
        forceRefresh,
        getCachedLogPage,
    };
}
