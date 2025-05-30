import type { OpenOrderRawData } from '@perps-app/sdk/src/utils/types';
import { processUserOrder } from '~/processors/processOrderBook';
import {
    processUserFills,
    processUserFundings,
    processUserTwapHistory,
    processUserTwapSliceFills,
} from '~/processors/processUserFills';
import type { OrderDataIF } from '~/utils/orderbook/OrderBookIFs';
import type {
    TwapHistoryIF,
    TwapSliceFillIF,
    UserFillIF,
    UserFundingIF,
    UserFundingResponseIF,
} from '~/utils/UserDataIFs';
import type { VaultDetailsIF } from '~/utils/VaultIFs';

export type ApiCallConfig = {
    type: string;
    handler: (data: any, payload: any) => void;
    payload?: any;
};

export enum ApiEndpoints {
    HISTORICAL_ORDERS = 'historicalOrders',
    OPEN_ORDERS = 'frontendOpenOrders',
    USER_FILLS = 'userFills',
    TWAP_HISTORY = 'twapHistory',
    TWAP_SLICE_FILLS = 'userTwapSliceFills',
    FUNDING_HISTORY = 'userFunding',
    VAULT_DETAILS = 'vaultDetails',
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

    const fetchUserFills = async (address: string): Promise<UserFillIF[]> => {
        const ret: UserFillIF[] = [];
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: ApiEndpoints.USER_FILLS,
                user: address,
            }),
        });
        const data = await response.json();
        if (data && data.length > 0) {
            const processed = processUserFills({
                fills: data,
                isSnapshot: true,
                user: '',
            });
            if (processed.length > 0) {
                ret.push(...processed);
            }
        }
        return ret;
    };

    const fetchTwapHistory = async (
        address: string,
    ): Promise<TwapHistoryIF[]> => {
        const ret: TwapHistoryIF[] = [];
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: ApiEndpoints.TWAP_HISTORY,
                user: address,
            }),
        });
        const data = await response.json();
        if (data && data.length > 0) {
            const processed = processUserTwapHistory({
                history: data,
                isSnapshot: true,
                user: '',
            });
            if (processed.length > 0) {
                ret.push(...processed);
            }
        }
        return ret;
    };

    const fetchTwapSliceFills = async (
        address: string,
    ): Promise<TwapSliceFillIF[]> => {
        const ret: TwapSliceFillIF[] = [];

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: ApiEndpoints.TWAP_SLICE_FILLS,
                user: address,
            }),
        });
        const data = await response.json();
        if (data && data.length > 0) {
            const processed = processUserTwapSliceFills({
                user: address,
                twapSliceFills: data,
                isSnapshot: true,
            });
            if (processed.length > 0) {
                ret.push(...processed);
            }
        }
        return ret;
    };

    const fetchFundingHistory = async (
        address: string,
    ): Promise<UserFundingIF[]> => {
        const ret: UserFundingIF[] = [];
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: ApiEndpoints.FUNDING_HISTORY,
                user: address,
            }),
        });
        const data = await response.json();
        const preProcessed = data.map((d: UserFundingResponseIF) => {
            return {
                time: d.time,
                coin: d.delta.coin,
                usdc: d.delta.usdc,
                szi: d.delta.szi,
                fundingRate: d.delta.fundingRate,
            };
        });

        if (preProcessed && preProcessed.length > 0) {
            const processed = processUserFundings(preProcessed);
            if (processed.length > 0) {
                ret.push(...processed);
            }
        }
        return ret;
    };

    const fetchOpenOrders = async (address: string): Promise<OrderDataIF[]> => {
        const ret: OrderDataIF[] = [];
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: ApiEndpoints.OPEN_ORDERS,
                user: address,
            }),
        });
        const data = await response.json();
        if (data && data.length > 0) {
            data.forEach((o: OpenOrderRawData) => {
                const processedOrder = processUserOrder(o, 'open');
                if (processedOrder) {
                    ret.push(processedOrder);
                }
            });
        }
        return ret;
    };

    const fetchVaultDetails = async (
        address: string,
        vaultAddress: string,
    ): Promise<VaultDetailsIF> => {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: ApiEndpoints.VAULT_DETAILS,
                user: address,
                vaultAddress: vaultAddress,
            }),
        });
        const data = await response.json();
        return data as VaultDetailsIF;
    };

    return {
        fetchData,
        fetchOrderHistory,
        fetchUserFills,
        fetchTwapHistory,
        fetchTwapSliceFills,
        fetchFundingHistory,
        fetchOpenOrders,
        fetchVaultDetails,
    };
}
