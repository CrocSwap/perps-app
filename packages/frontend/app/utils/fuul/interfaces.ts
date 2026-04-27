export interface FetchUserReferrerResponseIF {
    user_identifier: string;
    referrer_identifier: string | null;
    referrer_name: string | null;
    referrer_code: string | null;
    referrer_user_rebate_rate: number | null;
}

export interface GetAffiliateCodeResponseIF {
    codes: { code: string; createdAt: string }[];
    id: string;
    name: string;
    updated_at: string;
    user_identifier: string;
    user_identifier_type: 'solana_address';
}
