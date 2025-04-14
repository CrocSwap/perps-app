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
}
