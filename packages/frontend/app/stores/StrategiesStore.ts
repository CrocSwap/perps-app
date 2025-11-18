import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { generateSolanaAddress } from '~/utils/functions/makeAddress';

export interface strategyIF {
    name: string;
    market: string | 'BTC' | 'ETH' | 'SOL';
    distance: string;
    distanceType: string | 'Ticks' | '%';
    side: string | 'Both' | 'Above' | 'Below';
    totalSize: string;
    orderSize: string;
    isPaused: boolean;
}

export interface strategyDecoratedIF extends strategyIF {
    address: string;
    collateral: string;
    pnl: string;
    volume: string;
    maxDrawdown: string;
    ordersPlaced: number;
    runtime: number;
}

function decorateStrategy(s: strategyIF): strategyDecoratedIF {
    return {
        ...s,
        address: generateSolanaAddress(),
        collateral: '$100,000.00',
        pnl: '$0.00',
        volume: '$0.00',
        maxDrawdown: '0.00%',
        ordersPlaced: 0,
        runtime: 0,
        isPaused: false,
    };
}

// local storage key to persist data
const LS_KEY = 'STRATEGIES';

const MOCK_STRATEGIES: strategyDecoratedIF[] = [
    {
        address: '0xECB63caA47c7c4E77F60f1cE858Cf28dC2B82b00',
        name: 'Confirm Order Table Working',
        market: 'BTC',
        distance: '2',
        distanceType: 'Ticks',
        side: 'Both',
        totalSize: '$100,000.00',
        orderSize: '$10,000.00',
        pnl: '$0.00',
        volume: '$0.00',
        maxDrawdown: '0.00%',
        ordersPlaced: 0,
        runtime: 0,
        collateral: '$100,000.00',
        isPaused: false,
    },
    {
        address: 'Hfdarm6DDC8t141wvqvPVHLE5ZGBfUvB2LjkyZCbwASo',
        name: 'My First Strategy',
        market: 'BTC',
        distance: '2',
        distanceType: 'Ticks',
        side: 'Both',
        totalSize: '$100,000.00',
        orderSize: '$10,000.00',
        pnl: '$0.00',
        volume: '$0.00',
        maxDrawdown: '0.00%',
        ordersPlaced: 0,
        runtime: 0,
        collateral: '$100,000.00',
        isPaused: false,
    },
];

export const NEW_STRATEGY_DEFAULTS: strategyIF = {
    name: '',
    market: 'BTC',
    distance: '',
    distanceType: 'Ticks',
    side: 'Both',
    totalSize: '',
    orderSize: '',
    isPaused: false,
};

export interface useStrategiesStoreIF {
    data: strategyDecoratedIF[];
    update: (s: strategyIF, addr: string) => void;
    togglePause: (addr: string) => void;
    add: (s: strategyIF) => void;
    remove: (addr: string) => void;
    reset: () => void;
}

export const useStrategiesStore = create<useStrategiesStoreIF>()(
    // persist data in local storage (only values, not reducers)
    persist(
        (set, get) => ({
            // consume default data from the `MOCK_STRATEGIES` obj, persisted
            // ... data from local storage will re-hydrate if present
            data: MOCK_STRATEGIES,
            update: (s: strategyIF, addr: string): void => {
                set({
                    data: get().data.map((d: strategyDecoratedIF) => {
                        if (d.address === addr) {
                            return {
                                ...s,
                                address: d.address,
                                pnl: d.pnl,
                                volume: d.volume,
                                maxDrawdown: d.maxDrawdown,
                                ordersPlaced: d.ordersPlaced,
                                runtime: d.runtime,
                                collateral: d.collateral,
                            };
                        } else {
                            return d;
                        }
                    }),
                });
            },
            // togglePause: (addr: string): void => null,
            togglePause: (addr: string): void => {
                set({
                    data: get().data.map((d: strategyDecoratedIF) => {
                        if (d.address === addr) {
                            const toUpdate: strategyDecoratedIF = d;
                            toUpdate.isPaused = !toUpdate.isPaused;
                            return toUpdate;
                        } else {
                            return d;
                        }
                    }),
                });
            },
            add: (s: strategyIF): void => {
                set({
                    data: [...get().data, decorateStrategy(s)],
                });
            },
            remove: (addr: string): void => {
                set({
                    data: get().data.filter(
                        (d: strategyDecoratedIF) => d.address !== addr,
                    ),
                });
            },
            reset: (): void => {
                set({ data: MOCK_STRATEGIES });
            },
        }),
        {
            // key for local storage
            name: LS_KEY,
            // format and destination of data
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({ data: state.data }),
        },
    ),
);
