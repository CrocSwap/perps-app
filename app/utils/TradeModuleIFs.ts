export interface TradeSlotIF {
    coin: string;
    amount: number;
    price: number;
    type: 'buy' | 'sell';
}
