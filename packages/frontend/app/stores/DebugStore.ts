import { create } from 'zustand';

import { debugWallets, wsEnvironments, wsUrls } from '~/utils/Constants';

export type DebugWallet = {
    label: string;
    address: string;
};

interface DebugStore {
    wsUrl: string;
    setWsUrl: (wsUrl: string) => void;
    wsEnvironment: 'mock' | 'hl' | 'local' | 'mainnet' | 'testnet';
    setWsEnvironment: (
        wsEnvironment: 'mock' | 'hl' | 'local' | 'mainnet' | 'testnet',
    ) => void;
    debugWallet: DebugWallet;
    setDebugWallet: (debugWallet: DebugWallet) => void;
    isWsEnabled: boolean;
    setIsWsEnabled: (isWsEnabled: boolean) => void;
    sdkEnabled: boolean;
    setSdkEnabled: (sdkEnabled: boolean) => void;
    isWsSleepMode: boolean;
    setIsWsSleepMode: (isWsSleepMode: boolean) => void;
    isDebugWalletActive: boolean;
    setIsDebugWalletActive: (isDebugWalletActive: boolean) => void;
    usePythOracle: boolean;
    setUsePythOracle: (usePythOracle: boolean) => void;
    manualAddressEnabled: boolean;
    setManualAddressEnabled: (manualAddressEnabled: boolean) => void;
    manualAddress: string;
    setManualAddress: (manualAddress: string) => void;

    useMockLeverage: boolean;
    setUseMockLeverage: (useMockLeverage: boolean) => void;
    mockMinimumLeverage: number;
    setMockMinimumLeverage: (mockMinimumLeverage: number) => void;
    pauseLiqAnimation: boolean;
    setPauseLiqAnimation: (pauseLiqAnimation: boolean) => void;
}

export const useDebugStore = create<DebugStore>((set) => ({
    wsUrl: wsUrls[2],
    setWsUrl: (wsUrl: string) => set({ wsUrl }),
    wsEnvironment: wsEnvironments[1].value as
        | 'mock'
        | 'hl'
        | 'local'
        | 'mainnet'
        | 'testnet',
    setWsEnvironment: (wsEnvironment: string) =>
        set({
            wsEnvironment: wsEnvironment as
                | 'mock'
                | 'hl'
                | 'local'
                | 'mainnet'
                | 'testnet',
        }),
    debugWallet: debugWallets[2],
    setDebugWallet: (debugWallet: DebugWallet) => set({ debugWallet }),
    isWsEnabled: true,
    setIsWsEnabled: (isWsEnabled: boolean) => set({ isWsEnabled }),
    sdkEnabled: true,
    setSdkEnabled: (sdkEnabled: boolean) => set({ sdkEnabled }),
    isWsSleepMode: false,
    setIsWsSleepMode: (isWsSleepMode: boolean) => set({ isWsSleepMode }),
    isDebugWalletActive: false,
    setIsDebugWalletActive: (isDebugWalletActive: boolean) =>
        set({ isDebugWalletActive }),
    usePythOracle: true, // Default to Pyth as requested
    setUsePythOracle: (usePythOracle: boolean) => set({ usePythOracle }),
    manualAddressEnabled: false,
    setManualAddressEnabled: (manualAddressEnabled: boolean) => {
        if (!manualAddressEnabled) {
            set({ manualAddress: '' });
        }
        set({ manualAddressEnabled });
    },
    manualAddress: '',
    setManualAddress: (manualAddress: string) => set({ manualAddress }),
    useMockLeverage: false,
    setUseMockLeverage: (useMockLeverage: boolean) => set({ useMockLeverage }),
    mockMinimumLeverage: 1,
    setMockMinimumLeverage: (mockMinimumLeverage: number) =>
        set({ mockMinimumLeverage }),
    pauseLiqAnimation: false,
    setPauseLiqAnimation: (pauseLiqAnimation: boolean) =>
        set({ pauseLiqAnimation }),
}));
