interface TradeHistoryData {
    time: string;
    coin: string;
    direction: string;
    price: string;
    size: string;
    tradeValue: string;
    fee: string;
    closedPnl: string;
    hasOrderDetails: boolean;
}

export const tradeHistoryData: TradeHistoryData[] = [
    {
        time: '2025/02/24 - 16:51:12',
        coin: 'ETH',
        direction: 'Long',
        price: '2,460.90',
        size: '0.0001',
        tradeValue: '$10.49',
        fee: '$0.00',
        closedPnl: '$0.00',
        hasOrderDetails: true,
    },
    {
        time: '2025/02/24 - 16:51:12',
        coin: 'ETH',
        direction: 'Long',
        price: '2,460.90',
        size: '0.0001',
        tradeValue: '$10.49',
        fee: '$0.00',
        closedPnl: '$0.00',
        hasOrderDetails: true,
    },
    {
        time: '2025/02/24 - 16:51:12',
        coin: 'ETH',
        direction: 'Long',
        price: '2,460.90',
        size: '0.0001',
        tradeValue: '$10.49',
        fee: '$0.00',
        closedPnl: '$0.00',
        hasOrderDetails: true,
    },
];
