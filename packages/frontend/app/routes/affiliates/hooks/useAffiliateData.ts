import { useState, useEffect, useCallback } from 'react';
import { Fuul, UserIdentifierType } from '@fuul/sdk';
import type { ReferrerPayoutData } from '@fuul/sdk';

function isNotFoundError(err: unknown): boolean {
    if (err instanceof Error) {
        const message = err.message.toLowerCase();
        return (
            message.includes('not found') ||
            message.includes('404') ||
            message.includes('status code 404')
        );
    }

    if (typeof err === 'object' && err !== null) {
        const errorObj = err as Record<string, unknown>;
        if (errorObj.statusCode === 404 || errorObj.status === 404) {
            return true;
        }
        if (errorObj.response && typeof errorObj.response === 'object') {
            const response = errorObj.response as Record<string, unknown>;
            return response.status === 404 || response.statusCode === 404;
        }
    }

    return false;
}

// Types
export interface ReferredUserData {
    volume: number;
    earnings: {
        currency: {
            address: string | null;
            chainId: string | null;
        };
        amount: number;
    }[];
    dateJoined: string;
    rebateRate: number;
}

export type ReferredUserEntry = Record<string, ReferredUserData>;

export interface UserPayoutMovement {
    date: string;
    currency_address: string;
    chain_id: number;
    is_referrer: boolean;
    conversion_id: string;
    conversion_name: string;
    total_amount: string;
    project_name: string;
    payout_status: string;
    payout_status_details: string | null;
}

export interface UserPayoutMovementsResponse {
    total_results: number;
    page: number;
    page_size: number;
    results: UserPayoutMovement[];
}

export interface AffiliateStats {
    total_earnings: Array<{ amount: number; currency: string }> | null;
    referred_volume: number | null;
    referred_users: number | null;
    newTraders: number;
    activeTraders: number;
    isRegistered: boolean;
}

// Hook for affiliate audience check
export function useAffiliateAudience(userIdentifier: string, enabled = true) {
    const [data, setData] = useState<{
        audiences: { results?: Array<{ id: string }> };
        isAffiliateAccepted: boolean;
    } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchData = useCallback(async () => {
        if (!enabled || !userIdentifier) return;

        setIsLoading(true);
        setError(null);

        try {
            // Disabled SDK call, using direct fetch instead
            // const audiences = await Fuul.getUserAudiences({
            //     user_identifier: userIdentifier,
            //     user_identifier_type: UserIdentifierType.SolanaAddress,
            // });

            const apiKey =
                '6e6cf24f708ecb688968212aa9ee0b4b2774a5070bcc054e4f1c920969d7cc89';
            const url = `https://api.fuul.xyz/api/v1/audiences/audience-segments/user?user_identifier=${userIdentifier}&user_identifier_type=solana_address`;

            const headers = {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            };

            console.log('FUUL getUserAudiences request:', { url, headers });

            const response = await fetch(url, { method: 'GET', headers });
            console.log(
                'FUUL getUserAudiences response status:',
                response.status,
            );

            if (!response.ok) {
                const text = await response.text();
                console.error('FUUL getUserAudiences error:', text);
                throw new Error(text);
            }

            const audiences = await response.json();
            console.log('FUUL getUserAudiences success:', audiences);

            const isAffiliateAccepted = (audiences.results?.length ?? 0) > 0;

            setData({
                audiences,
                isAffiliateAccepted,
            });
        } catch (err) {
            setError(
                err instanceof Error
                    ? err
                    : new Error('Failed to fetch audience'),
            );
        } finally {
            setIsLoading(false);
        }
    }, [userIdentifier, enabled]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, isLoading, error, refetch: fetchData };
}

