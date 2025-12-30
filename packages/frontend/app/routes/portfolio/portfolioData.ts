// Types
export interface Asset {
    id: string;
    name: string;
    symbol: string;
    amount: number;
    valueUSD: number;
    change24h: number;
    icon: string;
}

export interface Transaction {
    id: string;
    type: 'deposit' | 'withdraw' | 'send' | 'receive' | 'trade';
    asset: string;
    amount: number;
    valueUSD: number;
    timestamp: number;
    status: 'completed' | 'pending' | 'failed';
    address?: string;
    txHash?: string;
}

export interface PortfolioData {
    id: string;
    name: string;
    totalValueUSD: number;
    availableBalance: number;
    unit: string;
    assets: Asset[];
    transactions: Transaction[];
    performance: {
        daily: number;
        weekly: number;
        monthly: number;
        yearly: number;
    };
    tradingVolume: {
        daily: number;
        weekly: number;
        biWeekly: number;
        monthly: number;
    };
    fees: {
        taker: number;
        maker: number;
    };
}

// Mock data
export const portfolioData: PortfolioData = {
    id: 'main-portfolio',
    name: 'Main Portfolio',
    totalValueUSD: 1987654.32,
    availableBalance: 1987654.32,
    unit: 'USD',
    assets: [
        {
            id: 'btc',
            name: 'Bitcoin',
            symbol: 'BTC',
            amount: 12.5,
            valueUSD: 752345.67,
            change24h: 2.35,
            icon: 'btc-icon',
        },
        {
            id: 'eth',
            name: 'Ethereum',
            symbol: 'ETH',
            amount: 150.25,
            valueUSD: 421987.45,
            change24h: -1.2,
            icon: 'eth-icon',
        },
        {
            id: 'sol',
            name: 'Solana',
            symbol: 'SOL',
            amount: 3500,
            valueUSD: 389456.78,
            change24h: 5.67,
            icon: 'sol-icon',
        },
        {
            id: 'usdc',
            name: 'USD Coin',
            symbol: 'USDC',
            amount: 250000,
            valueUSD: 250000,
            change24h: 0.01,
            icon: 'usdc-icon',
        },
        {
            id: 'usdt',
            name: 'Tether',
            symbol: 'USDT',
            amount: 173864.42,
            valueUSD: 173864.42,
            change24h: 0.05,
            icon: 'usdt-icon',
        },
    ],
    transactions: [
        {
            id: 'tx1',
            type: 'deposit',
            asset: 'USDC',
            amount: 50000,
            valueUSD: 50000,
            timestamp: Date.now() - 86400000 * 2, // 2 days ago
            status: 'completed',
            txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        },
        {
            id: 'tx2',
            type: 'trade',
            asset: 'BTC',
            amount: 1.5,
            valueUSD: 90281.45,
            timestamp: Date.now() - 86400000 * 5, // 5 days ago
            status: 'completed',
            txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        },
        {
            id: 'tx3',
            type: 'withdraw',
            asset: 'ETH',
            amount: 10,
            valueUSD: 28132.5,
            timestamp: Date.now() - 86400000 * 7, // 7 days ago
            status: 'completed',
            address: '0x9876543210fedcba9876543210fedcba9876543210',
            txHash: '0x7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456',
        },
        {
            id: 'tx4',
            type: 'send',
            asset: 'SOL',
            amount: 100,
            valueUSD: 11127.05,
            timestamp: Date.now() - 86400000 * 10, // 10 days ago
            status: 'completed',
            address: 'Hj98765432109876543210987654321098765432109876543210',
            txHash: '0x4567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123',
        },
        {
            id: 'tx5',
            type: 'receive',
            asset: 'BTC',
            amount: 0.75,
            valueUSD: 45140.73,
            timestamp: Date.now() - 86400000 * 14, // 14 days ago
            status: 'completed',
            address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
            txHash: '0xdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abc',
        },
    ],
    performance: {
        daily: 1.45,
        weekly: 5.67,
        monthly: 12.32,
        yearly: 34.56,
    },
    tradingVolume: {
        daily: 215678.9,
        weekly: 1345678.23,
        biWeekly: 2456789.01,
        monthly: 5678901.23,
    },
    fees: {
        taker: 0.035,
        maker: 0.01,
    },
};

// Function to get portfolio data (simulates API call)
export async function fetchPortfolioData(): Promise<PortfolioData> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    return portfolioData;
}

// Function to update portfolio balance (simulates API call)
export async function updatePortfolioBalance(
    portfolioId: string,
    action: 'deposit' | 'withdraw' | 'send',
    amount: number,
    address?: string,
): Promise<{ success: boolean; message?: string }> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Validate amount
    if (amount <= 0) {
        return {
            success: false,
            message: 'portfolio.amountGreaterThanZero',
        };
    }

    // For withdraw and send, check if enough balance
    if (
        (action === 'withdraw' || action === 'send') &&
        amount > portfolioData.availableBalance
    ) {
        return {
            success: false,
            message: 'portfolio.insufficientFunds',
        };
    }

    // For send, check if address is provided
    if (action === 'send' && !address) {
        return {
            success: false,
            message: 'portfolio.invalidAddress',
        };
    }

    // Update balance
    if (action === 'deposit') {
        portfolioData.availableBalance += amount;
        portfolioData.totalValueUSD += amount;
    } else {
        portfolioData.availableBalance -= amount;
        portfolioData.totalValueUSD -= amount;
    }

    // Create transaction record
    const newTransaction: Transaction = {
        id: `tx${Date.now()}`,
        type: action,
        asset: 'USD',
        amount: amount,
        valueUSD: amount,
        timestamp: Date.now(),
        status: 'completed',
        address: address,
    };

    // Add transaction to history
    portfolioData.transactions.unshift(newTransaction);

    return {
        success: true,
    };
}
