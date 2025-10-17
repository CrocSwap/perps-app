// canonical $ ↔ % conversions
export const pctFromDollars = (
    dollars: number,
    entryPrice: number,
    effectiveQty: number,
) =>
    Number.isFinite(dollars) && entryPrice > 0 && effectiveQty > 0
        ? (dollars / (entryPrice * effectiveQty)) * 100
        : NaN;

export const dollarsFromPct = (
    pct: number,
    entryPrice: number,
    effectiveQty: number,
) =>
    Number.isFinite(pct) && entryPrice > 0 && effectiveQty > 0
        ? (pct / 100) * entryPrice * effectiveQty
        : NaN;
