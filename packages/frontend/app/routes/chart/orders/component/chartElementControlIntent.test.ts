import { describe, expect, it } from 'vitest';
import {
    getChartElementCancelIntent,
    getChartElementConfirmIntent,
} from './chartElementControlIntent';
import type { LineData } from './LineComponent';

const previewLine: LineData = {
    xLoc: 0.4,
    yPrice: 101000,
    quantityTextValue: 1,
    quantityText: '1.00',
    color: '#3b82f6',
    type: 'PREVIEW_ORDER',
    lineStyle: 3,
    lineWidth: 1,
    side: 'buy',
    textValue: { type: 'Limit', price: 101000, triggerCondition: '' },
};

const existingLimitLine: LineData = {
    ...previewLine,
    type: 'LIMIT',
    oid: 123,
};

describe('chart element control intents', () => {
    it('restores preview order price before clearing a cancelled edit', () => {
        expect(
            getChartElementCancelIntent(
                { ...previewLine, yPrice: 102000, originalPrice: 101000 },
                101000,
            ),
        ).toEqual({ type: 'restorePreviewPrice', price: 101000 });
    });

    it('clears selection for non-preview cancel paths', () => {
        expect(
            getChartElementCancelIntent(
                { ...existingLimitLine, originalPrice: 101000 },
                101000,
            ),
        ).toEqual({ type: 'clearSelection' });
        expect(getChartElementCancelIntent(undefined, null)).toEqual({
            type: 'clearSelection',
        });
    });

    it('routes preview confirms to the order form price', () => {
        expect(getChartElementConfirmIntent(previewLine)).toEqual({
            type: 'previewToOrderForm',
            price: 101000,
        });
    });

    it('routes existing order-line confirms to the confirmation path', () => {
        expect(getChartElementConfirmIntent(existingLimitLine)).toEqual({
            type: 'confirmExistingOrderLine',
        });
        expect(getChartElementConfirmIntent(undefined)).toEqual({
            type: 'noop',
        });
    });
});
