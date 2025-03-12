import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware'

const DEFAULTS = {
    skipOpenOrderConfirm: false,
    skipClosePositionConfirm: false,
    optOutSpotDusting: false,
    persistTradingConnection: false,
    displayVerboseErrors: false,
    enableBackgroundFillNotif: true,
    playFillSound: false,
    animateOrderBook: true,
    clickToSetOrderBookSize: true,
    showBuysSellsOnChart: true,
    showPnL: true,
    showAllWarnings: true,
}

export type appOptions = keyof typeof DEFAULTS;

export interface useAppOptionsIF extends Record<appOptions, boolean> {
    enable: (o: appOptions) => void;
    disable: (o: appOptions) => void;
    toggle: (o: appOptions|appOptions[]) => void;
    applyDefaults: () => void;
}

const LS_KEY = 'APP_OPTIONS';

export const useAppOptions = create<useAppOptionsIF>()(
    persist(
        (set, get) => ({
            ...DEFAULTS,
            enable: (o: appOptions): void => set({[o]: true}),
            disable: (o: appOptions): void => set({[o]: false}),
            toggle: (o: appOptions|appOptions[]): void => {
                if (typeof o === 'string') {
                    set({[o]: !get()[o]});
                }
                if (Array.isArray(o)) {
                    const changes: Partial<Record<appOptions, boolean>> = {};
                    o.forEach((opt: appOptions) => changes[opt] = !get()[opt]);
                    set(changes);
                }
            },
            applyDefaults: (): void => set(DEFAULTS),
        }),
        {
            name: LS_KEY,
            storage: createJSONStorage(() => localStorage),
        },
    ),
)