import { processUserOrder } from '~/processors/processOrderBook';
import type { OrderDataIF } from '~/utils/orderbook/OrderBookIFs';

export type ApiCallConfig = {
    type: string;
    handler: (data: any, payload: any) => void;
    payload?: any;
};

export enum ApiEndpoints {
    HISTORICAL_ORDERS = 'historicalOrders',
    OPEN_ORDERS = 'frontendOpenOrders',
}

// const apiUrl = 'https://api-ui.hyperliquid.xyz/info';
const apiUrl = 'https://api.hyperliquid.xyz/info';

export function useInfoApi() {
    const fetchData = async (config: ApiCallConfig) => {
        const payload = { type: config.type, ...config.payload };
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const data = await response.json();
        config.handler(data, payload);
    };

    const fetchOrderHistory = async (
        address: string,
    ): Promise<OrderDataIF[]> => {
        const ret: OrderDataIF[] = [];
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: ApiEndpoints.HISTORICAL_ORDERS,
                user: address,
            }),
        });
        const data = await response.json();
        if (data && data.length > 0) {
            data.map((o: any) => {
                const processedOrder = processUserOrder(o.order, o.status);
                if (processedOrder) {
                    ret.push(processedOrder);
                }
            });
        }
        return ret;
    };

    return { fetchData, fetchOrderHistory };
}
