import { create } from 'zustand';

type AppStateStore = {
    wsReconnecting: boolean;
    setWsReconnecting: (wsReconnecting: boolean) => void;
    internetConnected: boolean;
    setInternetConnected: (internetConnected: boolean) => void;
    titleOverride: string;
    setTitleOverride: (titleOverride: string) => void;
    isWsStashed: boolean;
    setIsWsStashed: (isWsStashed: boolean) => void;
    isTabActiveDelayed: boolean;
    setIsTabActiveDelayed: (isTabActiveDelayed: boolean) => void;
    debugToolbarOpen: boolean;
    setDebugToolbarOpen: (debugToolbarOpen: boolean) => void;
    liquidationsActive: boolean;
    setLiquidationsActive: (liquidationsActive: boolean) => void;
    isTabActive: boolean;
    setIsTabActive: (isTabActive: boolean) => void;
};

export const useAppStateStore = create<AppStateStore>((set) => ({
    wsReconnecting: false,
    setWsReconnecting: (wsReconnecting: boolean) => set({ wsReconnecting }),
    internetConnected: true,
    setInternetConnected: (internetConnected: boolean) =>
        set({ internetConnected }),
    titleOverride: '',
    setTitleOverride: (titleOverride: string) => set({ titleOverride }),
    isWsStashed: false,
    setIsWsStashed: (isWsStashed: boolean) => set({ isWsStashed }),
    isTabActiveDelayed: true,
    setIsTabActiveDelayed: (isTabActiveDelayed: boolean) =>
        set({ isTabActiveDelayed }),
    debugToolbarOpen: false,
    setDebugToolbarOpen: (debugToolbarOpen: boolean) =>
        set({ debugToolbarOpen }),
    liquidationsActive: true,
    setLiquidationsActive: (liquidationsActive: boolean) =>
        set({ liquidationsActive }),
    isTabActive: true,
    setIsTabActive: (isTabActive: boolean) => set({ isTabActive }),
}));
