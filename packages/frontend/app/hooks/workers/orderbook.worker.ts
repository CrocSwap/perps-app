/// <reference lib="webworker" />

import type { OrderBookRowIF } from '~/utils/orderbook/OrderBookIFs';
import { processOrderBookMessage } from '../../processors/processOrderBook';
import type { L2BookData } from '@perps-app/sdk/src/utils/types';

// export type OrderBookInput = {
//     channel: 'l2Book';
//     data: L2BookData;
// };

export type OrderBookOutput = {
    sells: OrderBookRowIF[];
    buys: OrderBookRowIF[];
};

// ws implementation
// self.onmessage = function (event: MessageEvent<OrderBookInput>) {
//     try {
//         const { data } = event.data;
//         console.log('>>> data', data);
//         const result = processOrderBookMessage(data);
//         self.postMessage(result);
//     } catch (error) {
//         console.error('Error parsing JSON in orderbook.worker:', error);
//         self.postMessage({ error: (error as Error).message });
//     }
// };

self.onmessage = function (event: MessageEvent<L2BookData>) {
    const { data } = event;
    try {
        const result = processOrderBookMessage(data);
        self.postMessage(result);
    } catch (error) {
        console.error('Error parsing JSON in orderbook.worker:', error);
        self.postMessage({ error: (error as Error).message });
    }
};
