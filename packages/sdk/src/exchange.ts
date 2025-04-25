import { API } from './api';
import { Info } from './info';
import type { Meta, Cloid, BuilderInfo } from './utils/types';
import {
    type OrderRequest,
    type ModifyRequest,
    type CancelRequest,
    type CancelByCloidRequest,
    signL1Action,
    orderRequestToOrderWire,
    orderWiresToOrderAction,
    getTimestampMs,
    type OidOrCloid,
} from './utils/signing';
import { DEFAULT_SLIPPAGE, DEMO_USER, type Environment } from './config';

export interface ExchangeOptions {
    environment: Environment;
    meta?: Meta;
    vaultAddress?: string;
    accountAddress?: string;
    isDebug?: boolean;
}

export class Exchange extends API {
    public wallet: any;
    public vaultAddress?: string;
    public accountAddress?: string;
    public info: Info;
    public environment: Environment;

    constructor(wallet: any, options: ExchangeOptions) {
        super(options.environment);
        this.environment = options.environment;
        this.wallet = wallet;
        this.vaultAddress = options.vaultAddress;
        this.accountAddress = options.accountAddress;
        this.info = new Info({
            environment: options.environment,
            skipWs: true,
            meta: options.meta,
            isDebug: options.isDebug,
        });
    }

    public async setEnvironment(newEnvironment: Environment) {
        if (newEnvironment === this.environment) {
            console.log(
                'New environment is the same as the current one. No action taken.',
            );
            return;
        }

        this.environment = newEnvironment;
        this.info.setEnvironment(newEnvironment);
    }

    private async _postAction(
        action: any,
        signature: any,
        nonce: number,
    ): Promise<any> {
        console.log('mockedPostAction', action, signature, nonce);
        return Promise.resolve({
            status: 'mocked',
            action,
            signature,
            nonce,
        });
    }

    private async _slippagePrice(
        name: string,
        isBuy: boolean,
        slippage: number,
        px: number = 0,
    ): Promise<number> {
        const coin = this.info.nameToCoin[name];
        if (!px) {
            const { mids } = await this.info.allMids();
            px = Number(mids[coin]);
        }
        const asset = this.info.coinToAsset[coin];

        px *= isBuy ? 1 + slippage : 1 - slippage;
        return Math.round(px * 10 ** (6 - this.info.assetToSzDecimals[asset]));
    }

    public async order(
        name: string,
        isBuy: boolean,
        sz: number,
        limitPx: number,
        orderType: any,
        reduceOnly: boolean = false,
        cloid?: Cloid,
        builder?: BuilderInfo,
    ): Promise<any> {
        return this.bulkOrders(
            [
                {
                    coin: name,
                    is_buy: isBuy,
                    sz,
                    limit_px: limitPx,
                    order_type: orderType,
                    reduce_only: reduceOnly,
                    cloid,
                },
            ],
            builder,
        );
    }

    public async bulkOrders(
        orderRequests: OrderRequest[],
        builder?: BuilderInfo,
    ): Promise<any> {
        const orderWires = orderRequests.map((order) =>
            orderRequestToOrderWire(order, this.info.nameToAsset(order.coin)),
        );
        const timestamp = getTimestampMs();
        const action = orderWiresToOrderAction(orderWires, builder);
        const signature = signL1Action(
            this.wallet,
            action,
            this.vaultAddress,
            timestamp,
            this.environment === 'mainnet',
        );
        return this._postAction(action, signature, timestamp);
    }

    public async modifyOrder(
        oid: OidOrCloid,
        name: string,
        isBuy: boolean,
        sz: number,
        limitPx: number,
        orderType: any,
        reduceOnly: boolean = false,
        cloid?: Cloid,
    ): Promise<any> {
        return this.bulkModifyOrdersNew([
            {
                oid,
                order: {
                    coin: name,
                    is_buy: isBuy,
                    sz,
                    limit_px: limitPx,
                    order_type: orderType,
                    reduce_only: reduceOnly,
                    cloid,
                },
            },
        ]);
    }

    public async bulkModifyOrdersNew(
        modifyRequests: ModifyRequest[],
    ): Promise<any> {
        const timestamp = getTimestampMs();
        const modifyWires = modifyRequests.map((modify) => ({
            oid: modify.oid,
            order: orderRequestToOrderWire(
                modify.order,
                this.info.nameToAsset(modify.order.coin),
            ),
        }));
        const action = {
            type: 'batchModify',
            modifies: modifyWires,
        };
        const signature = signL1Action(
            this.wallet,
            action,
            this.vaultAddress,
            timestamp,
            this.environment === 'mainnet',
        );
        return this._postAction(action, signature, timestamp);
    }

