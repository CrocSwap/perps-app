export interface TickerEntry {
    symbol: string;
    name: string;
    price: number;
    change: number;
    href: string;
}

export const MOCK_TICKER_DATA: TickerEntry[] = [
    {
        symbol: 'BTC',
        name: 'Bitcoin',
        price: 98234.56,
        change: 2.34,
        href: 'https://www.coindesk.com/price/bitcoin/',
    },
    {
        symbol: 'ETH',
        name: 'Ethereum',
        price: 3456.78,
        change: -1.23,
        href: 'https://www.coindesk.com/price/ethereum/',
    },
    {
        symbol: 'SOL',
        name: 'Solana',
        price: 234.56,
        change: 5.67,
        href: 'https://www.coindesk.com/price/solana/',
    },
    {
        symbol: 'AVAX',
        name: 'Avalanche',
        price: 45.67,
        change: 3.45,
        href: 'https://www.coindesk.com/price/avalanche/',
    },
    {
        symbol: 'MATIC',
        name: 'Polygon',
        price: 1.23,
        change: -0.56,
        href: 'https://www.coindesk.com/price/polygon/',
    },
    {
        symbol: 'ARB',
        name: 'Arbitrum',
        price: 2.34,
        change: 1.89,
        href: 'https://www.coindesk.com/price/arbitrum/',
    },
    {
        symbol: 'OP',
        name: 'Optimism',
        price: 3.45,
        change: 2.12,
        href: 'https://www.coindesk.com/price/optimism/',
    },
    {
        symbol: 'LINK',
        name: 'Chainlink',
        price: 23.45,
        change: -2.34,
        href: 'https://www.coindesk.com/price/chainlink/',
    },
];
