import { API } from './api';
import { WebsocketManager, type ActiveSubscription } from './ws';
import { MultiSocketInfo, type WebSocketEndpoints } from './websocket-pool';
import type {
    AllMidsData,
    CandleSnapshotData,
    ClearinghouseState,
    Cloid,
    FrontendOpenOrdersData,
    FundingHistoryData,
    L2SnapshotData,
    Meta,
    MetaAndAssetCtxsData,
    OpenOrdersData,
    OrderStatusData,
    SubAccountsData,
    Subscription,
    UserFillsInfoData,
} from './utils/types';

type Callback = (msg: any) => void;

import type { ErrCallback } from './websocket-instance';
import { API_URLS, type Environment } from './config';

interface InfoOptions {
    environment: Environment;
    skipWs?: boolean;
    meta?: Meta;
    isDebug?: boolean;
    workers?: number;
    useMultiSocket?: boolean;
    wsEndpoints?: WebSocketEndpoints;
}

export class Info extends API {
    public wsManager: WebsocketManager | null = null;
    public multiSocketInfo: MultiSocketInfo | null = null;
    public coinToAsset: Record<string, number> = {};
    public nameToCoin: Record<string, string> = {};
    public assetToSzDecimals: Record<number, number> = {};
    public environment: Environment;
    public baseUrl: string;
    private useMultiSocket: boolean = false;
    private useMarketOnly: boolean = false;

    constructor(options: InfoOptions) {
        super(options.environment);
        this.environment = options.environment;
        this.baseUrl = API_URLS[this.environment];
        const {
            skipWs = false,
            isDebug = false,
            workers = 4,
            useMultiSocket = false,
            wsEndpoints,
        } = options;

        this.useMultiSocket = useMultiSocket;

        if (!skipWs) {
            if (useMultiSocket) {
                // Use multi-socket mode
                const endpoints = wsEndpoints || {
                    market: this.baseUrl,
                    user: this.baseUrl,
                };
                this.multiSocketInfo = new MultiSocketInfo(endpoints, isDebug);
            } else {
                // Use single socket mode (backward compatibility)
                this.wsManager = new WebsocketManager(
                    this.baseUrl,
                    isDebug,
                    workers,
                );
            }
        }

        // async init
        this._initMappings(options.meta);
    }

    public async setEnvironment(newEnvironment: Environment) {
        if (newEnvironment === this.environment) {
            console.log(
                'New environment is the same as the current one. No action taken.',
            );
            return;
        }

        console.log(`Setting new environment: ${newEnvironment}`);

        this.environment = newEnvironment;
        this.baseUrl = API_URLS[newEnvironment];

        if (this.useMultiSocket) {
            if (this.multiSocketInfo) {
                // For multi-socket, we need to recreate with new endpoints
                this.multiSocketInfo.stop();
                this.multiSocketInfo = new MultiSocketInfo(
                    {
                        market: this.baseUrl,
                        user: this.baseUrl,
                    },
                    false,
                );
            }
        } else {
            if (this.wsManager) {
                this.wsManager.setBaseUrl(this.baseUrl);
            }
        }

        this.coinToAsset = {};
        this.nameToCoin = {};
        this.assetToSzDecimals = {};

        await this._initMappings();
        console.log(`Environment successfully set to: ${newEnvironment}`);
    }

    private async _initMappings(meta?: Meta) {
        if (!meta) {
            meta = await this.meta();
        }

        for (let asset = 0; asset < meta.universe.length; asset++) {
            const assetInfo = meta.universe[asset];
            this.coinToAsset[assetInfo.name] = asset;
            this.nameToCoin[assetInfo.name] = assetInfo.name;
            this.assetToSzDecimals[asset] = assetInfo.szDecimals;
        }
    }

    public disconnectWebsocket() {
        if (this.useMultiSocket) {
            if (!this.multiSocketInfo) {
                throw new Error(
                    'Cannot call disconnectWebsocket since skipWs was used',
                );
            }
            this.multiSocketInfo.stop();
        } else {
            if (!this.wsManager) {
                throw new Error(
                    'Cannot call disconnectWebsocket since skipWs was used',
                );
            }
            this.wsManager.stop();
        }
    }

    public async userState(address: string): Promise<ClearinghouseState> {
        return this.post('/info', {
            type: 'clearinghouseState',
            user: address,
        });
    }

    public async openOrders(address: string): Promise<OpenOrdersData> {
        return this.post('/info', { type: 'openOrders', user: address });
    }

    public async frontendOpenOrders(
        address: string,
    ): Promise<FrontendOpenOrdersData> {
        return this.post('/info', {
            type: 'frontendOpenOrders',
            user: address,
        });
    }

    public async allMids(): Promise<AllMidsData> {
        return this.post('/info', { type: 'allMids' });
    }

