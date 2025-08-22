export interface AssetInfo {
    name: string;
    szDecimals: number;
}

export interface Meta {
    universe: AssetInfo[];
}

export type Side = 'A' | 'B';
export const SIDES: Side[] = ['A', 'B'];

export interface SpotAssetInfo {
    name: string;
    tokens: number[];
    index: number;
    isCanonical: boolean;
}

export interface SpotTokenInfo {
    name: string;
    szDecimals: number;
    weiDecimals: number;
    index: number;
    tokenId: string;
    isCanonical: boolean;
    evmContract?: string; // Optional property
    fullName?: string; // Optional property
}

export interface SpotMeta {
    universe: SpotAssetInfo[];
    tokens: SpotTokenInfo[];
}

export interface SpotAssetCtx {
    dayNtlVlm: string;
    markPx: string;
    midPx?: string;
    prevDayPx: string;
    circulatingSupply: string;
    coin: string;
}

export type SpotMetaAndAssetCtxs = [SpotMeta, SpotAssetCtx[]];

// Subscriptions
export interface AllMidsSubscription {
    type: 'allMids';
}

export interface L2BookSubscription {
    type: 'l2Book';
    coin: string;
    nSigFigs?: number;
    mantissa?: number | null;
}

export interface TradesSubscription {
    type: 'trades';
    coin: string;
}

export interface UserEventsSubscription {
    type: 'userEvents';
    user: string;
}

export interface UserFillsSubscription {
    type: 'userFills';
    user: string;
}

export interface UserTwapHistorySubscription {
    type: 'userTwapHistory';
    user: string;
}

export interface UserTwapSliceFillsSubscription {
    type: 'userTwapSliceFills';
    user: string;
}

export interface CandleSubscription {
    type: 'candle';
    coin: string;
    interval: string; // Consider defining specific intervals if known (e.g., "1m" | "5m" | "1h")
}

export interface OrderUpdatesSubscription {
    type: 'orderUpdates';
    user: string;
}

export interface UserFundingsSubscription {
    type: 'userFundings';
    user: string;
}

export interface UserNonFundingLedgerUpdatesSubscription {
    type: 'userNonFundingLedgerUpdates';
    user: string;
}

export interface WebData2Subscription {
    type: 'webData2';
    user: string;
}

export interface NotificationSubscription {
    type: 'notification';
    user: string;
}

export interface UserHistoricalOrdersSubscription {
    type: 'userHistoricalOrders';
    user: string;
}

export type Subscription =
    | AllMidsSubscription
    | L2BookSubscription
    | TradesSubscription
    | UserEventsSubscription
    | UserFillsSubscription
    | CandleSubscription
    | OrderUpdatesSubscription
    | UserFundingsSubscription
    | UserNonFundingLedgerUpdatesSubscription
    | WebData2Subscription
    | NotificationSubscription
    | UserHistoricalOrdersSubscription
    | UserTwapSliceFillsSubscription
    | UserTwapHistorySubscription;

export interface AllMidsData {
    mids: Record<string, string>;
}

export interface AllMidsMsg {
    channel: 'allMids';
    data: AllMidsData;
}

export interface L2Level {
    px: string;
    sz: string;
    n: number;
}

export interface L2BookData {
    coin: string;
    levels: [L2Level[], L2Level[]];
    time: number;
}

export interface L2BookMsg {
    channel: 'l2Book';
    data: L2BookData;
}

export interface PongMsg {
    channel: 'pong';
}

export interface Trade {
    coin: string;
    side: Side;
    px: string;
    sz: number;
    hash: string;
    time: number;
}

export interface TradesMsg {
    channel: 'trades';
    data: Trade[];
}

export interface Fill {
    coin: string;
    px: string;
    sz: string;
    side: Side;
    time: number;
    startPosition: string;
    dir: string;
    closedPnl: string;
    hash: string;
    oid: number;
    crossed: boolean;
    fee: string;
    tid: number;
    feeToken: string;
}

export type UserEventsData =
    | { fills: Fill[] }
    | { funding: UserFunding }
    | { liquidation: Liquidation }
    | { nonUserCancel: NonUserCancel[] };

export interface UserFunding {
    time: number;
    coin: string;
    usdc: string;
    szi: string;
    fundingRate: string;
}

export interface Liquidation {
    lid: number;
    liquidator: string;
    liquidated_user: string;
    liquidated_ntl_pos: string;
    liquidated_account_value: string;
}

export interface NonUserCancel {
    coin: String;
    oid: number;
}

