export interface FetchUserReferrerResponseIF {
    user_identifier: string;
    referrer_identifier: string | null;
    referrer_name: string | null;
    referrer_code: string | null;
    referrer_user_rebate_rate: number | null;
}
