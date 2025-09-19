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

const ssrSafeStorage = () =>
    (typeof window !== 'undefined'
        ? window.localStorage
        : {
              getItem: (_key: string) => null,
              setItem: (_key: string, _value: string) => {},
              removeItem: (_key: string) => {},
              clear: () => {},
              key: (_index: number) => null,
              length: 0,
          }) as Storage;

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
            storage: createJSONStorage(ssrSafeStorage),
            version: 1,
            partialize: (state: UserDataStore) => ({
                referralCode: state.referralCode,
            }),
        },
    ),
);
