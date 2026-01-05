import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface ReferralStoreIF {
    cached: string;
    totVolume: number | undefined;
    cache(refCode: string): void;
    setTotVolume(volume: number | undefined): void;
    clear(): void;
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
            totVolume: undefined,
            cache(refCode: string): void {
                set({ cached: refCode });
            },
            setTotVolume(volume: number | undefined): void {
                set({ totVolume: volume });
            },
            clear(): void {
                set({ cached: '', totVolume: undefined });
            },
        }),
        {
            name: LS_KEY,
            storage: createJSONStorage(ssrSafeStorage),
            partialize: (state) => ({ cached: state.cached }),
            version: 1,
        },
    ),
);
