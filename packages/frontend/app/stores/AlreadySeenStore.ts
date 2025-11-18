import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const LS_KEY = 'ALREADY_VIEWED';

// shape of the return obj produced by this store
export interface AlreadySeenStoreIF {
    viewed: string[];
    checkIfViewed: (message: string) => boolean;
    markAsViewed: (message: string | string[]) => void;
}

// the actual data store
export const useViewed = create<AlreadySeenStoreIF>()(
    // persist data in local storage (only values, not reducers)
    persist(
        (set, get) => ({
            viewed: [],
            checkIfViewed: (message: string): boolean =>
                get().viewed.includes(message),
            markAsViewed: (message: string | string[]): void => {
                if (typeof message === 'string') {
                    set({
                        viewed: [...get().viewed, message],
                    });
                } else if (Array.isArray(message)) {
                    set({ viewed: get().viewed.concat(message) });
                }
            },
        }),
        {
            // key for local storage
            name: LS_KEY,
            // format and destination of data
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({ viewed: state.viewed }),
        },
    ),
);