    public async marketOpen(
        name: string,
        isBuy: boolean,
        sz: number,
        px?: number,
        slippage: number = DEFAULT_SLIPPAGE,
        cloid?: Cloid,
        builder?: BuilderInfo,
    ): Promise<any> {
        px = await this._slippagePrice(name, isBuy, slippage, px);
        return this.order(
            name,
            isBuy,
            sz,
            px,
            { limit: { tif: 'Ioc' } },
            false,
            cloid,
            builder,
        );
    }

    public async marketClose(
        coin: string,
        sz?: number,
        px?: number,
        slippage: number = DEFAULT_SLIPPAGE,
        cloid?: Cloid,
        builder?: BuilderInfo,
    ): Promise<any> {
        let address = this.wallet?.address ?? DEMO_USER;
        if (this.accountAddress) {
            address = this.accountAddress;
        }
        if (this.vaultAddress) {
            address = this.vaultAddress;
        }
        const state = await this.info.userState(address);
        const positions = state.assetPositions;
        for (const position of positions) {
            const item = position['position'];
            if (item['coin'] !== coin) {
                continue;
            }
            const szi = parseFloat(item['szi']);
            if (!sz) {
                sz = Math.abs(szi);
            }
            const isBuy = szi < 0;
            px = await this._slippagePrice(coin, isBuy, slippage, px);
            return this.order(
                coin,
                isBuy,
                sz,
                px,
                { limit: { tif: 'Ioc' } },
                true,
                cloid,
                builder,
            );
        }
    }

    public async cancel(name: string, oid: number): Promise<any> {
        return this.bulkCancel([{ coin: name, oid }]);
    }

    public async cancelByCloid(name: string, cloid: Cloid): Promise<any> {
        return this.bulkCancelByCloid([{ coin: name, cloid }]);
    }

    public async bulkCancel(cancelRequests: CancelRequest[]): Promise<any> {
        const timestamp = getTimestampMs();
        const action = {
            type: 'cancel',
            cancels: cancelRequests.map((cancel) => ({
                a: this.info.nameToAsset(cancel.coin),
                o: cancel.oid,
            })),
        };
        const signature = signL1Action(
            this.wallet,
            action,
            this.vaultAddress,
            timestamp,
            this.environment === 'mainnet',
        );
        return this._postAction(action, signature, timestamp);
    }

    public async bulkCancelByCloid(
        cancelRequests: CancelByCloidRequest[],
    ): Promise<any> {
        const timestamp = getTimestampMs();
        const action = {
            type: 'cancelByCloid',
            cancels: cancelRequests.map((cancel) => ({
                asset: this.info.nameToAsset(cancel.coin),
                cloid: cancel.cloid,
            })),
        };
        const signature = signL1Action(
            this.wallet,
            action,
            this.vaultAddress,
            timestamp,
            this.environment === 'mainnet',
        );
        return this._postAction(action, signature, timestamp);
    }

    public async scheduleCancel(time?: number): Promise<any> {
        const timestamp = getTimestampMs();
        const action: any = {
            type: 'scheduleCancel',
        };
        if (time != null) {
            action.time = time;
        }
        const signature = signL1Action(
            this.wallet,
            action,
            this.vaultAddress,
            timestamp,
            this.environment === 'mainnet',
        );
        return this._postAction(action, signature, timestamp);
    }

    public async updateLeverage(
        leverage: number,
        name: string,
        isCross: boolean = true,
    ): Promise<any> {
        const timestamp = getTimestampMs();
        const action = {
            type: 'updateLeverage',
            asset: this.info.nameToAsset(name),
            isCross,
            leverage,
        };
        const signature = signL1Action(
            this.wallet,
            action,
            this.vaultAddress,
            timestamp,
            this.environment === 'mainnet',
        );
        return this._postAction(action, signature, timestamp);
    }

    public async updateIsolatedMargin(
        amount: number,
        name: string,
    ): Promise<any> {
        const timestamp = getTimestampMs();
        const action = {
            type: 'updateIsolatedMargin',
            asset: this.info.nameToAsset(name),
            isBuy: true,
            ntli: amount,
        };
        const signature = signL1Action(
            this.wallet,
            action,
            this.vaultAddress,
            timestamp,
            this.environment === 'mainnet',
        );
        return this._postAction(action, signature, timestamp);
    }

