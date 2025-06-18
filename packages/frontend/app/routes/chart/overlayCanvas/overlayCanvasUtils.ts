import type { IChartingLibraryWidget, IPaneApi } from '~/tv/charting_library';
import type { LineData } from '../orders/component/LineComponent';
import type { LabelLocation } from '../orders/orderLineUtils';

export type LabelLocationData = { label: LabelLocation; parentLine: LineData };

export function findLimitLabelAtPosition(
    x: number,
    y: number,
    drawnLabels: LineData[],
    isCancel: boolean,
): { label: LabelLocation; parentLine: LineData } | null {
    for (let i = drawnLabels.length - 1; i >= 0; i--) {
        if (drawnLabels[i].type !== 'LIMIT') continue;
        const labelLocs = drawnLabels[i].labelLocations;
        if (!labelLocs) continue;

        for (const loc of labelLocs) {
            const isLocCancel = loc.type === 'Cancel';

            if (isCancel === isLocCancel) {
                const startX = loc.x;
                const endX = loc.x + loc.width;
                const startY = loc.y;
                const endY = loc.y + loc?.height;

                if (x >= startX && x <= endX && y >= startY && y <= endY) {
                    return { label: loc, parentLine: drawnLabels[i] };
                }
            }
        }
    }
    return null;
}

export function getXandYLocationForChartDrag(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    event: any,
    rect: DOMRect,
) {
    let offsetY = event.sourceEvent.clientY - rect?.top;
    let offsetX = event.sourceEvent.clientX - rect?.left;

    if (
        typeof TouchEvent !== 'undefined' &&
        event.sourceEvent instanceof TouchEvent
    ) {
        offsetY = event.sourceEvent.touches[0].clientY;
        offsetX = event.sourceEvent.touches[0].clientX - rect?.left;
    }

    return { offsetX: offsetX, offsetY: offsetY };
}

export const getPixelToPrice = (
    chart: IChartingLibraryWidget,
    yPixel: number,
    chartHeight?: number,
): number | null => {
    const dpr = window.devicePixelRatio || 1;
    const textHeight = 15 * dpr;

    const priceScalePane = chart.activeChart().getPanes()[0] as IPaneApi;
    const priceScale = priceScalePane.getMainSourcePriceScale();

    if (!priceScale) return null;

    const priceRange = priceScale.getVisiblePriceRange();
    const chartHeightTemp = chartHeight
        ? chartHeight
        : priceScalePane.getHeight();

    if (!priceRange) return null;

    const maxPrice = priceRange.to;
    const minPrice = priceRange.from;
    const isLogarithmic = priceScale.getMode() === 1;

    // düzelt: TWCL'deki hesaplamada textHeight/2 offset uygulanmıştı, onu geri ekliyoruz
    const adjustedYPixel = chartHeightTemp - yPixel - textHeight / 2;

    if (isLogarithmic) {
        if (minPrice > 0) {
            const logMinPrice = Math.log(minPrice);
            const logMaxPrice = Math.log(maxPrice);

            const priceDifference = logMaxPrice - logMinPrice;
            const ratio = adjustedYPixel / chartHeightTemp;
            const logPrice = ratio * priceDifference + logMinPrice;

            return Math.exp(logPrice);
        } else {
            const logMaxPrice = Math.log(maxPrice);
            const upperHeight =
                (logMaxPrice * chartHeightTemp) /
                (logMaxPrice + Math.abs(minPrice));

            const minHeight = chartHeightTemp - upperHeight;
            const pixel0 = minHeight - adjustedYPixel;

            const ratio = pixel0 / upperHeight;
            const logPrice = ratio * logMaxPrice;

            return Math.exp(logPrice);
        }
    } else {
        const priceDifference = maxPrice - minPrice;
        const ratio = adjustedYPixel / chartHeightTemp;
        const price = ratio * priceDifference + minPrice;

        return price;
    }
};
