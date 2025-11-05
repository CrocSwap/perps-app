import type { MarginBucketAvail } from '@crocswap-libs/ambient-ember';
import {
    isEstablished,
    useConnection,
    useSession,
} from '@fogo/sessions-sdk-react';
import { Connection, PublicKey } from '@solana/web3.js';
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    createContext,
    useContext,
} from 'react';
import { unifiedMarginPollingManager } from '~/services/UnifiedMarginPollingManager';
import { useDebugStore } from '~/stores/DebugStore';
import { useUnifiedMarginStore } from '~/stores/UnifiedMarginStore';
import { RPC_ENDPOINT } from '~/utils/Constants';
import type { PositionIF } from '~/utils/position/PositionIFs';
import type { UserBalanceIF } from '~/utils/UserDataIFs';

interface UnifiedMarginDataContextType {
    marginBucket: MarginBucketAvail | null;
    balance: UserBalanceIF | null;
    positions: PositionIF[];
    isLoading: boolean;
    error: string | null;
    lastUpdateTime: number;
    forceRefresh: () => Promise<void>;
}

export const UnifiedMarginDataContext =
    createContext<UnifiedMarginDataContextType>({
        marginBucket: null,
        balance: null,
        positions: [],
        isLoading: false,
        error: null,
        lastUpdateTime: 0,
        forceRefresh: () => Promise.resolve(),
    });

export interface UnifiedMarginDataProviderProps {
    children: React.ReactNode;
}

export const UnifiedMarginDataProvider: React.FC<
    UnifiedMarginDataProviderProps
> = ({ children }) => {
    const sessionState = useSession();
    const connection = useConnection();
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

    // backup side effect to clear margin bucket if set after logout
    useEffect(() => {
        if (!isSessionEstablished && !isDebugWalletActive && !!marginBucket) {
            const store = useUnifiedMarginStore.getState();
            store.setMarginBucket(null);
        }
    }, [isSessionEstablished, isDebugWalletActive, marginBucket]);

    useEffect(() => {
        // Track session state changes
        const sessionChanged =
            lastSessionStateRef.current !== isSessionEstablished;
        lastSessionStateRef.current = isSessionEstablished;

        if (!isSessionEstablished || isDebugWalletActive) {
            const store = useUnifiedMarginStore.getState();
            store.setMarginBucket(null);
            // Only unsubscribe if we were actually subscribed
            if (hasSubscribedRef.current) {
                hasSubscribedRef.current = false;
                // Clear the store first
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
                connection,
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
                    connection,
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
                        connection,
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

    return (
        <UnifiedMarginDataContext.Provider
            value={{
                marginBucket,
                balance,
                positions,
                isLoading,
                error,
                lastUpdateTime,
                forceRefresh,
            }}
        >
            {children}
        </UnifiedMarginDataContext.Provider>
    );
};

export const useUnifiedMarginData = () => useContext(UnifiedMarginDataContext);
