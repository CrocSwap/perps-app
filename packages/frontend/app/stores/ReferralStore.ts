import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface RefCodeIF {
    value: string;
    isConverted: boolean;
}

export interface ReferralStoreIF {
    codes: Map<string, RefCodeIF>;
    cached: {
        value: string;
        hasDismissed: boolean;
    };
    dismiss(): void;
    cache(refCode: string): void;
    getCode(address: string): RefCodeIF | undefined;
    confirmCode(address: string, refCode: RefCodeIF): void;
    isConverted: boolean;
    setIsConverted(value: boolean): void;
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

const DEFAULTS = {
    cached: {
        value: '',
        hasDismissed: false,
    },
};

export const useReferralStore = create<ReferralStoreIF>()(
    persist(
        (set, get) => ({
            codes: new Map<string, RefCodeIF>(),
            cached: DEFAULTS.cached,
            isConverted: false,
            setIsConverted(value: boolean): void {
                set({ isConverted: value });
            },
            cache(refCode: string): void {
                set({ cached: { value: refCode, hasDismissed: false } });
            },
            dismiss(): void {
                set({
                    cached: {
                        value: get().cached.value,
                        hasDismissed: true,
                    },
                });
            },
            getCode(address: string): RefCodeIF | undefined {
                return get().codes.get(address.toLowerCase());
            },
            confirmCode(address: string, refCode: RefCodeIF): void {
                set((state) => {
                    const newCodes = new Map<string, RefCodeIF>(state.codes);
                    newCodes.set(address.toLowerCase(), refCode);
                    return {
                        codes: newCodes,
                        cached: DEFAULTS.cached,
                    };
                });
            },
        }),
        {
            name: LS_KEY,
            partialize: (state) => ({
                codes: state.codes,
                cached: state.cached,
            }),
            storage: {
                getItem: (name) => {
                    const str = ssrSafeStorage().getItem(name);
                    if (!str) return null;
                    try {
                        const parsed = JSON.parse(str);
                        const codesData = parsed.state?.codes;
                        // Handle both array format (serialized) and object format
                        const codesMap = Array.isArray(codesData)
                            ? new Map(codesData)
                            : new Map();
                        return {
                            state: {
                                codes: codesMap,
                                cached: parsed.state?.cached || {
                                    value: '',
                                    hasDismissed: false,
                                },
                            },
                        };
                    } catch (error) {
                        console.error('Error parsing AFFILIATE_DATA:', error);
                        return null;
                    }
                },
                setItem: (name, value) => {
                    try {
                        const codes = value.state?.codes;
                        const codesArray =
                            codes instanceof Map
                                ? Array.from(codes.entries())
                                : Array.isArray(codes)
                                  ? codes
                                  : [];
                        const str = JSON.stringify({
                            state: {
                                codes: codesArray,
                                cached: value.state?.cached,
                            },
                        });
                        ssrSafeStorage().setItem(name, str);
                    } catch (error) {
                        console.error('Error saving AFFILIATE_DATA:', error);
                    }
                },
                removeItem: (name) => ssrSafeStorage().removeItem(name),
            },

            version: 1,
        },
    ),
);
