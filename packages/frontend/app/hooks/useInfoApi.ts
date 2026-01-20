import type {
    OpenOrderRawData,
    OrderHistory,
} from '@perps-app/sdk/src/utils/types';
import { processUserOrder } from '~/processors/processOrderBook';
import {
    processUserFills,
    processUserFundings,
    processUserTwapHistory,
    processUserTwapSliceFills,
} from '~/processors/processUserFills';
import { processVaultDetails } from '~/processors/processVault';
import type { OrderDataIF } from '~/utils/orderbook/OrderBookIFs';
import type {
    SpotMetaIF,
    TokenDetailsIF,
    TokenDetailsRawIF,
} from '~/utils/SymbolInfoIFs';
import type {
    TwapHistoryIF,
    TwapSliceFillIF,
    UserFillIF,
    UserFundingIF,
    UserFundingResponseIF,
} from '~/utils/UserDataIFs';
import type { VaultDetailsIF } from '~/utils/VaultIFs';
import type { TransactionData } from '~/components/Trade/DepositsWithdrawalsTable/DepositsWithdrawalsTableRow';
import { POLLING_API_INFO_ENDPOINT } from '~/utils/Constants';

export type ApiCallConfig = {
    type: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handler: (data: any, payload: any) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload?: any;
};

export enum ApiEndpoints {
    HISTORICAL_ORDERS = 'historicalOrders',
    OPEN_ORDERS = 'frontendOpenOrders',
    USER_FILLS = 'userFills',
    TWAP_HISTORY = 'twapHistory',
    TWAP_SLICE_FILLS = 'userTwapSliceFills',
    FUNDING_HISTORY = 'userFunding',
    USER_PORTFOLIO = 'portfolio',
    VAULT_DETAILS = 'vaultDetails',
    USER_NON_FUNDING_LEDGER_UPDATES = 'userNonFundingLedgerUpdates',
    SPOT_META = 'spotMeta',
    TOKEN_DETAILS = 'tokenDetails',
}

const apiUrl = POLLING_API_INFO_ENDPOINT;

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
            data.map((o: OrderHistory) => {
                const processedOrder = processUserOrder(o.order, o.status);
                if (processedOrder) {
                    ret.push(processedOrder);
                }
            });
        }
        return ret;
    };

    const fetchUserFills = async (
        address: string,
        aggregateByTime?: boolean,
    ): Promise<UserFillIF[]> => {
        const ret: UserFillIF[] = [];
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: ApiEndpoints.USER_FILLS,
                user: address,
                aggregateByTime,
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

    const fetchUserPortfolio = async (
        address: string,
    ): Promise<Map<string, object>> => {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: ApiEndpoints.USER_PORTFOLIO,
                user: address,
            }),
        });

        const obj = new Map<string, object>();

        const data = await response.json();
        if (data && data.length > 0) {
            for (const [timeframe, position] of data) {
                obj.set(timeframe, {
                    ...position,
                });
            }
        }

        return obj;
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
        const processed = processVaultDetails(data);
        return processed;
    };

    const fetchVaults = async (): Promise<VaultDetailsIF[]> => {
        const response = await fetch(
            'https://stats-data.hyperliquid.xyz/Mainnet/vaults',
            {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            },
        );

        const data = await response.json();

        return data;
    };

    const fetchUserNonFundingLedgerUpdates = async (
        address: string,
    ): Promise<TransactionData[]> => {
        const ret: TransactionData[] = [];
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: ApiEndpoints.USER_NON_FUNDING_LEDGER_UPDATES,
                user: address,
            }),
        });
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
            ret.push(...(data as TransactionData[]));
        }
        return ret;
    };

    const fetchSpotMeta = async (): Promise<SpotMetaIF> => {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: ApiEndpoints.SPOT_META,
            }),
        });
        const data = await response.json();
        return data as SpotMetaIF;
    };

    const fetchTokenId = async (tokenName: string): Promise<string> => {
        const spotMeta = await fetchSpotMeta();
        if (tokenName === 'BTC') {
            tokenName = 'UBTC';
        }
        const token = spotMeta.tokens.find((t) => t.name === tokenName);
        return token?.tokenId || '';
    };

    const fetchTokenDetails = async (
        tokenId: string,
    ): Promise<TokenDetailsIF> => {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: ApiEndpoints.TOKEN_DETAILS,
                tokenId: tokenId,
            }),
        });
        const data = (await response.json()) as TokenDetailsRawIF;

        const ret = {
            name: data.name,
            maxSupply: Number(data.maxSupply),
            totalSupply: Number(data.totalSupply),
            circulatingSupply: Number(data.circulatingSupply),
            szDecimals: data.szDecimals,
            weiDecimals: data.weiDecimals,
            midPx: Number(data.midPx),
            markPx: Number(data.markPx),
            prevDayPx: Number(data.prevDayPx),
        };

        return ret;
    };

    const fetchUserHistory = async (
        userPubkey: string,
    ): Promise<{
        pnlHistory: { time: number; value: number }[];
        accountValueHistory: { time: number; value: number }[];
    }> => {
        const response = await fetch(
            `https://ember-leaderboard-v2.liquidity.tools/user/${userPubkey}/history`,
            {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            },
        );
        const data = await response.json();

        const pnlHistory: { time: number; value: number }[] = [];
        const accountValueHistory: { time: number; value: number }[] = [];

        if (data && data.history && Array.isArray(data.history)) {
            for (const entry of data.history) {
                const time = entry.window_start;
                pnlHistory.push({ time, value: entry.pnl });
                accountValueHistory.push({ time, value: entry.account_value });
            }
        }

        return { pnlHistory, accountValueHistory };
    };

    return {
        fetchData,
        fetchOrderHistory,
        fetchUserFills,
        fetchTwapHistory,
        fetchTwapSliceFills,
        fetchFundingHistory,
        fetchOpenOrders,
        fetchUserPortfolio,
        fetchVaultDetails,
        fetchVaults,
        fetchUserNonFundingLedgerUpdates,
        fetchTokenId,
        fetchTokenDetails,
        fetchUserHistory,
    };
}
