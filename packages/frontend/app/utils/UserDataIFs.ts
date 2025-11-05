export interface UserBalanceRawIF {
    coin: string;
    entryNtl: string;
    hold: string;
    token: number;
    total: string;
}

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
    contractAddress?: string;
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
    side: 'buy' | 'sell' | 'B' | 'S';
    sz: number;
    tid: number;
    value: number;
    closedPnl: number;
    startPositionRaw?: string; // Raw string value from server for deduplication
    startPosition?: number; // Parsed float value for display
}

export interface DepositAndWithDrawalIF {
    time: number;
    status: string;
    network: string;
    action: string;
    valueChange: string;
    fee: string;
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
    | 'status'
    | 'tradeValue'
    | 'dir'
    | undefined;

export type DepositAndWithDrawalSortBy =
    | 'time'
    | 'status'
    | 'network'
    | 'action'
    | 'valueChange'
    | 'fee'
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

export interface UserFundingIF {
    time: number;
    coin: string;
    usdc: number;
    szi: number;
    fundingRate: number;
}

export type UserFundingSortBy =
    | 'time'
    | 'coin'
    | 'usdc'
    | 'szi'
    | 'fundingRate'
    | undefined;

export interface UserFundingResponseIF {
    time: number;
    hash: string;
    delta: {
        type: string;
        coin: string;
        usdc: string;
        szi: string;
        fundingRate: string;
        nSzi?: boolean;
    };
}

export interface ActiveTwapIF {
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

export type ActiveTwapSortBy =
    | 'coin'
    | 'executedNtl'
    | 'executedSz'
    | 'minutes'
    | 'randomize'
    | 'reduceOnly'
    | 'side'
    | 'sz'
    | 'timestamp'
    | 'user'
    | undefined;

interface PositionValueIF {
    [0]: number;
    [1]: string;
}

export interface UserPositionIF {
    accountValueHistory: PositionValueIF[];
    pnlHistory: PositionValueIF[];
    vlm: string;
}

export type PositionTimeframeKey = 'day' | 'week' | 'month' | 'allTime';