// Hook for affiliate stats
export function useAffiliateStats(userIdentifier: string, enabled = true) {
    const [data, setData] = useState<AffiliateStats | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchData = useCallback(async () => {
        if (!enabled || !userIdentifier) return;

        setIsLoading(true);
        setError(null);

        try {
            const getDateRange30Days = () => {
                const to = new Date().toISOString();
                const from = new Date(
                    Date.now() - 30 * 24 * 60 * 60 * 1000,
                ).toISOString();
                return { from, to };
            };

            const apiKey =
                'ae8178229c5e89378386e6f6535c12212b12693dab668eb4dc9200600ae698b6';
            const headers = {
                accept: 'application/json',
                authorization: `Bearer ${apiKey}`,
            };

            // Fetch affiliate stats
            const statsUrl = `https://api.fuul.xyz/api/v1/affiliate-portal/stats?user_identifier=${userIdentifier}&user_identifier_type=solana_address`;
            console.log('FUUL getAffiliateStats request:', { url: statsUrl });
            const statsRes = await fetch(statsUrl, { method: 'GET', headers });
            console.log(
                'FUUL getAffiliateStats response status:',
                statsRes.status,
            );
            if (!statsRes.ok) {
                const text = await statsRes.text();
                console.error('FUUL getAffiliateStats error:', text);
                throw new Error(text);
            }
            const stats = await statsRes.json();
            console.log('FUUL getAffiliateStats success:', stats);

            // Fetch new traders (all time)
            const newTradersUrl = `https://api.fuul.xyz/api/v1/affiliate-portal/new-traders?user_identifier=${userIdentifier}`;
            console.log('FUUL getAffiliateNewTraders request:', {
                url: newTradersUrl,
            });
            const newTradersRes = await fetch(newTradersUrl, {
                method: 'GET',
                headers,
            });
            console.log(
                'FUUL getAffiliateNewTraders response status:',
                newTradersRes.status,
            );
            if (!newTradersRes.ok) {
                const text = await newTradersRes.text();
                console.error('FUUL getAffiliateNewTraders error:', text);
                throw new Error(text);
            }
            const newTradersData = await newTradersRes.json();
            console.log('FUUL getAffiliateNewTraders success:', newTradersData);

            // Fetch active traders (last 30 days)
            const { from, to } = getDateRange30Days();
            const activeTradersUrl = `https://api.fuul.xyz/api/v1/affiliate-portal/new-traders?user_identifier=${userIdentifier}&from=${from}&to=${to}`;
            console.log('FUUL getAffiliateNewTraders (30d) request:', {
                url: activeTradersUrl,
            });
            const activeTradersRes = await fetch(activeTradersUrl, {
                method: 'GET',
                headers,
            });
            console.log(
                'FUUL getAffiliateNewTraders (30d) response status:',
                activeTradersRes.status,
            );
            if (!activeTradersRes.ok) {
                const text = await activeTradersRes.text();
                console.error('FUUL getAffiliateNewTraders (30d) error:', text);
                throw new Error(text);
            }
            const activeTradersData = await activeTradersRes.json();
            console.log(
                'FUUL getAffiliateNewTraders (30d) success:',
                activeTradersData,
            );

            const newTraders =
                newTradersData.length > 0
                    ? parseInt(newTradersData[0].total_new_traders, 10) || 0
                    : 0;

            const activeTraders =
                activeTradersData.length > 0
                    ? parseInt(activeTradersData[0].total_new_traders, 10) || 0
                    : 0;

            setData({
                ...stats,
                newTraders,
                activeTraders,
                isRegistered: true,
            });
        } catch (err) {
            if (isNotFoundError(err)) {
                setData({
                    total_earnings: null,
                    referred_volume: null,
                    referred_users: null,
                    newTraders: 0,
                    activeTraders: 0,
                    isRegistered: false,
                });
            } else {
                setError(
                    err instanceof Error
                        ? err
                        : new Error('Failed to fetch stats'),
                );
            }
        } finally {
            setIsLoading(false);
        }
    }, [userIdentifier, enabled]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, isLoading, error, refetch: fetchData };
}