    public async userFills(address: string): Promise<UserFillsInfoData> {
        return this.post('/info', { type: 'userFills', user: address });
    }

    public async userFillsByTime(
        address: string,
        startTime: number,
        endTime?: number,
    ): Promise<UserFillsInfoData> {
        return this.post('/info', {
            type: 'userFillsByTime',
            user: address,
            startTime,
            ...(endTime !== undefined ? { endTime } : {}),
        });
    }

    public async meta(): Promise<Meta> {
        return this.post('/info', { type: 'meta' }) as Promise<Meta>;
    }

    public async metaAndAssetCtxs(): Promise<MetaAndAssetCtxsData> {
        return this.post('/info', { type: 'metaAndAssetCtxs' });
    }

    public async fundingHistory(
        name: string,
        startTime: number,
        endTime?: number,
    ): Promise<FundingHistoryData> {
        const coin = this.nameToCoin[name];
        const payload: any = { type: 'fundingHistory', coin, startTime };
        if (endTime !== undefined) payload.endTime = endTime;
        return this.post('/info', payload);
    }

    public async userFundingHistory(
        user: string,
        startTime: number,
        endTime?: number,
    ): Promise<FundingHistoryData> {
        const payload: any = { type: 'userFunding', user, startTime };
        if (endTime !== undefined) payload.endTime = endTime;
        return this.post('/info', payload);
    }

    public async l2Snapshot(name: string): Promise<L2SnapshotData> {
        return this.post('/info', {
            type: 'l2Book',
            coin: this.nameToCoin[name],
        });
    }

    public async candlesSnapshot(
        name: string,
        interval: string,
        startTime: number,
        endTime: number,
    ): Promise<CandleSnapshotData> {
        const req = {
            coin: this.nameToCoin[name],
            interval,
            startTime,
            endTime,
        };
        return this.post('/info', { type: 'candleSnapshot', req });
    }

    public async queryOrderByOid(
        user: string,
        oid: number,
    ): Promise<OrderStatusData> {
        return this.post('/info', { type: 'orderStatus', user, oid });
    }

    public async queryOrderByCloid(
        user: string,
        cloid: Cloid,
    ): Promise<OrderStatusData> {
        return this.post('/info', { type: 'orderStatus', user, oid: cloid });
    }

    public async querySubAccounts(user: string): Promise<SubAccountsData> {
        return this.post('/info', { type: 'subAccounts', user });
    }

    public subscribe(
        subscription: Subscription,
        callback: Callback,
        errorCallback?: ErrCallback,
    ): { subId?: number; unsubscribe: () => void } {
        if (
            subscription.type === 'l2Book' ||
            subscription.type === 'trades' ||
            subscription.type === 'candle'
        ) {
            subscription.coin = this.nameToCoin[subscription.coin];
        }

        if (this.useMultiSocket) {
            if (!this.multiSocketInfo) {
                throw new Error('Cannot call subscribe since skipWs was used');
            }
            const result = this.multiSocketInfo.subscribe(
                subscription,
                callback,
                errorCallback,
            );
            return {
                unsubscribe: result.unsubscribe,
            };
        } else {
            if (!this.wsManager) {
                throw new Error('Cannot call subscribe since skipWs was used');
            }
            const subId = this.wsManager.subscribe(subscription, callback);
            return {
                subId,
                unsubscribe: () =>
                    this.unsubscribe(subscription, subId, callback),
            };
        }
    }

    public unsubscribe(
        subscription: Subscription,
        subscriptionId: number,
        callback?: Callback,
    ): boolean {
        if (
            subscription.type === 'l2Book' ||
            subscription.type === 'trades' ||
            subscription.type === 'candle'
        ) {
            subscription.coin = this.nameToCoin[subscription.coin];
        }

        if (this.useMultiSocket) {
            if (!this.multiSocketInfo) {
                throw new Error(
                    'Cannot call unsubscribe since skipWs was used',
                );
            }
            if (callback) {
                this.multiSocketInfo.unsubscribe(
                    subscription,
                    callback,
                    subscriptionId,
                );
            }
            return true;
        } else {
            if (!this.wsManager) {
                throw new Error(
                    'Cannot call unsubscribe since skipWs was used',
                );
            }
            return this.wsManager.unsubscribe(
                subscription,
                subscriptionId,
                callback,
            );
        }
    }

    public hardUnsubscribe(
        subscription: Subscription,
        callback: Callback,
    ): void {
        if (this.useMultiSocket) {
            this.multiSocketInfo?.hardUnsubscribe(subscription, callback);
        }
    }

    public nameToAsset(name: string): number {
        return this.coinToAsset[this.nameToCoin[name]];
    }

    public setUseMarketOnly(useMarketOnly: boolean) {
        this.useMarketOnly = useMarketOnly;
        if (this.useMultiSocket) {
            this.multiSocketInfo?.setUseMarketOnly(useMarketOnly);
        }
    }
}
