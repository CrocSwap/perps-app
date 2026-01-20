export const BTC_MARKET_ID = 64n;

export const MARKET_ID_TO_NAME = new Map<bigint, string>([
    [BTC_MARKET_ID, 'BTC'],
]);

type MarketIdLike = bigint | number | string;

function normalizeMarketId(marketId: MarketIdLike): bigint | undefined {
    if (typeof marketId === 'bigint') return marketId;
    if (typeof marketId === 'number') {
        if (!Number.isFinite(marketId) || !Number.isInteger(marketId)) return;
        return BigInt(marketId);
    }

    const trimmed = marketId.trim();
    if (!trimmed) return;

    try {
        return BigInt(trimmed);
    } catch {
        return;
    }
}

export function getMarketNameById(marketId: MarketIdLike): string | undefined {
    const normalized = normalizeMarketId(marketId);
    if (normalized === undefined) return;
    return MARKET_ID_TO_NAME.get(normalized);
}

export function getMarketNameByIdOrFallback(
    marketId: MarketIdLike,
    fallback = 'UNKNOWN',
): string {
    return getMarketNameById(marketId) ?? fallback;
}
