import type {
    FetchUserReferrerResponseIF,
    GetAffiliateCodeResponseIF,
} from '~/utils/fuul/interfaces';
import type { SpotMetaIF, TokenDetailsRawIF } from '~/utils/SymbolInfoIFs';

export function fuulReferrer(
    overrides: Partial<FetchUserReferrerResponseIF> = {},
): FetchUserReferrerResponseIF {
    return {
        user_identifier: 'wallet-1',
        referrer_identifier: null,
        referrer_name: null,
        referrer_code: null,
        referrer_user_rebate_rate: null,
        ...overrides,
    };
}

export function fuulAffiliateCode(
    overrides: Partial<GetAffiliateCodeResponseIF> = {},
): GetAffiliateCodeResponseIF {
    return {
        codes: [{ code: 'abc', createdAt: '2026-06-12T00:00:00.000Z' }],
        id: 'affiliate-1',
        name: 'Affiliate',
        updated_at: '2026-06-12T00:00:00.000Z',
        user_identifier: 'wallet-1',
        user_identifier_type: 'solana_address',
        ...overrides,
    };
}

export function pythPriceUpdate(
    overrides: Partial<{
        price: string;
        expo: string;
        conf: string;
        publish_time: string;
    }> = {},
) {
    return {
        parsed: [
            {
                price: {
                    price: '100000',
                    expo: '-3',
                    conf: '100',
                    publish_time: '1781222400',
                    ...overrides,
                },
            },
        ],
    };
}

export function hyperliquidSpotMeta(
    overrides: Partial<SpotMetaIF> = {},
): SpotMetaIF {
    return {
        universe: [
            {
                tokens: [0],
                name: 'UBTC/USDC',
                index: 0,
                isCanonical: true,
            },
        ],
        tokens: [
            {
                name: 'UBTC',
                szDecimals: 5,
                weiDecimals: 8,
                index: 0,
                tokenId: '0xbtc',
                isCanonical: true,
                fullName: 'Unit Bitcoin',
            },
        ],
        ...overrides,
    };
}

export function hyperliquidTokenDetails(
    overrides: Partial<TokenDetailsRawIF> = {},
): TokenDetailsRawIF {
    return {
        name: 'UBTC',
        maxSupply: '21000000',
        totalSupply: '1000',
        circulatingSupply: '900',
        szDecimals: 5,
        weiDecimals: 8,
        midPx: '100000',
        markPx: '100100',
        prevDayPx: '99000',
        ...overrides,
    };
}

export function fogoRpcResponse<T>(
    result: T,
    id: string | number = 1,
): { jsonrpc: '2.0'; id: string | number; result: T } {
    return {
        jsonrpc: '2.0',
        id,
        result,
    };
}
