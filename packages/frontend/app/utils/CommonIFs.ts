import type { JSX } from 'react';

export type TableSortDirection = 'asc' | 'desc' | undefined;

export enum TableState {
    LOADING = 'loading',
    EMPTY = 'empty',
    FILLED = 'filled',
}

export interface HeaderCell<T = string> {
    name: string;
    key: string;
    sortable?: boolean;
    className: string;
    exportable?: boolean;
    exportAction?: (data: T) => string;
}

export interface OrderTypeOption {
    value: string;
    label: string;
    blurb: string;
    icon: JSX.Element;
}

export interface ChaseOption {
    value: string;
    label: string;
}
export type OrderSide = 'buy' | 'sell';

export type MarginMode = 'error' | 'isolated' | null;

// keys for content that may be rendered in tx modal
export type modalContentT =
    | 'margin'
    | 'scale'
    | 'market_buy'
    | 'market_sell'
    | 'limit_buy'
    | 'limit_sell';

export type OrderInputValue = {
    value: number | undefined;
    changeType: OrderInputChangeType;
};

export type OrderInputChangeType =
    | 'dragging'
    | 'dragEnd'
    | 'obClick'
    | 'inputChange'
    | 'midPriceChange'
    | 'quickTradeMode'
    | 'reset';
