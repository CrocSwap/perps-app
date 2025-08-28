import { parseNum } from '../utils/orderbook/OrderBookUtils';
import type { SymbolInfoIF, SymbolInfoRawIF } from '../utils/SymbolInfoIFs';

export const processSymbolInfo = (payload: SymbolInfoRawIF): SymbolInfoIF => {
    try {
        return {
            coin: payload.coin,
            dayBaseVlm: parseNum(payload.ctx.dayBaseVlm),
            dayNtlVlm: parseNum(payload.ctx.dayNtlVlm),
            funding: parseNum(payload.ctx.funding),
            impactPxs: payload.ctx.impactPxs
                ? payload.ctx.impactPxs.map((e: any) => parseNum(e))
                : [],
            markPx: parseNum(payload.ctx.markPx),
            midPx: parseNum(payload.ctx.midPx),
            openInterest: parseNum(payload.ctx.openInterest),
            oraclePx: parseNum(payload.ctx.oraclePx),
            premium: parseNum(payload.ctx.premium),
            prevDayPx: parseNum(payload.ctx.prevDayPx),
            lastPriceChange: 0,
            last24hPriceChange: parseNum(
                parseNum(payload.ctx.markPx) - parseNum(payload.ctx.prevDayPx),
            ),
            last24hPriceChangePercent: parseNum(
                ((parseNum(payload.ctx.markPx) -
                    parseNum(payload.ctx.prevDayPx)) /
                    parseNum(payload.ctx.prevDayPx)) *
                    100,
            ),
            openInterestDollarized: parseNum(
                parseNum(payload.ctx.openInterest) *
                    parseNum(payload.ctx.oraclePx),
            ),
            szDecimals: payload.szDecimals,
            maxLeverage: payload.maxLeverage,
            symbol: payload.coin,
        };
    } catch (error) {
        console.error('Error processing symbol info', error);
        return {} as SymbolInfoIF;
    }
};
