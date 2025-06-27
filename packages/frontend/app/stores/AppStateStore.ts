import { create } from 'zustand';

type AppStateStore = {
    wsReconnecting: boolean;
    setWsReconnecting: (wsReconnecting: boolean) => void;
    internetConnected: boolean;
    setInternetConnected: (internetConnected: boolean) => void;
    titleOverride: string;
    setTitleOverride: (titleOverride: string) => void;
};

export const useAppStateStore = create<AppStateStore>((set) => ({
    wsReconnecting: false,
    setWsReconnecting: (wsReconnecting: boolean) => set({ wsReconnecting }),
    internetConnected: true,
    setInternetConnected: (internetConnected: boolean) =>
        set({ internetConnected }),
    titleOverride: '',
    setTitleOverride: (titleOverride: string) => set({ titleOverride }),
}));
