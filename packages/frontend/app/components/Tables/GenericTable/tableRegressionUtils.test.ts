import { describe, expect, it } from 'vitest';
import { TableState } from '~/utils/CommonIFs';
import {
    formatCsvCell,
    getNextTableSort,
    getTableStateForRows,
} from './tableRegressionUtils';

describe('GenericTable regression helpers', () => {
    it('cycles sort state through desc, asc, and unset for the same key', () => {
        expect(getNextTableSort(undefined, undefined, 'price')).toEqual({
            sortBy: 'price',
            sortDirection: 'desc',
        });
        expect(getNextTableSort('price', 'desc', 'price')).toEqual({
            sortBy: 'price',
            sortDirection: 'asc',
        });
        expect(getNextTableSort('price', 'asc', 'price')).toEqual({
            sortBy: undefined,
            sortDirection: undefined,
        });
        expect(getNextTableSort('price', undefined, 'size')).toEqual({
            sortBy: 'size',
            sortDirection: 'desc',
        });
    });

    it('maps fetch and visible row state to loading, empty, and filled states', () => {
        expect(getTableStateForRows(false, 0)).toBe(TableState.LOADING);
        expect(getTableStateForRows(true, 0)).toBe(TableState.EMPTY);
        expect(getTableStateForRows(true, 2)).toBe(TableState.FILLED);
    });

    it('formats CSV cells without losing currency, dates, nulls, or numeric strings', () => {
        expect(formatCsvCell(null)).toBe('--');
        expect(formatCsvCell(12)).toBe('12.00');
        expect(formatCsvCell(' 12.345 ')).toBe('12.35');
        expect(formatCsvCell('$12.34')).toBe('="$12.34"');
        expect(formatCsvCell('01.02.2026')).toBe('="01.02.2026"');
        expect(formatCsvCell('BTC-PERP')).toBe('BTC-PERP');
    });
});
