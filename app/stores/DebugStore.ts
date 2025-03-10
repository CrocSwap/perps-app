import {create} from 'zustand';
import type { OrderBookTradeIF, OrderRowIF } from '~/utils/orderbook/OrderBookIFs';

import { wsUrls } from '~/utils/Constants';

interface DebugStore {
    wsUrl: string;
    setWsUrl: (wsUrl: string) => void;
}

export const useDebugStore = create<DebugStore>((set) => ({
    wsUrl: wsUrls[0],
    setWsUrl: (wsUrl: string) => set({ wsUrl })
}));