import { useCallback, useMemo, useRef } from 'react';
import type { HorizontalLineData } from '../LiqudationLines';
import { useLiquidationStore } from '~/stores/LiquidationStore';
import {
    type LiqLevel,
    getLiqColorForValue,
} from '~/routes/trade/liquidationsChart/LiquidationUtils';
import { useTradeDataStore } from '~/stores/TradeDataStore';

// Minimum slot height in pixels
const MIN_SLOT_HEIGHT_PX = 4;
// Maximum number of slots to create (controls granularity)
const MAX_SLOT_COUNT = 200;

export const useLiqudationLines = (scaleData: any): HorizontalLineData[] => {
    const { buyLiqs, sellLiqs, liqThresholds } = useLiquidationStore();

    const { symbolInfo } = useTradeDataStore();
    const symbolPriceRef = useRef(symbolInfo?.markPx ?? 0);
    symbolPriceRef.current = symbolInfo?.markPx ?? 0;

    // Get color based on slot USD value and thresholds
    const getColor = useCallback(
        (slotSz: number): string | null => {
            const slotSzValue = slotSz * symbolPriceRef.current;
            return getLiqColorForValue(slotSzValue, liqThresholds);
        },
        [liqThresholds],
    );

    // Main computation: from raw liqs to slotted lines
    const slottedLines = useMemo((): HorizontalLineData[] => {
        if (!scaleData?.yScale) return [];

        // 1. Get chart price boundaries
        const domain = scaleData.yScale.domain();
        const minPx = Math.min(domain[0], domain[1]);
        const maxPx = Math.max(domain[0], domain[1]);
        const priceRange = maxPx - minPx;

        if (priceRange <= 0) return [];

        // 2. Merge buy and sell arrays, filter by visible range
        const allLiqs: LiqLevel[] = [...buyLiqs, ...sellLiqs].filter(
            (liq) => liq.px >= minPx && liq.px <= maxPx,
        );

        if (allLiqs.length === 0) return [];

        // 3. Calculate slot configuration
        // Get chart pixel height
        const range = scaleData.yScale.range();
        const chartHeightPx = Math.abs(range[1] - range[0]);

        // Calculate how many 4px slots would fit
        const potentialSlotCount = Math.floor(
            chartHeightPx / MIN_SLOT_HEIGHT_PX,
        );

        // Limit to MAX_SLOT_COUNT, adjust slot size if needed
        const slotCount = Math.min(potentialSlotCount, MAX_SLOT_COUNT);

        if (slotCount <= 0) return [];

        // Calculate actual slot height in pixels and price per slot
        const actualSlotHeightPx = chartHeightPx / slotCount;
        const pricePerSlot = priceRange / slotCount;

        // 4. Create slots with price ranges
        const slots: {
            minPx: number;
            maxPx: number;
            centerPx: number;
            totalSz: number;
        }[] = [];

        for (let i = 0; i < slotCount; i++) {
            const slotMinPx = minPx + i * pricePerSlot;
            const slotMaxPx = minPx + (i + 1) * pricePerSlot;
            slots.push({
                minPx: slotMinPx,
                maxPx: slotMaxPx,
                centerPx: (slotMinPx + slotMaxPx) / 2,
                totalSz: 0,
            });
        }

        // 5. Distribute liqs into slots (sum sz)
        allLiqs.forEach((liq) => {
            // Find which slot this liq belongs to
            const slotIndex = Math.floor((liq.px - minPx) / pricePerSlot);
            // Clamp to valid range (handle edge case where px === maxPx)
            const clampedIndex = Math.min(
                Math.max(slotIndex, 0),
                slotCount - 1,
            );
            slots[clampedIndex].totalSz += liq.sz;
        });

        // 6. Find max sz for ratio calculation
        const maxSz = Math.max(...slots.map((s) => s.totalSz));
        if (maxSz === 0) return [];

        // 7. Convert slots to HorizontalLineData (only non-empty slots)
        const lines: HorizontalLineData[] = [];

        slots.forEach((slot) => {
            if (slot.totalSz <= 0) return;

            const color = getColor(slot.totalSz);

            // Skip rendering if color is null (below 100K threshold - transparent)
            if (color === null) return;

            lines.push({
                yPrice: slot.centerPx,
                liqValue: slot.totalSz,
                color: color,
                strokeStyle: color,
                lineWidth: actualSlotHeightPx,
                type: 'Liq',
                dash: undefined,
                globalAlpha: 0.4,
            } as HorizontalLineData);
        });

        return lines;
    }, [
        scaleData?.yScale,
        scaleData?.yScale?.domain()?.join(','),
        scaleData?.yScale?.range()?.join(','),
        buyLiqs,
        sellLiqs,
        getColor,
    ]);

    return slottedLines;
};
