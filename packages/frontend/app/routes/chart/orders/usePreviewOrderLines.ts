import { useEffect, useRef, useState } from 'react';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import type { LineData } from './component/LineComponent';
import { quantityTextFormatWithComma } from './customOrderLineUtils';
import { useChartLinesStore } from '~/stores/ChartLinesStore';

export const usePreviewOrderLines = (): {
    obPreviewLine: LineData | null;
    updateYPosition: (yPrice: number) => void;
} => {
    const { orderInputPriceValue, isPreviewOrderHovered } = useTradeDataStore();
    const isPreviewOrderHoveredRef = useRef(isPreviewOrderHovered);
    isPreviewOrderHoveredRef.current = isPreviewOrderHovered;
    const { obPreviewLine, setObPreviewLine } = useChartLinesStore();

    const updateYPosition = (yPrice: number) => {
        setObPreviewLine({
            xLoc: 0.4,
            yPrice: yPrice,
            color: isPreviewOrderHoveredRef.current ? '#d4cc45' : '#e9e980',
            type: 'PREVIEW_ORDER',
            lineStyle: 2,
            lineWidth: 1,
        });
    };

    useEffect(() => {
        if (!orderInputPriceValue.value) {
            setObPreviewLine(null);
            return;
        } else {
            setObPreviewLine({
                xLoc: 0.4,
                yPrice: orderInputPriceValue.value,
                color: isPreviewOrderHoveredRef.current ? '#d4cc45' : '#e9e980',
                type: 'PREVIEW_ORDER',
                lineStyle: 2,
                lineWidth: 1,
            });
        }
    }, [orderInputPriceValue.value]);

    return { obPreviewLine, updateYPosition };
};
