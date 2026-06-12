interface ActiveTwapData {
    coin: string;
    size: string;
    executedSize: string;
    averagePrice: string;
    runningTime: string;
    reduceOnly: string;
    creationTime: string;
}

export const activeTwapsData: ActiveTwapData[] = [
    {
        coin: 'BTC',
        size: '0.00821 BTC',
        executedSize: '0.00014 BTC',
        averagePrice: '81,400',
        runningTime: '00:00:09 / 30 minutes',
        reduceOnly: 'No',
        creationTime: '3/18/2025 - 10:16:43',
    },
    {
        coin: 'ETH',
        size: '0.05000 ETH',
        executedSize: '0.01200 ETH',
        averagePrice: '3,452',
        runningTime: '00:05:47 / 15 minutes',
        reduceOnly: 'No',
        creationTime: '3/18/2025 - 10:11:15',
    },
    {
        coin: 'SOL',
        size: '1.50000 SOL',
        executedSize: '0.50000 SOL',
        averagePrice: '146.25',
        runningTime: '00:12:33 / 20 minutes',
        reduceOnly: 'Yes',
        creationTime: '3/18/2025 - 10:04:30',
    },
    {
        coin: 'AVAX',
        size: '2.75000 AVAX',
        executedSize: '0.00000 AVAX',
        averagePrice: '38.90',
        runningTime: '00:00:22 / 45 minutes',
        reduceOnly: 'No',
        creationTime: '3/18/2025 - 10:16:35',
    },
    {
        coin: 'DOGE',
        size: '1000.00000 DOGE',
        executedSize: '250.00000 DOGE',
        averagePrice: '0.1428',
        runningTime: '00:08:15 / 25 minutes',
        reduceOnly: 'No',
        creationTime: '3/18/2025 - 10:08:42',
    },
    {
        coin: 'BNB',
        size: '0.35000 BNB',
        executedSize: '0.08750 BNB',
        averagePrice: '604.75',
        runningTime: '00:10:05 / 40 minutes',
        reduceOnly: 'Yes',
        creationTime: '3/18/2025 - 10:06:52',
    },
];
