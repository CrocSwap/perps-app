import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface RefCodeCacheIF {
    code: string;
    isCodeRegistered: boolean | undefined;
    isCodeApprovedByInvitee: boolean | undefined;
}

export interface ReferralStoreIF {
    cached: string;
    cached2: RefCodeCacheIF;
    totVolume: number | undefined;
    cache(refCode: string): void;
    cache2(refCode: string): void;
    markCodeRegistered(refCode: string): void;
    markCodeApproved(refCode: string): void;
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
        (set, get) => ({
            cached: '',
            cached2: {
                code: '',
                isCodeRegistered: undefined,
                isCodeApprovedByInvitee: undefined,
            },
            totVolume: undefined,
            cache(refCode: string): void {
                set({ cached: refCode });
            },
            cache2(refCode: string): void {
                set({
                    cached2: {
                        code: refCode,
                        isCodeRegistered: undefined,
                        isCodeApprovedByInvitee: undefined,
                    },
                });
            },
            markCodeRegistered(refCode: string): void {
                const codeFromCache: string = get().cached2.code;
                if (refCode === codeFromCache) {
                    set({
                        cached2: {
                            code: codeFromCache,
                            isCodeRegistered: true,
                            isCodeApprovedByInvitee:
                                get().cached2.isCodeApprovedByInvitee,
                        },
                    });
                } else {
                    const dataForError = {
                        cached: codeFromCache,
                        approvalReceivedFor: refCode,
                    };
                    console.error(
                        'Code in LS cache does not match code queried for registration.',
                        dataForError,
                    );
                }
            },
            markCodeApproved(refCode: string): void {
                const codeFromCache: string = get().cached2.code;
                if (refCode === codeFromCache) {
                    set({
                        cached2: {
                            code: codeFromCache,
                            isCodeRegistered: get().cached2.isCodeRegistered,
                            isCodeApprovedByInvitee: true,
                        },
                    });
                } else {
                    const dataForError = {
                        cached: codeFromCache,
                        approvalReceivedFor: refCode,
                    };
                    console.error(
                        'Code in LS cache does not match code queried for approval.',
                        dataForError,
                    );
                }
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
