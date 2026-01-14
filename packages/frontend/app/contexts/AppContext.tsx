import { isEstablished, useSession } from '@fogo/sessions-sdk-react';
import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    useRef,
    type Dispatch,
    type SetStateAction,
} from 'react';
import { useCallback } from 'react';
import { useLocation } from 'react-router';
import { useDebugStore } from '~/stores/DebugStore';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { useUserDataStore } from '~/stores/UserDataStore';
import { initializePythPriceService } from '~/stores/PythPriceStore';
import { debugWallets } from '~/utils/Constants';

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
    const [isUserConnected, setIsUserConnected] = useState(false);

    const {
        isDebugWalletActive,
        debugWallet,
        setDebugWallet,
        manualAddressEnabled,
        manualAddress,
        setManualAddressEnabled,
        setManualAddress,
    } = useDebugStore();

    const { setUserAddress } = useUserDataStore();

    const { resetUserData } = useTradeDataStore();

    const sessionState = useSession();
    const location = useLocation();

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
    ]);

    // Initialize Pyth price service on mount
    useEffect(() => {
        initializePythPriceService();
    }, []);

    // Workaround for Nightly wallet bug: after a soft refresh (Cmd-R), the session
    // may be restored with a cached wallet address that differs from the currently
    // selected address in the wallet extension. This effect detects the mismatch
    // by checking the wallet's connection state and triggers session end if needed.
    useEffect(() => {
        if (!isEstablished(sessionState)) {
            return;
        }

        const sessionAddress = sessionState.walletPublicKey.toString();
        const wallet = sessionState.solanaWallet;

        // Check for wallet connection issues
        const checkWalletMismatch = () => {
            // Check if wallet is disconnected
            const isWalletConnected = wallet?.connected;
            console.log('[AppContext] Checking wallet state:', {
                isWalletConnected,
                walletPublicKey: wallet?.publicKey?.toBase58?.(),
                sessionAddress,
            });

            // If wallet is not connected, end the session
            if (isWalletConnected === false) {
                console.warn(
                    '[AppContext] Wallet not connected. Ending session.',
                );
                sessionState.endSession();
                return;
            }

            // Check if wallet has no publicKey
            const walletPublicKey = wallet?.publicKey?.toBase58?.();
            if (!walletPublicKey) {
                console.warn(
                    '[AppContext] Wallet has no publicKey. Ending session.',
                );
                sessionState.endSession();
                return;
            }

            // Check if wallet's current address differs from session
            if (walletPublicKey !== sessionAddress) {
                console.warn(
                    '[AppContext] Wallet address mismatch. ' +
                        `Session: ${sessionAddress}, Wallet: ${walletPublicKey}. Ending session.`,
                );
                sessionState.endSession();
                return;
            }

            // Also check wallet standard accounts array
            // @ts-expect-error wallet.wallet types are not fully typed
            const accounts = wallet?.wallet?.accounts;
            if (Array.isArray(accounts) && accounts.length > 0) {
                const currentAddress = accounts[0]?.address;
                if (currentAddress && currentAddress !== sessionAddress) {
                    console.warn(
                        '[AppContext] Wallet standard address mismatch. ' +
                            `Session: ${sessionAddress}, Wallet: ${currentAddress}. Ending session.`,
                    );
                    sessionState.endSession();
                }
            }
        };

        // Check after a short delay to allow wallet extension to update
        const timeoutId = setTimeout(checkWalletMismatch, 500);

        // Also listen for wallet standard "change" events
        let removeListener: (() => void) | undefined;
        try {
            // @ts-expect-error wallet.wallet types are not fully typed
            const eventsFeature = wallet?.wallet?.features?.['standard:events'];
            if (eventsFeature?.on) {
                removeListener = eventsFeature.on(
                    'change',
                    (event: { accounts?: Array<{ address: string }> }) => {
                        if (event.accounts && event.accounts.length > 0) {
                            const newAddress = event.accounts[0]?.address;
                            if (newAddress && newAddress !== sessionAddress) {
                                console.warn(
                                    '[AppContext] Wallet address changed. ' +
                                        `Session: ${sessionAddress}, New: ${newAddress}. Ending session.`,
                                );
                                sessionState.endSession();
                            }
                        }
                    },
                );
            }
        } catch {
            // Wallet doesn't support standard:events
        }

        return () => {
            clearTimeout(timeoutId);
            removeListener?.();
        };
    }, [sessionState]);

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
