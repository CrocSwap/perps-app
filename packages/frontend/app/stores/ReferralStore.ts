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
    convertedWallets: string[];
    checkForConversion: (address: string) => Promise<void>;
    cache(refCode: string): void;
    cache2(refCode: string): void;
    markCodeRegistered(refCode: string, isRegistered?: boolean): void;
    markCodeApproved(refCode: string): void;
    setTotVolume(volume: number | undefined): void;
    clear(): void;
}

const LS_KEY = 'AFFILIATE_DATA';

const ssrSafeStorage = () =>
    (typeof window !== 'undefined'
        ? window.localStorage
        : {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
              clear: () => {},
              key: () => null,
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
            convertedWallets: [],
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
            markCodeRegistered(
                refCode: string,
                isRegistered: boolean = true,
            ): void {
                const codeFromCache: string = get().cached2.code;
                if (refCode === codeFromCache) {
                    set({
                        cached2: {
                            code: codeFromCache,
                            isCodeRegistered: isRegistered,
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
            async checkForConversion(address: string): Promise<void> {
                const options = {
                    method: 'GET',
                    headers: {
                        accept: 'application/json',
                        authorization:
                            'Bearer 459f44f19dd5e3d7a8e2953fb0742ed98736abc42873b6c35c4847585c781661',
                    },
                };
                fetch(
                    `https://api.fuul.xyz/api/v1/user/referrer?user_identifier=${'4BZFWXMp2cs55pZgDnMfSTciAFBXSQSN1ZPrhkKpED2q'}&user_identifier_type=solana_address`,
                    options,
                )
                    .then((res) => res.json())
                    .then((res) =>
                        console.log(
                            '🔍 [ReferralStore] checkForConversion:',
                            res.referrer_identifier,
                        ),
                    )
                    .catch((err) => console.error(err));
            },
        }),
        {
            name: LS_KEY,
            storage: createJSONStorage(ssrSafeStorage),
            partialize: (state) => ({
                cached: state.cached,
                cached2: state.cached2,
                convertedWallets: state.convertedWallets,
            }),
            version: 1,
        },
    ),
);
