import type { DebugWallet } from '~/stores/DebugStore';

export * from './externalResources';

export enum FormatTypes {
    EN = 'en-US',
    DE = 'de-DE',
    FR = 'fr-FR',
    SV = 'sv-SE',
}

export type NumFormat = {
    label: string;
    value: FormatTypes;
};

export type LangType = {
    label: string;
};

export const NumFormatTypes: NumFormat[] = [
    {
        label: '1,234.56',
        value: FormatTypes.EN,
    },
    {
        label: '1.234,56',
        value: FormatTypes.DE,
    },
    {
        label: '1234,56',
        value: FormatTypes.FR,
    },
    {
        label: '1 234,56',
        value: FormatTypes.SV,
    },
];

export const Langs: LangType[] = [
    {
        label: 'English',
    },
    {
        label: 'Français',
    },
    {
        label: '한국어',
    },
    {
        label: '简体中文',
    },
];

export const wsUrls = [
    'wss://api.hyperliquid.xyz/ws',
    'wss://pulse-api-mock.liquidity.tools/ws',
    'wss://api-ui.hyperliquid.xyz/ws',
];

export const wsEnvironments = [
    {
        label: 'Mock',
        value: 'mock',
    },
    {
        label: 'HyperLiquid',
        value: 'hl',
    },
    {
        label: 'Local',
        value: 'local',
    },
    {
        label: 'Mainnet',
        value: 'mainnet',
    },
    {
        label: 'Testnet',
        value: 'testnet',
    },
];

export const debugWallets: DebugWallet[] = [
    {
        label: 'benjamin',
        address: '0x1cFd5AAa6893f7d91e2A0aA073EB7f634e871353',
    },
    {
        label: 'account2',
        address: '0x68b36200a9066ba777504b64e2b07e5ec2c0d70f',
    },
    {
        label: 'emptyAccount',
        address: '0x350736dff5e36bB79Fd3Ce2677d2e73A82b051a8',
    },
    {
        label: 'strobie',
        address: '0xECB63caA47c7c4E77F60f1cE858Cf28dC2B82b00',
    },
];

export const OrderHistoryLimits = {
    MAX: 1000,
};

export const TradeHistoryLimits = {
    MAX: 1000,
};

export * from './feeSchedule';

export const TWITTER_CHARACTER_LIMIT = 240;

export const PERPS_TWITTER = '@ambient_finance';
export const FOGO_TWITTER = '@FogoChain';

export enum WsChannels {
    ORDERBOOK = 'l2Book',
    ORDERBOOK_TRADES = 'trades',
    USER_FILLS = 'userFills',
    USER_HISTORICAL_ORDERS = 'userHistoricalOrders',
    WEB_DATA2 = 'webData2',
    ACTIVE_COIN_DATA = 'activeAssetCtx',
    NOTIFICATION = 'notification',
    CANDLE = 'candle',
    TWAP_HISTORY = 'userTwapHistory',
    TWAP_SLICE_FILLS = 'userTwapSliceFills',
    USER_FUNDINGS = 'userFundings',
    USER_NON_FUNDING_LEDGER_UPDATES = 'userNonFundingLedgerUpdates',
}

const SECONDS = 1000;
const MINUTES = SECONDS * 60;

export const WS_SLEEP_MODE = 0 * SECONDS;
export const WS_SLEEP_MODE_PRICE_CHECK = 20 * SECONDS;
export const WS_SLEEP_MODE_STASH_CONNECTION = 2 * MINUTES;

export const EXTERNAL_PAGE_URL_PREFIX = '/v2';

export const MIN_VISIBLE_ORDER_LABEL_RATIO = 0.8;

export const MARKET_WS_ENDPOINT =
    import.meta.env.VITE_MARKET_WS_ENDPOINT || 'https://api.hyperliquid.xyz';

export const USER_WS_ENDPOINT =
    import.meta.env.VITE_USER_WS_ENDPOINT ||
    'https://embindexer.net/ember/tradesocket';

export const blockExplorer =
    import.meta.env.VITE_BLOCK_EXPLORER || 'https://fogoscan.com';
