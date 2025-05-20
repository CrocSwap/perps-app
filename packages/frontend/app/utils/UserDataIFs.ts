export interface UserBalanceIF {
    coin: string;
    type: 'spot' | 'margin';
    entryNtl: number;
    hold: number;
    total: number;
    sortName: string;
    usdcValue: number;
    pnlValue: number;
    available: number;
    metaIndex: number;
    buyingPower: number;
}

export interface AccountOverviewIF {
    balance: number;
    unrealizedPnl: number;
    crossMarginRatio: number;
    maintainanceMargin: number;
    crossAccountLeverage: number;
    balanceChange?: number;
    maintainanceMarginChange?: number;
}

export type UserBalanceSortBy =
    | 'sortName'
    | 'total'
    | 'available'
    | 'usdcValue'
    | 'buyingPower'
    | 'pnlValue'
    | undefined;

export interface UserFillIF {
    time: number;
    coin: string;
    crossed: boolean;
    dir: string;
    fee: number;
    hash: string;
    oid: number;
    px: number;
    side: 'buy' | 'sell';
    sz: number;
    tid: number;
    value: number;
    closedPnl: number;
}

export type UserFillSortBy =
    | 'time'
    | 'coin'
    | 'side'
    | 'px'
    | 'sz'
    | 'value'
    | 'fee'
    | 'closedPnl'
    | undefined;

export interface TwapStateIF {
    coin: string;
    executedNtl: number;
    executedSz: number;
    minutes: number;
    randomize: boolean;
    reduceOnly: boolean;
    side: 'buy' | 'sell';
    sz: number;
    timestamp: number;
    user: string;
}

export interface TwapHistoryIF {
    state: TwapStateIF;
    status: string;
    time: number;
}

export interface TwapSliceFillIF {
    coin: string;
    closedPnl: number;
    crossed: boolean;
    dir: string;
    fee: number;
    feeToken: string;
    hash: string;
    oid: number;
    px: number;
    side: 'buy' | 'sell';
    startPosition: number;
    sz: number;
    tid: number;
    time: number;
    twapId: number;
}

export interface PositionLeverageIF {
    type: string;
    value: number;
}

export interface CumulativeFundingIF {
    allTime: number;
    sinceChange: number;
    sinceOpen: number;
}

export interface PositionIF {
    coin: string;
    entryPx: number;
    leverage: PositionLeverageIF;
    liquidationPx: number;
    marginUsed: number;
    maxLeverage: number;
    positionValue: number;
    returnOnEquity: number;
    szi: number;
    unrealizedPnl: number;
    type: string;
    cumFunding: CumulativeFundingIF;
    tp?: number;
    sl?: number;
    side?: string;
}

export type PositionDataSortBy =
    | 'coin'
    | 'size'
    | 'positionValue'
    | 'entryPrice'
    | 'markPrice'
    | 'pnl'
    | 'liqPrice'
    | 'margin'
    | 'funding'
    | undefined;
