import { API } from './api';
import { WebsocketManager } from './ws';
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

import type { Environment } from './config';
import { API_URLS } from './config';

interface InfoOptions {
    environment: Environment;
    skipWs?: boolean;
    meta?: Meta;
    isDebug?: boolean;
}

export class Info extends API {
    public wsManager: WebsocketManager | null = null;
    public coinToAsset: Record<string, number> = {};
    public nameToCoin: Record<string, string> = {};
    public assetToSzDecimals: Record<number, number> = {};
    public environment: Environment;
    public baseUrl: string;

    constructor(options: InfoOptions) {
        super(options.environment);
        this.environment = options.environment;
        this.baseUrl = API_URLS[this.environment];
        const { skipWs = false, isDebug = false } = options;

        if (!skipWs) {
            this.wsManager = new WebsocketManager(this.baseUrl, isDebug);
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

        if (this.wsManager) {
            this.wsManager.setBaseUrl(this.baseUrl);
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
        if (!this.wsManager) {
            throw new Error(
                'Cannot call disconnectWebsocket since skipWs was used',
            );
        }
        this.wsManager.stop();
    }

    public stashWebsocket() {
        if (!this.wsManager) {
            throw new Error('Cannot call stashWebsocket since skipWs was used');
        }
        this.wsManager.stashWebsocket();
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
    ): { subId: number; unsubscribe: () => void } {
        if (
            subscription.type === 'l2Book' ||
            subscription.type === 'trades' ||
            subscription.type === 'candle'
        ) {
            subscription.coin = this.nameToCoin[subscription.coin];
        }
        if (!this.wsManager) {
            throw new Error('Cannot call subscribe since skipWs was used');
        }
        const subId = this.wsManager.subscribe(subscription, callback);
        return {
            subId,
            unsubscribe: () => this.unsubscribe(subscription, subId),
        };
    }

    public unsubscribe(
        subscription: Subscription,
        subscriptionId: number,
    ): boolean {
        if (
            subscription.type === 'l2Book' ||
            subscription.type === 'trades' ||
            subscription.type === 'candle'
        ) {
            subscription.coin = this.nameToCoin[subscription.coin];
        }
        if (!this.wsManager) {
            throw new Error('Cannot call unsubscribe since skipWs was used');
        }
        return this.wsManager.unsubscribe(subscription, subscriptionId);
    }

    public nameToAsset(name: string): number {
        return this.coinToAsset[this.nameToCoin[name]];
    }
}
