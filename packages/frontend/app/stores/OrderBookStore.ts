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
    setOrderBook: (
        buys: OrderBookRowIF[],
        sells: OrderBookRowIF[],
        setMid?: boolean,
    ) => void;
    trades: OrderBookTradeIF[];
    setTrades: (trades: OrderBookTradeIF[]) => void;
    resolutionPairs: Record<string, OrderRowResolutionIF>;
    addToResolutionPair: (
        symbol: string,
        resolutionPair: OrderRowResolutionIF,
    ) => void;
    midPrice: number | null;
    setMidPrice: (midPrice: number) => void;
    usualResolution: OrderRowResolutionIF | null;
    setUsualResolution: (resolution: OrderRowResolutionIF) => void;
}

export const useOrderBookStore = create<OrderBookStore>()(
    persist(
        (set) => ({
            orderBook: [],
            buys: [],
            sells: [],
            trades: [],
            setOrderBook: (
                buys: OrderBookRowIF[],
                sells: OrderBookRowIF[],
                setMid?: boolean,
            ) => {
                if (setMid) {
                    set({
                        buys: buys,
                        sells: sells,
                        midPrice: (buys[0].px + sells[0].px) / 2,
                    });
                } else {
                    set({
                        buys,
                        sells,
                    });
                }
            },
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
            midPrice: null,
            setMidPrice: (midPrice: number) => set({ midPrice }),
            usualResolution: null,
            setUsualResolution: (resolution: OrderRowResolutionIF) =>
                set({ usualResolution: resolution }),
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
