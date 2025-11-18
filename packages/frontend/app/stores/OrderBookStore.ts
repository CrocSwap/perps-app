import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type {
    OrderBookTradeIF,
    OrderBookRowIF,
    OrderRowResolutionIF,
} from '~/utils/orderbook/OrderBookIFs';

interface OrderBookStore {
    buys: OrderBookRowIF[];
    sells: OrderBookRowIF[];
    orderBook: OrderBookRowIF[];
    setOrderBook: (buys: OrderBookRowIF[], sells: OrderBookRowIF[]) => void;
    trades: OrderBookTradeIF[];
    setTrades: (trades: OrderBookTradeIF[]) => void;
    resolutionPairs: Record<string, OrderRowResolutionIF>;
    addToResolutionPair: (
        symbol: string,
        resolutionPair: OrderRowResolutionIF,
    ) => void;
}

export const useOrderBookStore = create<OrderBookStore>()(
    persist(
        (set) => ({
            orderBook: [],
            buys: [],
            sells: [],
            trades: [],
            setOrderBook: (buys: OrderBookRowIF[], sells: OrderBookRowIF[]) =>
                set({ buys, sells }),
            setTrades: (trades: OrderBookTradeIF[]) => set({ trades }),
            addToResolutionPair: (
                symbol: string,
                resolutionPair: OrderRowResolutionIF,
            ) =>
                set((state) => ({
                    resolutionPairs: {
                        ...state.resolutionPairs,
                        [symbol]: resolutionPair,
                    },
                })),
            resolutionPairs: {},
        }),
        {
            name: 'ORDERBOOK',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                resolutionPairs: state.resolutionPairs,
            }),
        },
    ),
);
