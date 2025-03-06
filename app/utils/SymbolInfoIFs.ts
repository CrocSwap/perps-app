export interface SymbolInfoIF {
    coin: string;
    dayBaseVlm: number;
    dayNtlVlm: number;
    funding:number;
    impactPxs: number[];
    markPx: number;
    midPx: number;
    openInterest: number;
    oraclePx: number;
    premium: number;
    prevDayPx: number;
    lastPriceChange: number; // price change since last ws update
}
