import { ORDER_BOOK_MAX_AGE_MS } from '../Constants';
import type { OrderBookRowIF } from '~/utils/orderbook/OrderBookIFs';

export type OrderBookExecutionError = 'stale' | 'no_asks' | 'no_bids';

export function getMarketExecutionPrice(
    side: 'buy' | 'sell',
    buys: OrderBookRowIF[],
    sells: OrderBookRowIF[],
    lastBookUpdateAt: number | null,
): { price?: number; error?: OrderBookExecutionError } {
    if (
        !lastBookUpdateAt ||
        Date.now() - lastBookUpdateAt > ORDER_BOOK_MAX_AGE_MS
    ) {
        return { error: 'stale' };
    }
    if (side === 'buy') {
        if (sells.length === 0) {
            return { error: 'no_asks' };
        }
        return { price: sells[0].px };
    }
    if (buys.length === 0) {
        return { error: 'no_bids' };
    }
    return { price: buys[0].px };
}
