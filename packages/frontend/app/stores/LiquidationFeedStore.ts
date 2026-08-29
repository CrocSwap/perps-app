import { create } from 'zustand';

export interface LiquidationFeedEvent {
    market_id: number;
    user_pubkey: string;
    event_time: number;
    slot: number;
    order_id: number;
    fill_price: number; // raw from server, divide by 1e6 for display
    fill_qty: number; // raw from server, divide by 1e8 for display
    side: number; // 1 = Bid (long liquidated), 2 = Ask (short liquidated)
}

export interface LiquidationFeedMessage {
    market_id: number;
    events: LiquidationFeedEvent[];
}

const MAX_FEED_EVENTS = 200;

interface LiquidationFeedStore {
    events: LiquidationFeedEvent[];
    addEvents: (newEvents: LiquidationFeedEvent[]) => void;
    clearEvents: () => void;
}

export const useLiquidationFeedStore = create<LiquidationFeedStore>()(
    (set) => ({
        events: [],
        addEvents: (newEvents: LiquidationFeedEvent[]) =>
            set((state) => ({
                events: [...newEvents, ...state.events].slice(
                    0,
                    MAX_FEED_EVENTS,
                ),
            })),
        clearEvents: () => set({ events: [] }),
    }),
);
