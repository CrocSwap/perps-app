import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface UserDataStore {
    userAddress: string;
    setUserAddress: (userAddress: string) => void;
}

const LS_KEY = 'USER_DATA';

export const useUserDataStore = create<UserDataStore>()(
    persist(
        (set) => ({
            userAddress: '',
            setUserAddress: (userAddress: string) => {
                set({ userAddress });
            },
        }),
        {
            // local storage key for persisted data
            name: LS_KEY,
            storage: createJSONStorage(() => localStorage),
            version: 1,
        },
    ),
);
