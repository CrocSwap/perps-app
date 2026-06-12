import type { LineData } from './LineComponent';

export type ChartElementCancelIntent =
    | { type: 'clearSelection' }
    | { type: 'restorePreviewPrice'; price: number };

export type ChartElementConfirmIntent =
    | { type: 'noop' }
    | { type: 'previewToOrderForm'; price: number }
    | { type: 'confirmExistingOrderLine' };

export function getChartElementCancelIntent(
    selectedOrderLine: (LineData & { originalPrice?: number }) | undefined,
    originalPrice: number | null,
): ChartElementCancelIntent {
    if (selectedOrderLine?.type === 'PREVIEW_ORDER' && originalPrice !== null) {
        return { type: 'restorePreviewPrice', price: originalPrice };
    }

    return { type: 'clearSelection' };
}

export function getChartElementConfirmIntent(
    selectedOrderLine: LineData | undefined,
): ChartElementConfirmIntent {
    if (!selectedOrderLine) {
        return { type: 'noop' };
    }

    if (selectedOrderLine.type === 'PREVIEW_ORDER') {
        return {
            type: 'previewToOrderForm',
            price: selectedOrderLine.yPrice,
        };
    }

    return { type: 'confirmExistingOrderLine' };
}
