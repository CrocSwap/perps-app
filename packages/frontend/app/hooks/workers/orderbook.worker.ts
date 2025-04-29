/// <reference lib="webworker" />

import type {
    L2BookDataIF,
    OrderBookRowIF,
} from '~/utils/orderbook/OrderBookIFs';
import { processOrderBookMessage } from '../../processors/processOrderBook';

export type OrderBookInput = {
    channel: 'l2Book';
    data: L2BookDataIF;
};
export type OrderBookOutput = {
    sells: OrderBookRowIF[];
    buys: OrderBookRowIF[];
};

self.onmessage = function (event: MessageEvent<OrderBookInput>) {
    try {
        const { data } = event.data;
        const result = processOrderBookMessage(data);
        self.postMessage(result);
    } catch (error) {
        console.error('Error parsing JSON in orderbook.worker:', error);
        self.postMessage({ error: (error as Error).message });
    }
};
