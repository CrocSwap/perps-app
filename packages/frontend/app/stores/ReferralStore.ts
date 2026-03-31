import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Fuul, UserIdentifierType } from '@fuul/sdk';

export interface CachedRefCodeIF {
    // ref code created for referral use
    code: string;
    // indicates the invitee wants to use this code
    isApproved: boolean;
    // increments on explicit approvals to allow one-shot downstream triggers
    approvalNonce: number;
}

export interface UserReferrerResponse {
    user_identifier: string;
    referrer_identifier: string | null;
    referrer_name: string | null;
    referrer_code: string | null;
    referrer_user_rebate_rate: number | null;
}

export interface AffiliateCodeResponse {
    id: string;
    name: string | null;
    code: string;
    user_identifier: string;
    user_identifier_type: string;
    updated_at: string;
    created_at: string;
    uses: number;
    clicks: number;
    total_users: number;
    total_earnings: number;
    user_rebate_rate: number | null;
}

export interface ClaimCheckIF {
    project_address: string;
    to: string;
    currency: string;
    currency_type: number;
    amount: string;
    reason: number;
    token_id: string;
    deadline: number;
    proof: string;
    signatures: string[];
}

export interface ReferralStoreIF {
    cached: CachedRefCodeIF;
    totVolume: number | undefined;
    convertedWallets: string[];
    claims: ClaimCheckIF[] | null;
    rewardHistory: any[] | null;
    fetchUserReferrer: (address: string) => Promise<UserReferrerResponse[]>;
    getRefCodeByPubKey: (
        userIdentifier: string,
    ) => Promise<AffiliateCodeResponse | null>;
    checkForConversion: (address: string) => Promise<boolean>;
    fetchClaims: (address: string) => Promise<void>;
    fetchRewardHistory: (address: string) => Promise<void>;
    cache(refCode: string, isApproved?: boolean): void;
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
            cached: {
                code: '',
                isApproved: false,
                approvalNonce: 0,
            } as CachedRefCodeIF,
            convertedWallets: [],
            totVolume: undefined,
            claims: null,
            rewardHistory: null,
            cache(refCode: string, isApproved: boolean = false): void {
                const current = get().cached;
                // Don't overwrite if current code is approved and new code is unapproved
                if (current.isApproved && !isApproved) {
                    return;
                }
                const nextIsApproved =
                    isApproved ||
                    (current.isApproved && current.code === refCode);
                set({
                    cached: {
                        code: refCode,
                        isApproved: nextIsApproved,
                        approvalNonce: isApproved
                            ? current.approvalNonce + 1
                            : current.approvalNonce,
                    },
                });
            },
            markCodeApproved(refCode: string): void {
                // Update cached with approval
                const currentCached = get().cached;
                if (refCode === currentCached.code) {
                    set({
                        cached: {
                            code: refCode,
                            isApproved: true,
                            approvalNonce: currentCached.approvalNonce + 1,
                        },
                    });
                }
            },
            setTotVolume(volume: number | undefined): void {
                set({ totVolume: volume });
            },
            clear(): void {
                set({
                    cached: { code: '', isApproved: false, approvalNonce: 0 },
                    totVolume: undefined,
                    claims: null,
                });
            },
            async fetchClaims(address: string): Promise<void> {
                // Clear existing claims data immediately
                set({ claims: null });

                if (!address) {
                    return;
                }

                const options = {
                    method: 'POST',
                    headers: {
                        accept: 'application/json',
                        'content-type': 'application/json',
                        authorization:
                            'Bearer 459f44f19dd5e3d7a8e2953fb0742ed98736abc42873b6c35c4847585c781661',
                    },
                    body: JSON.stringify({
                        userIdentifierType: 'solana_address',
                        userIdentifier: address,
                    }),
                };

                try {
                    console.log(
                        '🔍 [ReferralStore] fetchClaims calling API for address:',
                        address,
                    );
                    const res = await fetch(
                        'https://api.fuul.xyz/api/v1/claim-checks/claim',
                        options,
                    );
                    console.log(
                        '🔍 [ReferralStore] fetchClaims response status:',
                        res.status,
                    );
                    const data = await res.json();
                    console.log('🔍 [ReferralStore] fetchClaims result:', data);
                    console.log(
                        '🔍 [ReferralStore] fetchClaims is array:',
                        Array.isArray(data),
                    );
                    set({
                        claims: Array.isArray(data)
                            ? data
                            : (data?.claims ?? data?.data ?? []),
                    });
                } catch (err) {
                    console.error('❌ [ReferralStore] fetchClaims error:', err);
                    set({ claims: [] });
                }
            },
            async fetchRewardHistory(address: string): Promise<void> {
                set({ rewardHistory: null });

                if (!address) {
                    return;
                }

                const options = {
                    method: 'GET',
                    headers: {
                        accept: 'application/json',
                        authorization:
                            'Bearer 459f44f19dd5e3d7a8e2953fb0742ed98736abc42873b6c35c4847585c781661',
                    },
                };

                try {
                    console.log(
                        '🔍 [ReferralStore] fetchRewardHistory calling API for address:',
                        address,
                    );
                    const res = await fetch(
                        `https://api.fuul.xyz/api/v1/claim-checks/rewards-payouts?user_identifier=${address}&user_identifier_type=solana_address`,
                        options,
                    );
                    console.log(
                        '🔍 [ReferralStore] fetchRewardHistory response status:',
                        res.status,
                    );
                    const data = await res.json();
                    console.log(
                        '🔍 [ReferralStore] fetchRewardHistory result:',
                        data,
                    );

                    // Store claimchecks directly (API already filters by user)
                    console.log(
                        '🔍 [ReferralStore] fetchRewardHistory claimchecks:',
                        data.claimchecks,
                    );
                    set({ rewardHistory: data.claimchecks });
                } catch (err) {
                    console.error(
                        '❌ [ReferralStore] fetchRewardHistory error:',
                        err,
                    );
                    set({ rewardHistory: [] });
                }
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
            async getRefCodeByPubKey(
                userIdentifier: string,
            ): Promise<AffiliateCodeResponse | null> {
                console.log(
                    '🚀 [ReferralStore] getRefCodeByPubKey called with:',
                    userIdentifier,
                );
                try {
                    const res = await fetch(
                        `https://api.fuul.xyz/api/v1/affiliates/${userIdentifier}?identifier_type=solana_address`,
                        {
                            method: 'GET',
                            headers: { accept: 'application/json' },
                        },
                    );
                    if (!res.ok) {
                        if (res.status === 404) {
                            console.log(
                                '🔍 [ReferralStore] getRefCodeByPubKey: user has no code',
                            );
                            return null;
                        }
                        throw new Error(`HTTP ${res.status}`);
                    }
                    const data: AffiliateCodeResponse = await res.json();
                    console.log(
                        '🔍 [ReferralStore] getRefCodeByPubKey result:',
                        data,
                    );
                    return data;
                } catch (err) {
                    console.error(
                        '❌ [ReferralStore] getRefCodeByPubKey error:',
                        err,
                    );
                    return null;
                }
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
                convertedWallets: state.convertedWallets,
            }),
            version: 4,
            migrate: (persistedState: unknown, version: number) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                let state = (persistedState ?? {}) as Record<string, any>;

