import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type AppStateStore = {
    wsReconnecting: boolean;
    setWsReconnecting: (wsReconnecting: boolean) => void;
    internetConnected: boolean;
    setInternetConnected: (internetConnected: boolean) => void;
    // Timestamp of when we last came back online (for triggering refreshes)
    lastOnlineAt: number;
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

export const useAppStateStore = create<AppStateStore>()(
    persist(
        (set, get) => ({
            wsReconnecting: false,
            setWsReconnecting: (wsReconnecting: boolean) =>
                set({ wsReconnecting }),
            internetConnected: true,
            setInternetConnected: (internetConnected: boolean) => {
                const wasOffline = !get().internetConnected;
                // If we're coming back online, update the timestamp
                if (internetConnected && wasOffline) {
                    set({ internetConnected, lastOnlineAt: Date.now() });
                } else {
                    set({ internetConnected });
                }
            },
            lastOnlineAt: 0,
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
        }),
        {
            name: 'APP_STATE',
            storage: createJSONStorage(() => localStorage),
            version: 1,
            partialize: (state: AppStateStore) => ({
                debugToolbarOpen: state.debugToolbarOpen,
            }),
        },
    ),
);
