export interface feeTierIF {
    tier: string;
    volume14d: string;
    taker?: string;
    maker: string;
}

export interface feeSchedulesIF {
    vip: feeTierIF[];
    marketMaker: feeTierIF[];
}

export const feeSchedules: feeSchedulesIF = {
    vip: [
        {
            tier: '0',
            volume14d: '≤ $5,000,000',
            taker: '0.035%',
            maker: '0.010%',
        },
        {
            tier: '1',
            volume14d: '> $5,000,000',
            taker: '0.030%',
            maker: '0.050%',
        },
        {
            tier: '2',
            volume14d: '> $25,000,000',
            taker: '0.025%',
            maker: '0.000%',
        },
        {
            tier: '3',
            volume14d: '> $100,000,000',
            taker: '0.023%',
            maker: '0.000%',
        },
        {
            tier: '4',
            volume14d: '> $500,000,000',
            taker: '0.021%',
            maker: '0.000%',
        },
        {
            tier: '5',
            volume14d: '> $2,000,000,000',
            taker: '0.019%',
            maker: '0.000%',
        },
    ],
    marketMaker: [
        {
            tier: '1',
            volume14d: '> 0.50%',
            maker: '-0.001%',
        },
        {
            tier: '2',
            volume14d: '> 1.50%',
            maker: '-0.002%',
        },
        {
            tier: '3',
            volume14d: '> 3.00%',
            maker: '-0.003%',
        },
    ],
}