                if (version < 2) {
                    // Migrate cached from string to object
                    let newCached: CachedRefCodeIF;
                    if (typeof state.cached === 'string') {
                        newCached = {
                            code: state.cached,
                            isApproved: false,
                            approvalNonce: 0,
                        };
                    } else if (
                        state.cached &&
                        typeof state.cached === 'object'
                    ) {
                        newCached = {
                            code:
                                typeof state.cached.code === 'string'
                                    ? state.cached.code
                                    : '',
                            isApproved: state.cached.isApproved === true,
                            approvalNonce:
                                typeof state.cached.approvalNonce === 'number'
                                    ? state.cached.approvalNonce
                                    : 0,
                        };
                    } else {
                        newCached = {
                            code: '',
                            isApproved: false,
                            approvalNonce: 0,
                        };
                    }
                    state = { ...state, cached: newCached };
                }

                if (version < 3) {
                    // Remove deprecated cached2 from persisted state
                    const { cached2, ...rest } = state;
                    state = rest;
                }

                if (version < 4) {
                    const cached =
                        state.cached && typeof state.cached === 'object'
                            ? state.cached
                            : { code: '', isApproved: false };
                    state = {
                        ...state,
                        cached: {
                            code:
                                typeof cached.code === 'string'
                                    ? cached.code
                                    : '',
                            isApproved: cached.isApproved === true,
                            approvalNonce:
                                typeof cached.approvalNonce === 'number'
                                    ? cached.approvalNonce
                                    : 0,
                        },
                    };
                }

                return state;
            },
        },
    ),
);
