import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import {
    PythPriceService,
    type PythPriceData,
} from '~/services/pythPriceService';

interface PythPriceStore {
    // Price data map: symbol -> price data
    prices: Map<string, PythPriceData>;

    // Connection status
    isConnected: boolean;

    // Active subscriptions
    activeSubscriptions: Set<string>;

    // Actions
    setPrice: (symbol: string, priceData: PythPriceData) => void;
    setConnectionStatus: (isConnected: boolean) => void;
    subscribeToSymbol: (symbol: string) => void;
    unsubscribeFromSymbol: (symbol: string) => void;
    getPrice: (symbol: string) => PythPriceData | undefined;
    clearPrices: () => void;
}

export const usePythPriceStore = create<PythPriceStore>()(
    subscribeWithSelector((set, get) => ({
        prices: new Map(),
        isConnected: false,
        activeSubscriptions: new Set(),

        setPrice: (symbol: string, priceData: PythPriceData) => {
            set((state) => {
                const newPrices = new Map(state.prices);
                newPrices.set(symbol, priceData);
                return { prices: newPrices };
            });
        },

        setConnectionStatus: (isConnected: boolean) => {
            set({ isConnected });
        },

        subscribeToSymbol: async (symbol: string) => {
            const state = get();
            if (state.activeSubscriptions.has(symbol)) {
                return; // Already subscribed
            }

            // Add to active subscriptions
            set((state) => {
                const newSubscriptions = new Set(state.activeSubscriptions);
                newSubscriptions.add(symbol);
                return { activeSubscriptions: newSubscriptions };
            });

            // Subscribe via the service
            const service = PythPriceService.getInstance();
            await service.subscribeToSymbol(symbol);
        },

        unsubscribeFromSymbol: (symbol: string) => {
            set((state) => {
                const newSubscriptions = new Set(state.activeSubscriptions);
                newSubscriptions.delete(symbol);

                const newPrices = new Map(state.prices);
                newPrices.delete(symbol);

                return {
                    activeSubscriptions: newSubscriptions,
                    prices: newPrices,
                };
            });

            // Unsubscribe via the service
            const service = PythPriceService.getInstance();
            service.unsubscribeFromSymbol(symbol);
        },

        getPrice: (symbol: string) => {
            return get().prices.get(symbol);
        },

        clearPrices: () => {
            set({
                prices: new Map(),
                activeSubscriptions: new Set(),
            });
        },
    })),
);

// Initialize the Pyth price service and connect it to the store
let serviceInitialized = false;

export function initializePythPriceService(): void {
    if (serviceInitialized) {
        return;
    }

    const service = PythPriceService.getInstance();
    const store = usePythPriceStore.getState();

    // Subscribe to price updates
    service.onPriceUpdate((symbol, priceData) => {
        store.setPrice(symbol, priceData);
    });

    // Subscribe to connection status changes
    service.onConnectionStatusChange((isConnected) => {
        store.setConnectionStatus(isConnected);
    });

    serviceInitialized = true;
}

// Selector hooks for common use cases
export const usePythPrice = (symbol: string): PythPriceData | undefined => {
    return usePythPriceStore((state) => state.prices.get(symbol));
};

export const usePythConnectionStatus = (): boolean => {
    return usePythPriceStore((state) => state.isConnected);
};

export const useAllPythPrices = (): Map<string, PythPriceData> => {
    return usePythPriceStore((state) => state.prices);
};
