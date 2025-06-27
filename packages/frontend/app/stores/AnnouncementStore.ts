import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// shape of the return obj produced by this store
export interface AnnouncementStoreIF {
    wasViewed: string[];
    markViewed: (a: string) => void;
    checkIfViewed: (a: string) => boolean;
}

const LS_KEY = 'ALREADY_VIEWED';

// hook to manage global state and local storage
export const useAnnouncementStore = create<AnnouncementStoreIF>()(
    // persist data in local storage (only values, not reducers)
    persist(
        (set, get) => ({
            // raw data consumed by the app
            wasViewed: [],
            // method to record an announcement as viewed
            markViewed: (a: string): void =>
                set({ wasViewed: [...get().wasViewed, a] }),
            // method to determine whether an announcement was previously viewed
            checkIfViewed: (a: string): boolean => get().wasViewed.includes(a),
        }),
        {
            // key for local storage
            name: LS_KEY,
            // format and destination of data
            storage: createJSONStorage(() => localStorage),
        },
    ),
);
