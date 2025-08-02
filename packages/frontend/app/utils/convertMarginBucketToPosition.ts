import type { MarginBucketAvail } from '@crocswap-libs/ambient-ember';
import { useEffect } from 'react';
import type { PositionIF } from '~/utils/position/PositionIFs';
import type { SymbolInfoIF } from '~/utils/SymbolInfoIFs';

/**
 * Convert a MarginBucketAvail from RPC to PositionIF format for display
 * @param marginBucket The margin bucket data from getUserMarginBucket
 * @param marketId The market ID (currently only 64 for BTC)
 * @returns PositionIF or null if no position exists
 */
export function convertMarginBucketToPosition(
    marginBucket: MarginBucketAvail,
    marketId: bigint = 64n,
    symbolInfo: SymbolInfoIF | null,
): PositionIF | null {
    // If no position exists, return null
    if (marginBucket.netPosition === 0n) {
        return null;
    }

    // Convert bigint values to numbers with proper decimal scaling
    const netPositionNum = Number(marginBucket.netPosition) / 1e8; // 8 decimals for position size
    const avgEntryPriceNum = Number(marginBucket.avgEntryPrice) / 1e6; // 6 decimals for price (matches on-chain format)
    // const markPriceNum = Number(marginBucket.markPrice) / 1e6; // 6 decimals for price (matches on-chain format)
    const markPriceNum = symbolInfo?.markPx || 0;
    const committedCollateralNum =
        Number(marginBucket.committedCollateral) / 1e6; // 6 decimals for USDC
    const unrealizedPnlNum = Number(marginBucket.unrealizedPnl) / 1e6; // 6 decimals for USDC

    // Calculate position value (size * mark price)
    const positionValue = Math.abs(netPositionNum * markPriceNum);

    // Calculate leverage based on position value and committed collateral
    const leverage =
        committedCollateralNum > 0 ? positionValue / committedCollateralNum : 0;

    useEffect(() => {
        console.log({
            leverage,
            committedCollateralNum,
            positionValue,
            markPriceNum,
            netPositionNum,
        });
    }, [
        leverage,
        committedCollateralNum,
        positionValue,
        markPriceNum,
        netPositionNum,
    ]);

    // Calculate max leverage from effective IM basis points
    // IM% = 100 / maxLeverage, so maxLeverage = 10000 / imBps
    const maxLeverage =
        marginBucket.effectiveImBps > 0
            ? 10000 / marginBucket.effectiveImBps
            : 100; // Default max leverage

    // Calculate liquidation price
    // For long: liqPrice = entryPrice * (1 - 1/leverage * maintenanceMarginRatio)
    // For short: liqPrice = entryPrice * (1 + 1/leverage * maintenanceMarginRatio)
    // Using MM as 50% of IM (typical ratio)
    const mmRatio = marginBucket.marketMmBps / 10000; // Convert basis points to ratio
    let liquidationPx = 0;
    if (leverage > 0 && avgEntryPriceNum > 0) {
        if (netPositionNum > 0) {
            // Long position
            liquidationPx = avgEntryPriceNum * (1 - mmRatio / leverage);
        } else {
            // Short position
            liquidationPx = avgEntryPriceNum * (1 + mmRatio / leverage);
        }
    }

    // Calculate return on equity (ROE) as unrealized PnL / committed collateral
    const returnOnEquity =
        committedCollateralNum > 0
            ? (unrealizedPnlNum / committedCollateralNum) * 100
            : 0;

    // Map to the coin based on market ID
    // Currently only BTC is supported (market ID 64)
    const coin = marketId === 64n ? 'BTC' : 'UNKNOWN';

    return {
        coin,
        entryPx: avgEntryPriceNum,
        leverage: {
            type: 'isolated', // All positions are isolated margin in this system
            value: Math.round(leverage * 10) / 10, // Round to 1 decimal place
        },
        liquidationPx,
        marginUsed: committedCollateralNum,
        maxLeverage,
        positionValue,
        returnOnEquity,
        szi: netPositionNum, // Size can be negative for short positions
        unrealizedPnl: unrealizedPnlNum,
        type: 'margin',
        cumFunding: {
            allTime: 0, // Not available from RPC
            sinceChange: 0, // Not available from RPC
            sinceOpen: 0, // Not available from RPC
        },
        // Optional TP/SL fields not available from margin bucket
        tp: undefined,
        sl: undefined,
    };
}
