import { isEstablished, useSession } from '@fogo/sessions-sdk-react';
import React, {
    createContext,
    useContext,
    useEffect,
    useState,
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
