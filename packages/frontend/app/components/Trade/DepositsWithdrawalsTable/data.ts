interface TransactionData {
    time: string;
    status: string;
    network: string;
    action: string;
    valueChange: string;
    fee: string;
}

export const transactionsData: TransactionData[] = [
    {
        time: '2025/02/24 - 16:51:12',
        status: 'Complete',
        network: 'Fogo',
        action: 'Deposit',
        valueChange: '1,000.00 USDC',
        fee: '$0.00',
    },
    {
        time: '2025/02/24 - 16:51:12',
        status: 'Complete',
        network: 'Fogo',
        action: 'Deposit',
        valueChange: '1,000.00 USDC',
        fee: '$0.00',
    },
    {
        time: '2025/02/24 - 16:51:12',
        status: 'Complete',
        network: 'Fogo',
        action: 'Deposit',
        valueChange: '1,000.00 USDC',
        fee: '$0.00',
    },
    {
        time: '2025/02/24 - 12:30:45',
        status: 'Complete',
        network: 'Polygon',
        action: 'Withdraw',
        valueChange: '500.00 USDC',
        fee: '$1.50',
    },
    {
        time: '2025/02/23 - 09:15:32',
        status: 'Complete',
        network: 'Arbitrum',
        action: 'Deposit',
        valueChange: '2,500.00 USDC',
        fee: '$0.25',
    },
    {
        time: '2025/02/22 - 18:42:10',
        status: 'Pending',
        network: 'Optimism',
        action: 'Withdraw',
        valueChange: '750.00 USDC',
        fee: '$0.75',
    },
];
