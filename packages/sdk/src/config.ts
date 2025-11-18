export const serializationTypes = ['msgpack', 'json'] as const;
export type SerializationType = (typeof serializationTypes)[number];

// Default configuration values
export const DEFAULT_SLIPPAGE = 0.05;
export const DEFAULT_PING_INTERVAL_MS = 2 * 1000;
export const DEFAULT_SERIALIZATION_TYPE = 'json';

export const DEFAULT_RECONNECT_ATTEMPTS = 5;
export const RECONNECT_BASE_DELAY_MS = 200; // Initial delay before first reconnect attempt
export const RECONNECT_MAX_DELAY_MS = 5000; // Maximum delay between attempts

export const PONG_CHECK_TIMEOUT_MS = DEFAULT_PING_INTERVAL_MS + 100; // default timeout for pong received check
export const RECONNECT_TIMEOUT_MS = 500; // timeout to trigger connect method while reconnecting

export const DEMO_USER = '0xECB63caA47c7c4E77F60f1cE858Cf28dC2B82b00';

export const MARKET_API_URL =
    import.meta.env.VITE_MARKET_API_URL || 'https://api.hyperliquid.xyz';
// 'https://throbbing-disk-07bc.doug-fa5.workers.dev';

export const PROXY_API_URL: string =
    import.meta.env.VITE_POLLING_API_URL || 'https://api.hyperliquid.xyz';
// 'https://throbbing-disk-07bc.doug-fa5.workers.dev';

export const MARKET_WS_ENDPOINT =
    import.meta.env.VITE_MARKET_WS_ENDPOINT || 'https://api.hyperliquid.xyz';
// 'https://throbbing-disk-07bc.doug-fa5.workers.dev';

export const blockExplorer =
    import.meta.env.VITE_BLOCK_EXPLORER || 'https://fogoscan.com';

export const RPC_ENDPOINT =
    import.meta.env.VITE_RPC_ENDPOINT || 'https://testnet.fogo.io';

// Market Order Constants
/**
 * Price offset for market orders in USD.
 * Buy orders will be filled at best ask + this offset.
 * Sell orders will be filled at best bid - this offset.
 * This ensures market orders are filled even with slight price movements.
 */
export const MARKET_ORDER_PRICE_OFFSET_USD = 10;

export const wsUrls = [
    MARKET_WS_ENDPOINT + '/ws',
    'wss://pulse-api-mock.liquidity.tools/ws',
    'wss://api-ui.hyperliquid.xyz/ws',
];

export const API_URLS = {
    mainnet: 'https://pulse-api-mock.liquidity.tools',
    testnet: 'https://pulse-api-mock.liquidity.tools',
    mock: 'https://pulse-api-mock.liquidity.tools',

    local: 'http://localhost:9153',

    hl: PROXY_API_URL,
} as const satisfies Record<string, string>;

export type Environment = keyof typeof API_URLS;
export const DEFAULT_API_ENVIRONMENT: Environment = 'mock';
