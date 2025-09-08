import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface UserDataStore {
    userAddress: string;
    setUserAddress: (userAddress: string) => void;
    referralCode: string;
    setReferralCode: (r: string) => void;
    clearReferralCode: () => void;
}

const LS_KEY = 'USER_DATA';

export const useUserDataStore = create<UserDataStore>()(
    persist(
        (set) => ({
            userAddress: '',
            setUserAddress: (userAddress: string) => {
                set({ userAddress });
            },
            referralCode: '',
            setReferralCode: (r: string) => set({ referralCode: r }),
            clearReferralCode: () => set({ referralCode: '' }),
        }),
        {
            name: LS_KEY,
            storage: createJSONStorage(() => localStorage),
            version: 1,
            partialize: (state: UserDataStore) => ({
                referralCode: state.referralCode,
            }),
        },
    ),
);
