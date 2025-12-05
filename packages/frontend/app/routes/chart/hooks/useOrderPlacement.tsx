import { create } from 'zustand';

export interface PendingOrder {
    price: number;
    side: 'buy' | 'sell';
    timestamp: number; // to trigger even if same price/side
}

export interface PreparedOrder {
    price: number;
    side: 'buy' | 'sell';
    type: TradeType;
    size: number;
    currency: string;
    timestamp: number;
}

export type TradeType = 'Market' | 'Limit' /* | 'Stop Market' | 'Stop Limit' */;

interface OrderPlacementStore {
    pendingOrder: PendingOrder | null;
    preparedOrder: PreparedOrder | null;
    showModal: boolean;
    modalData: { price: number; side: 'buy' | 'sell' } | null;
    quickMode: boolean;
    showQuickModeConfirm: boolean;
    quickModeBypassConfirmation: boolean;
    activeOrder: { type: TradeType; size: number; currency: string } | null;
    placeOrder: (price: number, side: 'buy' | 'sell') => void;
    clearPendingOrder: () => void;
    setPreparedOrder: (order: PreparedOrder | null) => void;
    openModal: (price: number, side: 'buy' | 'sell') => void;
    closeModal: () => void;
    confirmOrder: (order: PreparedOrder) => void;
    toggleQuickMode: () => void;
    openQuickModeConfirm: () => void;
    closeQuickModeConfirm: () => void;
    saveQuickModeSettings: (data: {
        amount: number;
        tradeType: TradeType;
        currency: string;
        bypassConfirmation: boolean;
    }) => void;
    saveAndEnableQuickMode: (data: {
        amount: number;
        tradeType: TradeType;
        currency: string;
        bypassConfirmation: boolean;
    }) => void;
    resetQuickModeState: () => void;
}

export const useOrderPlacementStore = create<OrderPlacementStore>((set) => ({
    pendingOrder: null,
    preparedOrder: null,
    showModal: false,
    modalData: null,
    quickMode: false,
    showQuickModeConfirm: false,
    quickModeBypassConfirmation: false,
    activeOrder: null,
    placeOrder: (price: number, side: 'buy' | 'sell') => {
        set({ pendingOrder: { price, side, timestamp: Date.now() } });
    },
    clearPendingOrder: () => set({ pendingOrder: null }),
    setPreparedOrder: (order: PreparedOrder | null) =>
        set({ preparedOrder: order }),
    openModal: (price: number, side: 'buy' | 'sell') => {
        set({ showModal: true, modalData: { price, side } });
    },
    closeModal: () => {
        set({ showModal: false, modalData: null });
    },
    confirmOrder: (order: PreparedOrder | null) => {
        const state = useOrderPlacementStore.getState();
        const side = state.modalData?.side || 'buy';
        set({
            pendingOrder: order,
            showModal: false,
            modalData: null,
        });
    },
    toggleQuickMode: () => {
        const state = useOrderPlacementStore.getState();

        if (!state.quickMode && !state.activeOrder) {
            set({ showQuickModeConfirm: true });
            return;
        }

        set({
            quickMode: !state.quickMode,
        });
    },
    openQuickModeConfirm: () => set({ showQuickModeConfirm: true }),
    closeQuickModeConfirm: () => set({ showQuickModeConfirm: false }),
    saveQuickModeSettings: (data: {
        amount: number;
        tradeType: TradeType;
        currency: string;
        bypassConfirmation: boolean;
    }) => {
        set({
            showQuickModeConfirm: false,
            quickModeBypassConfirmation: data.bypassConfirmation,
            activeOrder: {
                type: data.tradeType,
                size: data.amount,
                currency: data.currency,
            },
        });
    },
    saveAndEnableQuickMode: (data: {
        amount: number;
        tradeType: TradeType;
        currency: string;
        bypassConfirmation: boolean;
    }) => {
        set({
            quickMode: true,
            showQuickModeConfirm: false,
            quickModeBypassConfirmation: data.bypassConfirmation,
            activeOrder: {
                type: data.tradeType,
                size: data.amount,
                currency: data.currency,
            },
        });
    },
    resetQuickModeState: () => {
        set({
            quickMode: false,
            activeOrder: null,
            preparedOrder: null,
            quickModeBypassConfirmation: false,
        });
    },
}));
