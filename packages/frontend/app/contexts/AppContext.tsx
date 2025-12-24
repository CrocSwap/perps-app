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
    const [fogoAddress, setFogoAddress] = useState('');

    // Initialize Pyth price service on mount
    useEffect(() => {
        initializePythPriceService();
    }, []);

    const bindEmptyAddress = useCallback(() => {
        if (isDebugWalletActive) {
            setUserAddress(debugWallets[2].address);
        } else {
            setUserAddress('');
        }
        resetUserData();
    }, [isDebugWalletActive, resetUserData, setUserAddress]);

    const assignDefaultAddress = useCallback(() => {
        if (isDebugWalletActive) {
            if (fogoAddress === '') {
                bindEmptyAddress();
            } else {
                const walletToSet = fogoAddress.match(/^[a-zA-Z]/)
                    ? debugWallets[0]
                    : debugWallets[1];
                setUserAddress(walletToSet.address);
                setDebugWallet(walletToSet);
            }
            setManualAddressEnabled(false);
            setManualAddress('');
        } else {
            if (fogoAddress === '') {
                bindEmptyAddress();
            } else {
                setUserAddress(fogoAddress);
            }
        }
    }, [
        bindEmptyAddress,
        fogoAddress,
        isDebugWalletActive,
        setDebugWallet,
        setManualAddress,
        setManualAddressEnabled,
        setUserAddress,
    ]);

    const sessionWalletAddress = isEstablished(sessionState)
        ? sessionState.walletPublicKey.toString()
        : '';

    useEffect(() => {
        if (isEstablished(sessionState)) {
            setFogoAddress(sessionWalletAddress);
        } else {
            setFogoAddress('');
            bindEmptyAddress();
        }
    }, [sessionWalletAddress, sessionState, bindEmptyAddress]);

    useEffect(() => {
        assignDefaultAddress();
    }, [isDebugWalletActive, fogoAddress]);

    useEffect(() => {
        if (debugWallet && isDebugWalletActive) {
            setUserAddress(debugWallet.address);
        }
    }, [debugWallet, isDebugWalletActive]);

    useEffect(() => {
        if (
            manualAddressEnabled &&
            manualAddress !== '' &&
            manualAddress !== undefined
        ) {
            setUserAddress(manualAddress);
        } else {
            if (isDebugWalletActive) {
            } else {
                setUserAddress(fogoAddress);
            }
        }
    }, [manualAddressEnabled, manualAddress, isDebugWalletActive, fogoAddress]);

    return (
        <AppContext.Provider
            value={{
                isUserConnected,
                setIsUserConnected,
                assignDefaultAddress,
            }}
        >
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => useContext(AppContext);
