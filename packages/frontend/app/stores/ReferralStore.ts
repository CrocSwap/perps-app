import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface ReferralStoreIF {
    cached: string;
    cache(refCode: string): void;
}

const LS_KEY = 'AFFILIATE_DATA';

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

export const useReferralStore = create<ReferralStoreIF>()(
    persist(
        (set) => ({
            cached: '',
            cache(refCode: string): void {
                set({ cached: refCode });
            },
        }),
        {
            name: LS_KEY,
            storage: createJSONStorage(ssrSafeStorage),
            version: 1,
        },
    ),
);