// Hook for payouts by referrer
export function usePayoutsByReferrer(userIdentifier: string, enabled = true) {
    const [data, setData] = useState<ReferredUserEntry[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchData = useCallback(async () => {
        if (!enabled || !userIdentifier) return;

        setIsLoading(true);
        setError(null);

        try {
            // Disabled SDK call, using direct fetch instead
            // const response = await Fuul.getPayoutsByReferrer({
            //     user_identifier: userIdentifier,
            //     user_identifier_type: UserIdentifierType.SolanaAddress,
            // });

            const apiKey =
                'ae8178229c5e89378386e6f6535c12212b12693dab668eb4dc9200600ae698b6';
            const url = `https://api.fuul.xyz/api/v1/payouts/by-referrer?user_identifier=${userIdentifier}&user_identifier_type=solana_address`;
            const headers = {
                accept: 'application/json',
                authorization: `Bearer ${apiKey}`,
            };

            console.log('FUUL getPayoutsByReferrer request:', { url, headers });

            const res = await fetch(url, { method: 'GET', headers });
            console.log(
                'FUUL getPayoutsByReferrer response status:',
                res.status,
            );

            if (!res.ok) {
                if (res.status === 404) {
                    setData([]);
                    return;
                }
                const text = await res.text();
                console.error('FUUL getPayoutsByReferrer error:', text);
                throw new Error(text);
            }

            const response = await res.json();
            console.log('FUUL getPayoutsByReferrer success:', response);

            const transformedData = response.map(
                (item: Record<string, ReferrerPayoutData>) => {
                    const userId = Object.keys(item)[0];
                    const userData = item[userId];

                    const transformedUserData: ReferredUserData = {
                        volume: userData.volume,
                        earnings: userData.earnings,
                        dateJoined: userData.date_joined,
                        rebateRate:
                            ((
                                userData as ReferrerPayoutData & {
                                    user_rebate_rate?: number;
                                }
                            ).user_rebate_rate ?? 0) * 100,
                    };

                    return { [userId]: transformedUserData };
                },
            );

            setData(transformedData);
        } catch (err) {
            if (isNotFoundError(err)) {
                setData([]);
            } else {
                setError(
                    err instanceof Error
                        ? err
                        : new Error('Failed to fetch payouts'),
                );
            }
        } finally {
            setIsLoading(false);
        }
    }, [userIdentifier, enabled]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, isLoading, error, refetch: fetchData };
}

// Hook for user referrer
export function useUserReferrer(userIdentifier: string, enabled = true) {
    const [data, setData] = useState<{
        referrer_user_rebate_rate?: number | null;
        referrer_code?: string | null;
    } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchData = useCallback(async () => {
        if (!enabled || !userIdentifier) return;

        setIsLoading(true);
        setError(null);

        try {
            // Disabled SDK call, using direct fetch instead
            // const response = await Fuul.getUserReferrer({
            //     user_identifier: userIdentifier,
            //     user_identifier_type: UserIdentifierType.SolanaAddress,
            // });

            const apiKey =
                'ae8178229c5e89378386e6f6535c12212b12693dab668eb4dc9200600ae698b6';
            const url = `https://api.fuul.xyz/api/v1/user/referrer?user_identifier=${userIdentifier}&user_identifier_type=solana_address`;
            const headers = {
                accept: 'application/json',
                authorization: `Bearer ${apiKey}`,
            };

            console.log('FUUL getUserReferrer request:', { url, headers });

            const res = await fetch(url, { method: 'GET', headers });
            console.log('FUUL getUserReferrer response status:', res.status);

            if (!res.ok) {
                if (res.status === 404) {
                    setData({
                        referrer_user_rebate_rate: null,
                        referrer_code: null,
                    });
                    return;
                }
                const text = await res.text();
                console.error('FUUL getUserReferrer error:', text);
                throw new Error(text);
            }

            const response = await res.json();
            console.log('FUUL getUserReferrer success:', response);
            setData(response);
        } catch (err) {
            if (isNotFoundError(err)) {
                setData({
                    referrer_user_rebate_rate: null,
                    referrer_code: null,
                });
            } else {
                setError(
                    err instanceof Error
                        ? err
                        : new Error('Failed to fetch referrer'),
                );
            }
        } finally {
            setIsLoading(false);
        }
    }, [userIdentifier, enabled]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, isLoading, error, refetch: fetchData };
}

// Hook for user payout movements
export function useUserPayoutMovements(userIdentifier: string, enabled = true) {
    const [data, setData] = useState<UserPayoutMovementsResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchData = useCallback(async () => {
        if (!enabled || !userIdentifier) return;

        setIsLoading(true);
        setError(null);

        try {
            // Disabled SDK call, using direct fetch instead
            // const response = await Fuul.getUserPayoutMovements({
            //     user_identifier: userIdentifier,
            //     identifier_type: UserIdentifierType.SolanaAddress,
            // });

            const apiKey =
                'ae8178229c5e89378386e6f6535c12212b12693dab668eb4dc9200600ae698b6';
            const url = `https://api.fuul.xyz/api/v1/payouts/movements?user_identifier=${userIdentifier}&identifier_type=solana_address&type=onchain-currency`;
            const headers = {
                accept: 'application/json',
                authorization: `Bearer ${apiKey}`,
            };

            console.log('FUUL getUserPayoutMovements request:', {
                url,
                headers,
            });

            const res = await fetch(url, { method: 'GET', headers });
            console.log(
                'FUUL getUserPayoutMovements response status:',
                res.status,
            );

            if (!res.ok) {
                if (res.status === 404) {
                    setData({
                        total_results: 0,
                        page: 1,
                        page_size: 10,
                        results: [],
                    });
                    return;
                }
                const text = await res.text();
                console.error('FUUL getUserPayoutMovements error:', text);
                throw new Error(text);
            }

            const response = await res.json();
            console.log('FUUL getUserPayoutMovements success:', response);
            setData(response);
        } catch (err) {
            if (isNotFoundError(err)) {
                setData({
                    total_results: 0,
                    page: 1,
                    page_size: 10,
                    results: [],
                });
            } else {
                setError(
                    err instanceof Error
                        ? err
                        : new Error('Failed to fetch payout movements'),
                );
            }
        } finally {
            setIsLoading(false);
        }
    }, [userIdentifier, enabled]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, isLoading, error, refetch: fetchData };
}

// Hook for affiliate code
export function useAffiliateCode(userIdentifier: string, enabled = true) {
    const [data, setData] = useState<{
        code: string;
        created_at: string;
        clicks: number;
        total_users: number;
        total_earnings: number;
        user_rebate_rate?: number;
    } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const fetchData = useCallback(async () => {
        if (!enabled || !userIdentifier) return;

        setIsLoading(true);
        setError(null);

        try {
            // Disabled SDK call, using direct fetch instead
            // const response = await Fuul.getAffiliateCode(
            //     userIdentifier,
            //     UserIdentifierType.SolanaAddress,
            // );

            const url = `https://api.fuul.xyz/api/v1/affiliates/${userIdentifier}?identifier_type=solana_address`;
            const headers = { accept: 'application/json' };

            console.log('FUUL getAffiliateCode request:', { url, headers });

            const res = await fetch(url, { method: 'GET', headers });
            console.log('FUUL getAffiliateCode response status:', res.status);

            if (!res.ok) {
                if (res.status === 404) {
                    setData(null);
                    return;
                }
                const text = await res.text();
                console.error('FUUL getAffiliateCode error:', text);
                throw new Error(text);
            }

            const response = await res.json();
            console.log('FUUL getAffiliateCode success:', response);
            setData(response);
        } catch (err) {
            if (isNotFoundError(err)) {
                setData(null);
            } else {
                setError(
                    err instanceof Error
                        ? err
                        : new Error('Failed to fetch affiliate code'),
                );
            }
        } finally {
            setIsLoading(false);
        }
    }, [userIdentifier, enabled]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { data, isLoading, error, refetch: fetchData };
}
