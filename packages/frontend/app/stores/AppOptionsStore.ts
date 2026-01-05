import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// default values for the state values managed by this hook
const DEFAULTS = {
    skipOpenOrderConfirm: false,
    skipClosePositionConfirm: false,
    optOutSpotDusting: false,
    persistTradingConnection: false,
    displayVerboseErrors: false,
    enableTxNotifications: true,
    enableBackgroundFillNotif: true,
    playFillSound: false,
    animateOrderBook: true,
    clickToSetOrderBookSize: true,
    showBuysSellsOnChart: true,
    showPnL: true,
    showAllWarnings: true,
};

// string-union type of all keys in the `DEFAULTS` obj
export type appOptions = keyof typeof DEFAULTS;

// extended interface describing the shape of `DEFAULTS` and reducers
export interface useAppOptionsIF extends Record<appOptions, boolean> {
    enable: (o: appOptions) => void;
    disable: (o: appOptions) => void;
    toggle: (o: appOptions) => void;
    applyDefaults: () => void;
}

// key to identify data obj in local storage
const LS_KEY = 'APP_OPTIONS';

// hook to manage global state and local storage
export const useAppOptions = create<useAppOptionsIF>()(
    // persist data in local storage (only values, not reducers)
    persist(
        (set, get) => ({
            // consume data from the `DEFAULT` obj, persisted data from
            // ... local storage will re-hydrate if present
            ...DEFAULTS,
            // set a given option to `true`
            enable: (o: appOptions): void => {
                set({ [o]: true });
            },
            // set a given option to `false`
            disable: (o: appOptions): void => {
                set({ [o]: false });
            },
            // toggle a value `true` ⟷ `false`
            toggle: (o: appOptions): void => {
                set({ [o]: !get()[o] });
            },
            applyDefaults: (): void => {
                set(DEFAULTS);
            },
        }),
        {
            // key for local storage
            name: LS_KEY,
            // format and destination of data
            storage: createJSONStorage(() => localStorage),
        },
    ),
);
