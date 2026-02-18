import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface RefCodeCacheIF {
    code: string;
    isCodeRegistered: boolean | undefined;
    isCodeApprovedByInvitee: boolean | undefined;
}

export interface UserReferrerResponse {
    user_identifier: string;
    referrer_identifier: string | null;
    referrer_name: string | null;
    referrer_code: string | null;
    referrer_user_rebate_rate: number | null;
}

export interface ReferralStoreIF {
    cached: string;
    cached2: RefCodeCacheIF;
    totVolume: number | undefined;
    convertedWallets: string[];
    fetchUserReferrer: (address: string) => Promise<UserReferrerResponse[]>;
    checkForConversion: (address: string) => Promise<boolean>;
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
            async fetchUserReferrer(
                address: string,
            ): Promise<UserReferrerResponse[]> {
                console.log(
                    '🚀 [ReferralStore] fetchUserReferrer called with address:',
                    address,
                );
                // API keys for the two programs (program-specific keys route requests)
                const REFERRALS_API_KEY =
                    '459f44f19dd5e3d7a8e2953fb0742ed98736abc42873b6c35c4847585c781661';
                const AFFILIATES_API_KEY =
                    '5d1e8bc550b40b178e383343e74e90c98df063472abeb8fa697843a1c3ca1f32';
                const PROGRAM_KEYS = [AFFILIATES_API_KEY, REFERRALS_API_KEY];
                // reusable fn to send a query to FUUL for user's referrer data
                const queryFuul = async (
                    key: string,
                ): Promise<UserReferrerResponse> => {
                    const options = {
                        method: 'GET',
                        headers: {
                            accept: 'application/json',
                            authorization: `Bearer ${key}`,
                        },
                    };
                    const res = await fetch(
                        `https://api.fuul.xyz/api/v1/user/referrer?user_identifier=${address}&user_identifier_type=solana_address`,
                        options,
                    ).then((r) => r.json());
                    return res;
                };

                // create and resolve fetch requests to both programs
                const results = await Promise.all(
                    PROGRAM_KEYS.map((key) => queryFuul(key)),
                );
                console.log(
                    '🔍 [ReferralStore] affiliates result:',
                    results[0],
                );
                console.log('🔍 [ReferralStore] referrals result:', results[1]);

                return results;
            },
            async checkForConversion(address: string): Promise<boolean> {
                const persisted_wallets = get().convertedWallets;
                // return `true` without any fetch requests if indicated by persisted data
                if (persisted_wallets.includes(address)) return true;

                const results = await get().fetchUserReferrer(address);
                console.log(
                    '🔍 [ReferralStore] checkForConversion received results:',
                    results,
                );

                // user is converted if either query returns a positive result
                const isConverted = results.some(
                    (res) => !!res.referrer_identifier,
                );

                // persist the conversion status
                // if (isConverted) {
                //     set({
                //         convertedWallets: [
                //             ...persisted_wallets,
                //             address,
                //         ],
                //     });
                // }
                return isConverted;
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
