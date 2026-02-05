import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const QUICK_MODE_SETTINGS_KEY = 'perps.tv.chart.quickModeSettings';

// ============================================================================
// Types & Interfaces
// ============================================================================

export type Side = 'buy' | 'sell';
export type TradeType = 'Limit' /* | 'Stop Market' | 'Stop Limit' */;

export interface PreparedOrder {
    price: number;
    side: Side;
    type: TradeType;
    size: number;
    currency: string;
    timestamp: number;
}

export interface OrderConfig {
    tradeType: TradeType;
    size: number;
    currency: string;
    bypassConfirmation: boolean;
}

// ============================================================================
// Store State Interface
// ============================================================================

interface OrderState {
    preparedOrder: PreparedOrder | null;
}

interface QuickModeState {
    quickMode: boolean;
    showQuickModeConfirm: boolean;
    activeOrder: OrderConfig | null;
    shouldByPassConfirmation: boolean;
}

interface OrderPlacementStore extends OrderState, QuickModeState {
    showModal: boolean;
    // Order Actions
    setPreparedOrder: (order: PreparedOrder | null) => void;
    clearPreparedOrder: () => void;
    confirmOrder: (order: PreparedOrder | null) => void;

    // Modal Actions
    openModal: () => void;
    closeModal: () => void;

    // Quick Mode Actions
    toggleQuickMode: () => void;
    openQuickModeConfirm: () => void;
    closeQuickModeConfirm: () => void;
    saveQuickModeSettings: (data: OrderConfig) => void;
    saveAndEnableQuickMode: (data: OrderConfig) => void;
    resetQuickModeState: () => void;
}

// ============================================================================
// Initial State
// ============================================================================

const initialOrderState: OrderState = {
    preparedOrder: null,
};

const initialQuickModeState: QuickModeState = {
    quickMode: false,
    showQuickModeConfirm: false,
    activeOrder: null,
    shouldByPassConfirmation: false,
};

// ============================================================================
// Store Implementation
// ============================================================================

export const useOrderPlacementStore = create<OrderPlacementStore>()(
    persist(
        (set, get) => ({
            // Initial State
            ...initialOrderState,
            ...initialQuickModeState,
            showModal: false,

            // Order Actions
            setPreparedOrder: (order) => {
                set({ preparedOrder: order });
            },

            clearPreparedOrder: () => {
                set({ preparedOrder: null });
            },

            confirmOrder: (order) => {
                set({
                    preparedOrder: order,
                    showModal: false,
                });
            },

            // Modal Actions
            openModal: () => {
                set({ showModal: true });
            },

            closeModal: () => {
                set({ showModal: false });
            },

            // Quick Mode Actions
            toggleQuickMode: () => {
                const { quickMode, activeOrder } = get();

                if (!quickMode && !activeOrder) {
                    set({ showQuickModeConfirm: true });
                    return;
                }

                set({ quickMode: !quickMode });
            },

            openQuickModeConfirm: () => {
                set({ showQuickModeConfirm: true });
            },

            closeQuickModeConfirm: () => {
                set({ showQuickModeConfirm: false });
            },

            saveQuickModeSettings: (data) => {
                set({
                    showQuickModeConfirm: false,
                    activeOrder: data,
                });
            },

            saveAndEnableQuickMode: (data) => {
                set({
                    quickMode: true,
                    showQuickModeConfirm: false,
                    activeOrder: data,
                });
            },

            resetQuickModeState: () => {
                set({
                    quickMode: false,
                    preparedOrder: null,
                });
            },
        }),
        {
            name: QUICK_MODE_SETTINGS_KEY,
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({ activeOrder: state.activeOrder }),
        },
    ),
);

// ============================================================================
// Selectors
// ============================================================================

export const orderSelectors = {
    hasPreparedOrder: (state: OrderPlacementStore) =>
        state.preparedOrder !== null,
};

export const modalSelectors = {
    isModalOpen: (state: OrderPlacementStore) => state.showModal,
};

export const quickModeSelectors = {
    isQuickModeEnabled: (state: OrderPlacementStore) => state.quickMode,
    isQuickModeConfigured: (state: OrderPlacementStore) =>
        state.activeOrder !== null,
    shouldBypassConfirmation: (state: OrderPlacementStore) =>
        state.activeOrder?.bypassConfirmation ?? false,
    getActiveOrderConfig: (state: OrderPlacementStore) => state.activeOrder,
    isQuickModeConfirmOpen: (state: OrderPlacementStore) =>
        state.showQuickModeConfirm,
};

// Combined selectors
export const storeSelectors = {
    ...orderSelectors,
    ...modalSelectors,
    ...quickModeSelectors,
};
