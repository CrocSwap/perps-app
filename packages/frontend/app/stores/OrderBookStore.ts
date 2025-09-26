import { create } from 'zustand';
import type {
    OrderBookTradeIF,
    OrderBookRowIF,
    OrderBookMode,
    OrderRowResolutionIF,
    OrderBookLiqIF,
} from '~/utils/orderbook/OrderBookIFs';
import { TableState } from '~/utils/CommonIFs';

interface OrderBookStore {
    buys: OrderBookRowIF[];
    sells: OrderBookRowIF[];
    highResBuys: OrderBookRowIF[];
    highResSells: OrderBookRowIF[];
    setHighResBuys: (highResBuys: OrderBookRowIF[]) => void;
    setHighResSells: (highResSells: OrderBookRowIF[]) => void;
    liqBuys: OrderBookLiqIF[];
    liqSells: OrderBookLiqIF[];
    selectedResolution: OrderRowResolutionIF | null;
    selectedMode: OrderBookMode;
    orderBookState: TableState;
    setOrderBook: (buys: OrderBookRowIF[], sells: OrderBookRowIF[]) => void;
    setSelectedResolution: (resolution: OrderRowResolutionIF | null) => void;
    setSelectedMode: (mode: OrderBookMode) => void;
    setOrderBookState: (state: TableState) => void;
    trades: OrderBookTradeIF[];
    setTrades: (trades: OrderBookTradeIF[]) => void;
    setLiqBuys: (liqBuys: OrderBookLiqIF[]) => void;
    setLiqSells: (liqSells: OrderBookLiqIF[]) => void;
    orderCount: number;
    setOrderCount: (orderCount: number) => void;
    activeOrderTab: string;
    setActiveOrderTab: (activeOrderTab: string) => void;
}

export const useOrderBookStore = create<OrderBookStore>((set, get) => ({
    buys: [],
    sells: [],
    highResBuys: [],
    highResSells: [],
    selectedResolution: null,
    selectedMode: 'symbol',
    orderBookState: TableState.LOADING,
    trades: [],
    setOrderBook: (buys: OrderBookRowIF[], sells: OrderBookRowIF[]) => {
        // const highResBuys = interpolateOrderBookData(buys);
        // const highResSells = interpolateOrderBookData(sells);
        // const { liqBuys, liqSells } = createRandomOrderBookLiq(buys, sells);
        // set({ buys, sells, highResBuys, highResSells, liqBuys, liqSells });
        set({ buys, sells });
    },
    setSelectedResolution: (selectedResolution: OrderRowResolutionIF | null) =>
        set({ selectedResolution }),
    setSelectedMode: (selectedMode: OrderBookMode) => set({ selectedMode }),
    setOrderBookState: (orderBookState: TableState) => set({ orderBookState }),
    setTrades: (trades: OrderBookTradeIF[]) => set({ trades }),
    liqBuys: [],
    liqSells: [],
    setLiqBuys: (liqBuys: OrderBookLiqIF[]) => set({ liqBuys }),
    setLiqSells: (liqSells: OrderBookLiqIF[]) => set({ liqSells }),
    setHighResBuys: (highResBuys: OrderBookRowIF[]) => set({ highResBuys }),
    setHighResSells: (highResSells: OrderBookRowIF[]) => set({ highResSells }),
    orderCount: 9,
    setOrderCount: (orderCount: number) => set({ orderCount }),
    activeOrderTab: 'Book',
    setActiveOrderTab: (activeOrderTab: string) => set({ activeOrderTab }),
}));
