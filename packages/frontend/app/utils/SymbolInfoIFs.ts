export interface SymbolInfoIF {
    coin: string;
    dayBaseVlm: number;
    dayNtlVlm: number;
    funding: number;
    impactPxs: number[];
    markPx: number;
    midPx: number;
    openInterest: number;
    oraclePx: number;
    premium: number;
    prevDayPx: number;
    lastPriceChange: number; // price change since last ws update
    last24hPriceChange: number; // price change since last 24h
    last24hPriceChangePercent: number; // price change percent since last 24h
    openInterestDollarized: number;
    szDecimals: number;
    maxLeverage: number;
}

export interface SpotMetaUniverseIF {
    tokens: number[];
    name: string;
    index: number;
    isCanonical: boolean;
}

export interface SpotMetaTokenIF {
    name: string;
    szDecimals: number;
    weiDecimals: number;
    index: number;
    tokenId: string;
    isCanonical: boolean;
    evmContract?: string;
    fullName?: string;
    deployerTradingFeeShare?: string;
}

export interface SpotMetaIF {
    universe: SpotMetaUniverseIF[];
    tokens: SpotMetaTokenIF[];
}

export interface TokenDetailsRawIF {
    name: string;
    maxSupply: string;
    totalSupply: string;
    circulatingSupply: string;
    szDecimals: number;
    weiDecimals: number;
    midPx: string;
    markPx: string;
    prevDayPx: string;
}

export interface TokenDetailsIF {
    name: string;
    maxSupply: number;
    totalSupply: number;
    circulatingSupply: number;
    szDecimals: number;
    weiDecimals: number;
    midPx: number;
    markPx: number;
    prevDayPx: number;
}
