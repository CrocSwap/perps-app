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

export interface GetUserAudiencesResponseIF {
    results: {
        id: string;
        name: string;
        badge_name: string;
        badge_description: string;
        badge_image: string;
    }[];
}
