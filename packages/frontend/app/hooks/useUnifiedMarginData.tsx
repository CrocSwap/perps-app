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
import { useUserDataStore } from '~/stores/UserDataStore';
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
    const sessionWalletAddress = isSessionEstablished
        ? sessionState.walletPublicKey.toString()
        : '';
    const { isDebugWalletActive, manualAddressEnabled, manualAddress } =
        useDebugStore();
    const { userAddress } = useUserDataStore();
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
        if (
            !isSessionEstablished &&
            !isDebugWalletActive &&
            !userAddress &&
            !!marginBucket
        ) {
            const store = useUnifiedMarginStore.getState();
            store.setMarginBucket(null);
        }
    }, [isSessionEstablished, isDebugWalletActive, userAddress, marginBucket]);

    useEffect(() => {
        // Track session state changes
        const sessionChanged =
            lastSessionStateRef.current !== isSessionEstablished;
        lastSessionStateRef.current = isSessionEstablished;

        // Subscribe if we have a userAddress (from URL or session or debug)
        const targetAddress =
            manualAddressEnabled && manualAddress ? manualAddress : userAddress;

        if (!targetAddress) {
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

        // Subscribe only if not already subscribed or address changed
        if (
            !hasSubscribedRef.current ||
            lastSubscribedAddressRef.current !== targetAddress ||
            forceRestart.current
        ) {
            hasSubscribedRef.current = true;
            unifiedMarginPollingManager.unsubscribe(); // Clean up previous if any
            unifiedMarginPollingManager.subscribe(
                connection,
                new PublicKey(targetAddress),
            );
            lastSubscribedAddressRef.current = targetAddress;
            forceRestart.current = false;
        }

        // Cleanup function - runs on unmount and when dependencies change
        return () => {
            // Only cleanup if the entire provider is unmounting or we explicitly want to stop
        };
    }, [isSessionEstablished, isDebugWalletActive, userAddress, manualAddress]);

    const forceRefresh = useCallback(async () => {
        if (!isSessionEstablished && !userAddress) {
            throw new Error('Cannot refresh: no address or session');
        }

        return unifiedMarginPollingManager.forceRefresh();
    }, [isSessionEstablished, userAddress]);

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
