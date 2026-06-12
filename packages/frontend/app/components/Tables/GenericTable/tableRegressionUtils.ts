import { TableState, type TableSortDirection } from '~/utils/CommonIFs';

export function getNextTableSort<S>(
    currentSortBy: S | undefined,
    currentDirection: TableSortDirection | undefined,
    key: S,
): { sortBy?: S; sortDirection?: TableSortDirection } {
    if (currentSortBy !== key) {
        return { sortBy: key, sortDirection: 'desc' };
    }

    if (currentDirection === 'desc') {
        return { sortBy: key, sortDirection: 'asc' };
    }

    if (currentDirection === 'asc') {
        return { sortBy: undefined, sortDirection: undefined };
    }

    return { sortBy: key, sortDirection: 'desc' };
}

export function getTableStateForRows(
    isFetched: boolean,
    visibleRowCount: number,
): TableState {
    if (!isFetched) {
        return TableState.LOADING;
    }

    return visibleRowCount === 0 ? TableState.EMPTY : TableState.FILLED;
}

export function formatCsvCell(val: unknown): string {
    if (val == null) {
        return '--';
    }

    if (typeof val === 'number' && isFinite(val)) {
        return val.toFixed(2);
    }

    if (typeof val === 'string') {
        const trimmed = val.trim();

        if (/^[$£€¥]/.test(trimmed)) {
            return `="${trimmed}"`;
        }

        if (
            trimmed !== '' &&
            !isNaN(Number(trimmed)) &&
            isFinite(Number(trimmed))
        ) {
            return Number(trimmed).toFixed(2);
        }

        if (/^\d{1,2}\.\d{1,2}\.\d{2,4}$/.test(trimmed)) {
            return `="${trimmed}"`;
        }

        return trimmed;
    }

    return String(val);
}