export interface UserEventsMsg {
    channel: 'user';
    data: UserEventsData;
}

export interface UserFillsData {
    user: string;
    isSnapshot: boolean;
    fills: Fill[];
}

export interface NotificationData {
    notification: string;
}

export interface UserFillsMsg {
    channel: 'userFills';
    data: UserFillsData;
}

export interface UserHistoricalOrdersData {
    user: string;
    orderHistory: OrderHistory[];
}

export interface OrderHistory {
    order: OrderData;
    status: string;
    statusTimestamp: number;
}

export interface OrderData {
    cloid: string;
    coin: string;
    isPositionTpsl?: boolean;
    isTrigger?: boolean;
    limitPx: number;
    oid: number;
    orderType: string;
    origSz: number;
    reduceOnly?: boolean;
    side: 'buy' | 'sell' | 'A' | 'B' | 'S';
    sz: number;
    tif?: string;
    timestamp: number;
    triggerCondition?: string;
    triggerPx?: number;
}

export interface OtherWsMsg {
    channel:
        | 'candle'
        | 'orderUpdates'
        | 'userFundings'
        | 'userNonFundingLedgerUpdates'
        | 'webData2';
    data: any;
}

export interface NotificationMsg {
    channel: 'notification';
    data: NotificationData;
}

export interface UserHistoricalOrdersMsg {
    channel: 'userHistoricalOrders';
    data: UserHistoricalOrdersData;
}

export interface UserTwapSliceFillsMsg {
    channel: 'userTwapSliceFills';
    data: UserTwapSliceFillsData;
}

export interface UserTwapHistoryMsg {
    channel: 'userTwapHistory';
    data: UserTwapHistoryData;
}

export interface UserFundingsMsg {
    channel: 'userFundings';
    data: UserFundingsData;
}

export type WsMsg =
    | AllMidsMsg
    | L2BookMsg
    | TradesMsg
    | UserEventsMsg
    | PongMsg
    | UserFillsMsg
    | OtherWsMsg
    | NotificationMsg
    | UserHistoricalOrdersMsg
    | UserTwapSliceFillsMsg
    | UserTwapHistoryMsg
    | ErrorMsg;

export interface BuilderInfo {
    b: string; // public address of the builder
    f: number; // fee in tenths of basis points (e.g., 10 means 1 basis point)
}

export type Cloid = `0x${string}`;

export function isCloid(cloid: string): cloid is Cloid {
    return /^0x[0-9a-fA-F]{32}$/.test(cloid);
}

export function cloidFromInt(cloidInt: number): Cloid {
    const hexString = cloidInt.toString(16).padStart(32, '0');
    const rawCloid = `0x${hexString}` as Cloid;
    if (!isCloid(rawCloid)) {
        throw new Error(`Failed to convert integer ${cloidInt} to valid Cloid`);
    }
    return rawCloid;
}

export function cloidFromString(cloidStr: string): Cloid {
    if (!isCloid(cloidStr)) {
        throw new Error(`Invalid Cloid string: ${cloidStr}`);
    }
    return cloidStr;
}

export interface FrontendOpenOrder {
    coin: string;
    isPositionTpsl: boolean;
    isTrigger: boolean;
    limitPx: string;
    oid: number;
    orderType: string;
    origSz: string;
    reduceOnly: boolean;
    side: string;
    sz: string;
    timestamp: number;
    triggerCondition: string;
    triggerPx: string;
}

export type FrontendOpenOrdersData = FrontendOpenOrder[];

export interface OpenOrder {
    coin: string;
    limitPx: string;
    oid: number;
    side: string;
    sz: string;
    timestamp: number;
}

export type OpenOrdersData = OpenOrder[];

export interface ClearinghouseState {
    assetPositions: AssetPosition[];
    crossMaintenanceMarginUsed: string;
    crossMarginSummary: CrossMarginSummary;
    marginSummary: MarginSummary;
    time: number;
    withdrawable: string;
}

interface AssetPosition {
    position: Position;
    type: string;
}

interface Position {
    coin: string;
    cumFunding: CumFunding;
    entryPx: string;
    leverage: Leverage;
    liquidationPx: string;
    marginUsed: string;
    maxLeverage: number;
    positionValue: string;
    returnOnEquity: string;
    szi: string;
    unrealizedPnl: string;
}

interface CumFunding {
    allTime: string;
    sinceChange: string;
    sinceOpen: string;
}

interface Leverage {
    rawUsd: string;
    type: string;
    value: number;
}