    public async setReferrer(code: string): Promise<any> {
        const timestamp = getTimestampMs();
        const action = {
            type: 'setReferrer',
            code,
        };
        const signature = signL1Action(
            this.wallet,
            action,
            this.vaultAddress,
            timestamp,
            this.environment === 'mainnet',
        );
        return this._postAction(action, signature, timestamp);
    }

    public async createSubAccount(name: string): Promise<any> {
        const timestamp = getTimestampMs();
        const action = {
            type: 'createSubAccount',
            name,
        };
        const signature = signL1Action(
            this.wallet,
            action,
            this.vaultAddress,
            timestamp,
            this.environment === 'mainnet',
        );
        return this._postAction(action, signature, timestamp);
    }

    public async usdClassTransfer(
        amount: number,
        toPerp: boolean,
    ): Promise<any> {
        const timestamp = getTimestampMs();
        let strAmount = String(amount);
        if (this.vaultAddress) {
            strAmount += ` subaccount:${this.vaultAddress}`;
        }
        const action = {
            type: 'usdClassTransfer',
            amount: strAmount,
            toPerp,
            nonce: timestamp,
        };
        const signature = signL1Action(
            this.wallet,
            action,
            this.vaultAddress,
            timestamp,
            this.environment === 'mainnet',
        );
        return this._postAction(action, signature, timestamp);
    }

    public async subAccountTransfer(
        subAccountUser: string,
        isDeposit: boolean,
        usd: number,
    ): Promise<any> {
        const timestamp = getTimestampMs();
        const action = {
            type: 'subAccountTransfer',
            subAccountUser,
            isDeposit,
            usd,
        };
        const signature = signL1Action(
            this.wallet,
            action,
            this.vaultAddress,
            timestamp,
            this.environment === 'mainnet',
        );
        return this._postAction(action, signature, timestamp);
    }

    public async subAccountSpotTransfer(
        subAccountUser: string,
        isDeposit: boolean,
        token: string,
        amount: number,
    ): Promise<any> {
        const timestamp = getTimestampMs();
        const action = {
            type: 'subAccountSpotTransfer',
            subAccountUser,
            isDeposit,
            token,
            amount: String(amount),
        };
        const signature = signL1Action(
            this.wallet,
            action,
            this.vaultAddress,
            timestamp,
            this.environment === 'mainnet',
        );
        return this._postAction(action, signature, timestamp);
    }

    public async vaultUsdTransfer(
        vaultAddress: string,
        isDeposit: boolean,
        usd: number,
    ): Promise<any> {
        const timestamp = getTimestampMs();
        const action = {
            type: 'vaultTransfer',
            vaultAddress,
            isDeposit,
            usd,
        };
        const signature = signL1Action(
            this.wallet,
            action,
            this.vaultAddress,
            timestamp,
            this.environment === 'mainnet',
        );
        return this._postAction(action, signature, timestamp);
    }

    public async usdTransfer(
        amount: number,
        destination: string,
    ): Promise<any> {
        const timestamp = getTimestampMs();
        const action = {
            destination,
            amount: String(amount),
            time: timestamp,
            type: 'usdSend',
        };
        const signature = signL1Action(
            this.wallet,
            action,
            this.vaultAddress,
            timestamp,
            this.environment === 'mainnet',
        );
        return this._postAction(action, signature, timestamp);
    }

    public async spotTransfer(
        amount: number,
        destination: string,
        token: string,
    ): Promise<any> {
        const timestamp = getTimestampMs();
        const action = {
            destination,
            amount: String(amount),
            token,
            time: timestamp,
            type: 'spotSend',
        };
        const signature = signL1Action(
            this.wallet,
            action,
            this.vaultAddress,
            timestamp,
            this.environment === 'mainnet',
        );
        return this._postAction(action, signature, timestamp);
    }

    public async withdrawFromBridge(
        amount: number,
        destination: string,
    ): Promise<any> {
        const timestamp = getTimestampMs();
        const action = {
            destination,
            amount: String(amount),
            time: timestamp,
            type: 'withdraw3',
        };
        const signature = signL1Action(
            this.wallet,
            action,
            this.vaultAddress,
            timestamp,
            this.environment === 'mainnet',
        );
        return this._postAction(action, signature, timestamp);
    }
}
