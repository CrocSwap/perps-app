import { isEstablished, useSession } from '@fogo/sessions-sdk-react';
import { Connection, PublicKey } from '@solana/web3.js';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { unifiedMarginPollingManager } from '~/services/UnifiedMarginPollingManager';
import { useDebugStore } from '~/stores/DebugStore';
import { useUnifiedMarginStore } from '~/stores/UnifiedMarginStore';
import { RPC_ENDPOINT } from '~/utils/Constants';

export function useUnifiedMarginData() {
    const sessionState = useSession();
    const hasSubscribedRef = useRef(false);
    const lastSessionStateRef = useRef<boolean>(false);

    // Get store data using selectors to avoid re-renders
    const marginBucket = useUnifiedMarginStore((state) => state.marginBucket);
    const balance = useUnifiedMarginStore((state) => state.balance);
    const positions = useUnifiedMarginStore((state) => state.positions);
    const isLoading = useUnifiedMarginStore((state) => state.isLoading);
    const error = useUnifiedMarginStore((state) => state.error);
    const lastUpdateTime = useUnifiedMarginStore(
        (state) => state.lastUpdateTime,
    );

    const isSessionEstablished = isEstablished(sessionState);
    const { isDebugWalletActive, manualAddressEnabled, manualAddress } =
        useDebugStore();
    const isDebugWalletActiveRef = useRef(isDebugWalletActive);
    isDebugWalletActiveRef.current = isDebugWalletActive;
    const forceRestart = useRef(false);

    const lastSubscribedAddressRef = useRef<string>('');

    const defaultConnection = useMemo(() => {
        const connection = new Connection(RPC_ENDPOINT, 'confirmed');
        return connection;
    }, []);

    useEffect(() => {
        // Track session state changes
        const sessionChanged =
            lastSessionStateRef.current !== isSessionEstablished;
        lastSessionStateRef.current = isSessionEstablished;

        if (!isSessionEstablished || isDebugWalletActive) {
            // Only unsubscribe if we were actually subscribed
            if (hasSubscribedRef.current) {
                hasSubscribedRef.current = false;
                // Clear the store first
                const store = useUnifiedMarginStore.getState();
                store.setMarginBucket(null);
                store.setBalance(null);
                store.setPositions([]);
                store.setError(null);
                store.setIsLoading(true);
                store.setLastUpdateTime(0);
                if (isDebugWalletActiveRef.current) {
                    forceRestart.current = true;
                }
                // Then unsubscribe
                unifiedMarginPollingManager.unsubscribe();
            }
            return;
        }

        // Subscribe only if not already subscribed and session just became established
        if (
            (!hasSubscribedRef.current && sessionChanged) ||
            forceRestart.current
        ) {
            hasSubscribedRef.current = true;
            unifiedMarginPollingManager.subscribe(
                sessionState.connection,
                sessionState.walletPublicKey,
            );
            lastSubscribedAddressRef.current =
                sessionState.walletPublicKey.toString();
            forceRestart.current = false;
        }

        // Cleanup function - runs on unmount and when dependencies change
        return () => {
            if (hasSubscribedRef.current) {
                hasSubscribedRef.current = false;
                // Clear the store first
                const store = useUnifiedMarginStore.getState();
                store.setMarginBucket(null);
                store.setBalance(null);
                store.setPositions([]);
                store.setError(null);
                store.setIsLoading(true);
                store.setLastUpdateTime(0);
                if (isDebugWalletActiveRef.current) {
                    forceRestart.current = true;
                }
                // Then unsubscribe
                unifiedMarginPollingManager.unsubscribe();
            }
        };
    }, [isSessionEstablished, isDebugWalletActive]); // Only depend on session established state

    useEffect(() => {
        if (isDebugWalletActiveRef.current) {
            return;
        }

        if (manualAddressEnabled && manualAddress && manualAddress.length > 0) {
            if (
                lastSubscribedAddressRef.current !== manualAddress &&
                isSessionEstablished
            ) {
                unifiedMarginPollingManager.unsubscribe();
                unifiedMarginPollingManager.subscribe(
                    sessionState.connection,
                    new PublicKey(manualAddress),
                );
                lastSubscribedAddressRef.current = manualAddress;
                hasSubscribedRef.current = true;
            } else {
                unifiedMarginPollingManager.unsubscribe();
                unifiedMarginPollingManager.subscribe(
                    defaultConnection,
                    new PublicKey(manualAddress),
                );
                lastSubscribedAddressRef.current = manualAddress;
                hasSubscribedRef.current = true;
            }
        } else {
            if (isSessionEstablished) {
                if (
                    lastSubscribedAddressRef.current !==
                    sessionState.walletPublicKey.toString()
                ) {
                    unifiedMarginPollingManager.unsubscribe();
                    unifiedMarginPollingManager.subscribe(
                        sessionState.connection,
                        sessionState.walletPublicKey,
                    );
                    lastSubscribedAddressRef.current =
                        sessionState.walletPublicKey.toString();
                    hasSubscribedRef.current = true;
                }
            }
        }
    }, [
        manualAddressEnabled,
        manualAddress,
        isSessionEstablished,
        defaultConnection,
    ]);

    const forceRefresh = useCallback(async () => {
        if (!isSessionEstablished) {
            throw new Error('Cannot refresh: session not established');
        }

        return unifiedMarginPollingManager.forceRefresh();
    }, [isSessionEstablished]);

    return {
        marginBucket,
        balance,
        positions,
        isLoading,
        error,
        lastUpdateTime,
        forceRefresh,
    };
}