interface CrossMarginSummary {
    accountValue: string;
    totalMarginUsed: string;
    totalNtlPos: string;
    totalRawUsd: string;
}

interface MarginSummary {
    accountValue: string;
    totalMarginUsed: string;
    totalNtlPos: string;
    totalRawUsd: string;
}

export interface UserFill {
    closedPnl: string;
    coin: string;
    crossed: boolean;
    dir: string;
    hash: string;
    oid: number;
    px: string;
    side: string;
    startPosition: string;
    sz: string;
    time: number;
    fee: string;
    feeToken: string;
    builderFee?: string;
    tid: number;
}

export type UserFillsInfoData = UserFill[];

export type MetaAndAssetCtxsData = [
    {
        universe: {
            name: string;
            szDecimals: number;
            maxLeverage: number;
            onlyIsolated?: boolean;
        }[];
    },
    {
        dayNtlVlm: string;
        dayBaseVlm: string;
        funding: string;
        impactPxs: string[];
        markPx: string;
        midPx: string;
        openInterest: string;
        oraclePx: string;
        premium: string;
        prevDayPx: string;
    }[],
];

export interface FundingHistory {
    coin: string;
    fundingRate: string;
    premium: string;
    time: number;
}

export type FundingHistoryData = FundingHistory[];

export interface L2Snapshot {
    px: string;
    sz: string;
    n: number;
}

export type L2SnapshotData = [L2Snapshot[], L2Snapshot[]];

export interface CandleSnapshot {
    T: number;
    c: string;
    h: string;
    i: string;
    l: string;
    n: number;
    o: string;
    s: string;
    t: number;
    v: string;
}

export type CandleSnapshotData = CandleSnapshot[][];

export interface OrderStatusData {
    status: string;
    order?: {
        order: OrderDetails;
        status: string;
        statusTimestamp: number;
    };
}

export interface OrderDetails {
    coin: string;
    side: string;
    limitPx: string;
    sz: string;
    oid: number;
    timestamp: number;
    triggerCondition: string;
    isTrigger: boolean;
    triggerPx: string;
    children: any[];
    isPositionTpsl: boolean;
    reduceOnly: boolean;
    orderType: string;
    origSz: string;
    tif: string;
    cloid: any;
}

export type SubAccountsData = SubAccount[];

export interface SubAccount {
    name: string;
    subAccountUser: string;
    master: string;
    clearinghouseState: ClearinghouseState;
    spotState: SpotState;
}

export interface SpotState {
    balances: Balance[];
}

export interface Balance {
    coin: string;
    token: number;
    total: string;
    hold: string;
    entryNtl: string;
}

export interface TwapState {
    coin: string;
    executedNtl: string;
    executedSz: string;
    minutes: number;
    randomize: boolean;
    reduceOnly: boolean;
    side: string;
    sz: string;
    timestamp: number;
    user: string;
}

export interface TwapFill {
    coin: string;
    closedPnl: string;
    crossed: boolean;
    dir: string;
    fee: string;
    feeToken: string;
    hash: string;
    oid: number;
    px: string;
    side: string;
    startPosition: string;
    sz: string;
    tid: number;
    time: number;
}

export interface TwapSliceFill {
    fill: TwapFill;
    twapId: number;
}

export interface TwapHistory {
    state: TwapState;
    status: { status: string };
    time: number;
}

export interface UserTwapHistoryData {
    user: string;
    history: TwapHistory[];
    isSnapshot: boolean;
}

export interface UserTwapSliceFillsData {
    user: string;
    twapSliceFills: TwapSliceFill[];
    isSnapshot: boolean;
}

export interface UserFundingsData {
    user: string;
    isSnapshot?: boolean;
    fundings: UserFunding[];
}

export interface UserActiveTwap {
    coin: string;
    executedNtl: string;
    executedSz: string;
    minutes: number;
    randomize: boolean;
    reduceOnly: boolean;
    side: string;
    sz: string;
    timestamp: number;
    user: string;
}

export interface UserActiveTwapData {
    0: number;
    1: UserActiveTwap;
}
export interface OpenOrderRawData {
    coin: string;
    side: string;
    limitPx: string;
    sz: string;
    oid: number;
    timestamp: number;
    triggerCondition: string;
    isTrigger: boolean;
    triggerPx: string;
    children: any[];
    isPositionTpsl: boolean;
    reduceOnly: boolean;
    orderType: string;
    origSz: string;
    tif: string;
    cloid: string;
}

export interface ErrorMsg {
    channel: 'error';
    data: string;
}
