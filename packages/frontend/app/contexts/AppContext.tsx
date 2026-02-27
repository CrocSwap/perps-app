import {
    isEstablished,
    useSession,
    SessionStateType,
} from '@fogo/sessions-sdk-react';
import React, {
    createContext,
    useContext,
    useEffect,
    type Dispatch,
    type SetStateAction,
} from 'react';
import { useLocation } from 'react-router';
import { useDebugStore } from '~/stores/DebugStore';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { useUserDataStore } from '~/stores/UserDataStore';
import { useAppStateStore } from '~/stores/AppStateStore';
import { initializePythPriceService } from '~/stores/PythPriceStore';

interface AppContextType {
    isUserConnected: boolean;
    setIsUserConnected: Dispatch<SetStateAction<boolean>>;
    assignDefaultAddress: () => void;
}

export const AppContext = createContext<AppContextType>({
    isUserConnected: false,
    setIsUserConnected: () => {},
    assignDefaultAddress: () => {},
});

export interface AppProviderProps {
    children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
    const {
        isDebugWalletActive,
        debugWallet,
        setDebugWallet,
        manualAddressEnabled,
        manualAddress,
        setManualAddressEnabled,
        setManualAddress,
    } = useDebugStore();

    const { setUserAddress, userAddress } = useUserDataStore();

    const { resetUserData } = useTradeDataStore();

    const sessionState = useSession();
    const location = useLocation();

    const isSessionReestablishing = useAppStateStore(
        (state) => state.isSessionReestablishing,
    );
    const setIsSessionReestablishing = useAppStateStore(
        (state) => state.setIsSessionReestablishing,
    );
    const isReestablishing = [
        SessionStateType.Initializing,
        SessionStateType.CheckingStoredSession,
        SessionStateType.RequestingLimits,
        SessionStateType.SettingLimits,
        SessionStateType.WalletConnecting,
        SessionStateType.SelectingWallet,
    ].includes(sessionState.type);

    if (isSessionReestablishing !== isReestablishing) {
        setIsSessionReestablishing(isReestablishing);
    }

    // Drive userAddress from URL parameter, session, or debug settings
    useEffect(() => {
        const { isDebugWalletActive, manualAddressEnabled, manualAddress } =
            useDebugStore.getState();

        // 1. Manual Debug Address takes highest priority
        if (
            !isDebugWalletActive &&
            manualAddressEnabled &&
            manualAddress &&
            manualAddress.length > 0
        ) {
            setUserAddress(manualAddress);
            return;
        }

        // 2. URL Address takes second priority
        const pathParts = location.pathname.split('/');
        const portfolioIdx = pathParts.indexOf('portfolio');
        const tradeHistoryIdx = pathParts.indexOf('tradeHistory');

        let urlAddr = '';
        if (portfolioIdx !== -1 && pathParts[portfolioIdx + 1]) {
            urlAddr = pathParts[portfolioIdx + 1];
        } else if (tradeHistoryIdx !== -1 && pathParts[tradeHistoryIdx + 1]) {
            urlAddr = pathParts[tradeHistoryIdx + 1];
        }

        if (urlAddr && urlAddr.length >= 32 && urlAddr.length <= 44) {
            setUserAddress(urlAddr);
            return;
        }

        // 3. Established Session takes third priority
        if (isEstablished(sessionState) && !isDebugWalletActive) {
            setUserAddress(sessionState.walletPublicKey.toString());
            return;
        }

        // 4. Fallback to Debug Wallet or Empty
        if (isDebugWalletActive) {
            setUserAddress(debugWallet.address);
        } else {
            setUserAddress('');
            resetUserData();
        }
    }, [
        location.pathname,
        sessionState,
        setUserAddress,
        resetUserData,
        isDebugWalletActive,
        debugWallet,
        manualAddressEnabled,
        manualAddress,
        userAddress,
    ]);

    // Initialize Pyth price service on mount
    useEffect(() => {
        initializePythPriceService();
    }, []);

    // Workaround for Nightly wallet bug: after a soft refresh (Cmd-R), the session
    // may be restored with a cached wallet address that differs from the currently
    // selected address in the wallet extension. This effect detects the mismatch
    // by checking the wallet's connection state and triggers session end if needed.
    const sessionStateRef = React.useRef(sessionState);
    useEffect(() => {
        sessionStateRef.current = sessionState;
    }, [sessionState]);

    useEffect(() => {
        const checkSessionHealth = () => {
            const currentSessionState = sessionStateRef.current;
            if (!isEstablished(currentSessionState)) {
                return;
            }

            const sessionAddress =
                currentSessionState.walletPublicKey.toString();
            const wallet = currentSessionState.solanaWallet;

            try {
                const isWalletConnected = wallet?.connected;
                const walletPublicKey = wallet?.publicKey?.toBase58?.();

                // Only treat it as an error if the underlying wallet is actually
                // disconnected / has no active public key while the session claims
                // to be established (the "stuck" state after Cmd-R).
                if (isWalletConnected === false || !walletPublicKey) {
                    console.warn(
                        '[AppContext] Session established but wallet is disconnected or missing publicKey. Ending session.',
                        {
                            sessionAddress,
                            isWalletConnected,
                            walletPublicKey,
                        },
                    );
                    currentSessionState.endSession();
                }
            } catch {
                // Best-effort only
            }
        };

        const timeoutId = setTimeout(checkSessionHealth, 500);
        const intervalId = setInterval(checkSessionHealth, 1000);

        const handleVisibilityOrFocus = () => {
            checkSessionHealth();
        };

        window.addEventListener('focus', handleVisibilityOrFocus);
        document.addEventListener('visibilitychange', handleVisibilityOrFocus);

        return () => {
            clearTimeout(timeoutId);
            clearInterval(intervalId);
            window.removeEventListener('focus', handleVisibilityOrFocus);
            document.removeEventListener(
                'visibilitychange',
                handleVisibilityOrFocus,
            );
        };
    }, []);

    return (
        <AppContext.Provider
            value={{
                isUserConnected: isEstablished(sessionState),
                setIsUserConnected: () => {}, // Handled by session sdk now
                assignDefaultAddress: () => {}, // Driven by effect above
            }}
        >
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => useContext(AppContext);
