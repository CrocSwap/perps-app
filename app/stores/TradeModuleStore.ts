import {create} from 'zustand';
import { setLS } from '~/utils/AppUtils';
import { NumFormatTypes } from '~/utils/Constants';
import type { NumFormat } from '~/utils/Constants';
import type { SymbolInfoIF } from '~/utils/SymbolInfoIFs';
import type {  TradeSlotIF } from '~/utils/TradeModuleIFs';



interface TradeModuleStore {
    tradeSlot: TradeSlotIF | null;
    setTradeSlot: (tradeSlot: TradeSlotIF | null) => void;
} 

export const useTradeModuleStore = create<TradeModuleStore>((set, get) => ({
    tradeSlot: null,
    setTradeSlot: (tradeSlot: TradeSlotIF | null) => set({tradeSlot}),
}));