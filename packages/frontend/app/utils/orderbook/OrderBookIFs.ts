export interface L2BookDataIF {
    coin: string;
    time: number;
    levels: L2BookLevel[][];
}

interface L2BookLevel {
    px: string;
    sz: string;
    n: number;
}

export interface OrderBookRowIF {
    coin: string;
    px: number;
    sz: number;
    n: number;
    type: 'buy' | 'sell';
    total: number;
    ratio?: number;
}

export interface OrderBookTradeIF {
    coin: string;
    side: 'buy' | 'sell';
    px: number;
    sz: number;
    hash: string;
    time: number;
    tid: number; // ID unique across all assets
    users: [string, string];
}

export interface OrderRowResolutionIF {
    val: number;
    nsigfigs?: number | null;
    mantissa?: number | null;
}

export interface OrderDataIF {
    cloid: string;
    coin: string;
    isPositionTpsl?: boolean;
    isTrigger?: boolean;
    limitPx: number;
    oid: number;
    orderType: string;
    origSz: number;
    reduceOnly?: boolean;
    side: 'buy' | 'sell';
    sz: number;
    filledSz?: number; // only used for filled orders
    tif?: string;
    timestamp: number;
    triggerCondition?: string;
    triggerPx?: number;
    status: string;
    orderValue?: number;
}

export type OrderBookMode = 'symbol' | 'usd';

export type OrderDataSortBy =
    | 'timestamp'
    | 'orderType'
    | 'coin'
    | 'side'
    | 'sz'
    | 'origSz'
    | 'orderValue'
    | 'price'
    | 'status'
    | 'triggerCondition'
    | 'oid'
    | 'reduceOnly'
    | 'triggerConditions'
    | 'tpsl'
    | 'cancel'
    | 'limitPx'
    | 'triggerPx'
    | 'filledSz'
    | undefined;
