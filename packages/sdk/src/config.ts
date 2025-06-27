export const serializationTypes = ['msgpack', 'json'] as const;
export type SerializationType = (typeof serializationTypes)[number];

export const API_URLS = {
    mainnet: 'https://pulse-api-mock.liquidity.tools',
    testnet: 'https://pulse-api-mock.liquidity.tools',
    mock: 'https://pulse-api-mock.liquidity.tools',

    local: 'http://localhost:9153',

    hl: 'https://api.hyperliquid.xyz',
};

export type Environment = keyof typeof API_URLS;
export const DEFAULT_API_ENVIRONMENT: Environment = 'mock';

// Default configuration values
export const DEFAULT_SLIPPAGE = 0.05;
export const DEFAULT_PING_INTERVAL_MS = 2 * 1000;
export const DEFAULT_SERIALIZATION_TYPE = 'json';

export const DEFAULT_RECONNECT_ATTEMPTS = 5;
export const RECONNECT_BASE_DELAY_MS = 200; // Initial delay before first reconnect attempt
export const RECONNECT_MAX_DELAY_MS = 5000; // Maximum delay between attempts

export const PONG_CHECK_TIMEOUT_MS = DEFAULT_PING_INTERVAL_MS + 100; // default timeout for pong received check
export const RECONNECT_TIMEOUT_MS = 2000; // timeout to trigger connect method while reconnecting

export const DEMO_USER = '0xECB63caA47c7c4E77F60f1cE858Cf28dC2B82b00';
