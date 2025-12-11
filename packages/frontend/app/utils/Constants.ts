import { useMemo } from 'react';
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

export const externalURLs = {
    discord: 'https://discord.gg/ambient-finance',
    twitter: 'https://x.com/ambient_finance',
};

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

export const MIN_DEPOSIT_AMOUNT = 1;

export const MIN_ORDER_VALUE = 1;

export const MAX_BTC_NOTIONAL = 1;

export const BTC_MAX_LEVERAGE = 100;

// Delay before entering sleep mode when tab becomes hidden
// Set to 5 seconds to avoid triggering on brief tab switches
export const WS_SLEEP_MODE = 5 * SECONDS;
export const WS_SLEEP_MODE_PRICE_CHECK = 20 * SECONDS;
// Increased from 2 minutes to 30 minutes to prevent losing limit order fills
// This gives more time for limit orders to fill before websocket connections are stashed
export const WS_SLEEP_MODE_STASH_CONNECTION = 2 * MINUTES;

export const EXTERNAL_PAGE_URL_PREFIX = '/v2';

export const MIN_VISIBLE_ORDER_LABEL_RATIO = 0.8;

export const MIN_POSITION_USD_SIZE = 0.01;

export const MARKET_API_URL =
    import.meta.env.VITE_MARKET_API_URL || 'https://api.hyperliquid.xyz';
// 'https://throbbing-disk-07bc.doug-fa5.workers.dev';

export const POLLING_API_URL =
    import.meta.env.VITE_POLLING_API_URL || 'https://api.hyperliquid.xyz';
// 'https://throbbing-disk-07bc.doug-fa5.workers.dev';

export const POLLING_API_INFO_ENDPOINT =
    import.meta.env.POLLING_API_INFO_ENDPOINT || `${POLLING_API_URL}/info`;

export const MARKET_INFO_ENDPOINT =
    import.meta.env.VITE_MARKET_INFO_ENDPOINT || MARKET_API_URL + '/info';

// Use secure WebSocket endpoints by default
export const MARKET_WS_ENDPOINT =
    import.meta.env.VITE_MARKET_WS_ENDPOINT || 'wss://api.hyperliquid.xyz';
// 'https://throbbing-disk-07bc.doug-fa5.workers.dev';

export const USER_WS_ENDPOINT =
    import.meta.env.VITE_USER_WS_ENDPOINT ||
    'wss://embindexer.net/ember/tradesocket';

export const blockExplorer =
    import.meta.env.VITE_BLOCK_EXPLORER || 'https://fogoscan.com';

export const RPC_ENDPOINT =
    import.meta.env.VITE_RPC_ENDPOINT || 'https://testnet.fogo.io';

const NETWORK =
    (import.meta.env.VITE_NETWORK || 'testnet').toLowerCase() === 'mainnet'
        ? 'mainnet'
        : 'testnet';

export const IS_TESTNET = NETWORK === 'testnet';

export const getTxLink = (signature?: string | null) => {
    if (!signature) return undefined;
    const clusterParam = IS_TESTNET ? '?cluster=testnet' : '';
    return `${blockExplorer}/tx/${signature}${clusterParam}`;
};

// Market Order Constants
/**
 * Price offset for market orders in USD.
 * Buy orders will be filled at best ask + this offset.
 * Sell orders will be filled at best bid - this offset.
 * This ensures market orders are filled even with slight price movements.
 */
export const MARKET_ORDER_PRICE_OFFSET_USD = 50;

export const wsUrls = [
    MARKET_WS_ENDPOINT,
    'wss://pulse-api-mock.liquidity.tools/ws',
    'wss://api-ui.hyperliquid.xyz/ws',
];

export const API_URLS = {
    mainnet: 'https://pulse-api-mock.liquidity.tools',
    testnet: 'https://pulse-api-mock.liquidity.tools',
    mock: 'https://pulse-api-mock.liquidity.tools',

    local: 'http://localhost:9153',

    hl: MARKET_API_URL,
};

export type Environment = keyof typeof API_URLS;
export const DEFAULT_API_ENVIRONMENT: Environment = 'mock';

export const TIMEOUT_OB_POLLING =
    import.meta.env.VITE_TIMEOUT_OB_POLLING || 2 * SECONDS;
export const TIMEOUT_MARKET_DATA_POLLING =
    import.meta.env.VITE_TIMEOUT_MARKET_DATA_POLLING || 2 * SECONDS;
export const TIMEOUT_CANDLE_POLLING =
    import.meta.env.VITE_TIMEOUT_CANDLE_POLLING || 2 * SECONDS;

export const SPLIT_TEST_VERSION =
    import.meta.env.VITE_SPLIT_TEST_VERSION || 'control';

export const SHOULD_LOG_ANALYTICS =
    import.meta.env.VITE_SHOULD_LOG_ANALYTICS &&
    import.meta.env.VITE_SHOULD_LOG_ANALYTICS.toLowerCase() === 'true';

export const languageOptions = {
    en: 'English 🇬🇧',
    es: 'Español 🇪🇸',
    fr: 'Français 🇫🇷',
    // de: 'Deutsch 🇩🇪',
    tr: 'Türkçe 🇹🇷',
    // vi: 'Tiếng Việt 🇻🇳',
    ko: '한국어 🇰🇷',
    ja: '日本語 🇯🇵',
    zh: '中文 (简体) 🇨🇳',
};
export const IS_RESTRICTED_SITE =
    import.meta.env.VITE_IS_RESTRICTED_SITE &&
    import.meta.env.VITE_IS_RESTRICTED_SITE.toLowerCase() === 'true';

// Active announcement banner - set to the banner component key to display, or empty/undefined to hide
export const ACTIVE_ANNOUNCEMENT_BANNER =
    import.meta.env.VITE_ACTIVE_ANNOUNCEMENT_BANNER || '';
