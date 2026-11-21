import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type {
    OrderBookTradeIF,
    OrderBookRowIF,
    OrderBookMode,
    OrderBookLiqIF,
    OrderRowResolutionIF,
} from '~/utils/orderbook/OrderBookIFs';
import { TableState } from '~/utils/CommonIFs';

interface OrderBookStore {
    buys: OrderBookRowIF[];
    sells: OrderBookRowIF[];
    selectedResolution: OrderRowResolutionIF | null;
    selectedMode: OrderBookMode;
    orderBook: OrderBookRowIF[];
    setOrderBook: (
        buys: OrderBookRowIF[],
        sells: OrderBookRowIF[],
        setMid?: boolean,
    ) => void;
    orderBookState: TableState;
    setSelectedResolution: (resolution: OrderRowResolutionIF | null) => void;
    setSelectedMode: (mode: OrderBookMode) => void;
    setOrderBookState: (state: TableState) => void;
    trades: OrderBookTradeIF[];
    setTrades: (trades: OrderBookTradeIF[]) => void;
    orderCount: number;
    setOrderCount: (orderCount: number) => void;
    activeOrderTab: string;
    setActiveOrderTab: (activeOrderTab: string) => void;
    resolutionPairs: Record<string, OrderRowResolutionIF>;
    addToResolutionPair: (
        symbol: string,
        resolutionPair: OrderRowResolutionIF,
    ) => void;
    midPrice: number | null;
    setMidPrice: (midPrice: number) => void;
    usualResolution: OrderRowResolutionIF | null;
    setUsualResolution: (resolution: OrderRowResolutionIF) => void;
    obMaxSell: number;
    obMinBuy: number;
    setObMaxSell: (obMaxSell: number) => void;
    setObMinBuy: (obMinBuy: number) => void;
    obMaxBuy: number;
    setObMaxBuy: (obMaxBuy: number) => void;
    obMinSell: number;
    setObMinSell: (obMinSell: number) => void;
}

export const useOrderBookStore = create<OrderBookStore>()(
    persist(
        (set) => ({
            orderBook: [],
            buys: [],
            sells: [],
            selectedResolution: null,
            selectedMode: 'symbol',
            orderBookState: TableState.LOADING,
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
            setSelectedResolution: (
                selectedResolution: OrderRowResolutionIF | null,
            ) => set({ selectedResolution }),
            setSelectedMode: (selectedMode: OrderBookMode) =>
                set({ selectedMode }),
            setOrderBookState: (orderBookState: TableState) =>
                set({ orderBookState }),
            setTrades: (trades: OrderBookTradeIF[]) => set({ trades }),
            orderCount: 9,
            setOrderCount: (orderCount: number) => set({ orderCount }),
            activeOrderTab: 'Book',
            setActiveOrderTab: (activeOrderTab: string) =>
                set({ activeOrderTab }),
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
            obMaxSell: 0,
            setObMaxSell: (obMaxSell: number) => set({ obMaxSell }),
            obMinBuy: 0,
            setObMinBuy: (obMinBuy: number) => set({ obMinBuy }),
            obMaxBuy: 0,
            setObMaxBuy: (obMaxBuy: number) => set({ obMaxBuy }),
            obMinSell: 0,
            setObMinSell: (obMinSell: number) => set({ obMinSell }),
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
