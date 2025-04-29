/// <reference lib="webworker" />

import type { SymbolInfoIF } from '../../utils/SymbolInfoIFs';
import { processSymbolInfo } from '../../processors/processSymbolInfo';
import type { OrderDataIF } from '../../utils/orderbook/OrderBookIFs';
import { processUserOrder } from '../../processors/processOrderBook';
import { processPosition } from '../../processors/processPosition';
import type { PositionIF } from '../../utils/position/PositionIFs';
import { parseNum } from '../../utils/orderbook/OrderBookUtils';
import type { OtherWsMsg } from '@perps-app/sdk/src/utils/types';
import type { AccountOverviewIF, UserBalanceIF } from '../../utils/UserDataIFs';
import { processUserBalance } from '../../processors/processUserBalance';
export type WebData2Input = OtherWsMsg;
export type WebData2Output = {
    channel: string;
    data: {
        coins: SymbolInfoIF[];
        userOpenOrders: OrderDataIF[];
        user: string;
        positions: PositionIF[];
        coinPriceMap: Map<string, number>;
        userBalances: UserBalanceIF[];
        accountOverview: AccountOverviewIF;
    };
};

self.onmessage = function (event: MessageEvent<OtherWsMsg>) {
    try {
        const parsedData = event.data;
        const coins: SymbolInfoIF[] = [];
        const userOpenOrders: OrderDataIF[] = [];
        const positions: PositionIF[] = [];
        const data = parsedData.data;
        const tpSlMap: Map<string, { tp: number; sl: number }> = new Map();
        const coinPriceMap: Map<string, number> = new Map();
        const userBalances: UserBalanceIF[] = [];
        const accountOverview: AccountOverviewIF = {
            balance: 0,
            unrealizedPnl: 0,
            crossMarginRatio: 0,
            maintainanceMargin: 0,
            crossAccountLeverage: 0,
        };
        let unrealizedPnl = 0;
        let totalPositionsValue = 0;

        // TODO: type check data, the type might end up kinda different for our backend though
        if (data) {
            if (data.meta && data.meta.universe && data.assetCtxs) {
                data.meta.universe.forEach((coin: any) => {
                    const indexOfCoin = data.meta.universe.findIndex(
                        (item: any) => item.name === coin.name,
                    );
                    const ctxVal = data.assetCtxs[indexOfCoin];
                    coinPriceMap.set('USDC', 1);
                    if (ctxVal !== null) {
                        const coinObject = processSymbolInfo({
                            coin: coin.name,
                            szDecimals: coin.szDecimals,
                            maxLeverage: coin.maxLeverage,
                            ctx: ctxVal,
                        });
                        coins.push(coinObject);
                        coinPriceMap.set(coin.name, coinObject.markPx);
                    }
                });
                data.openOrders.forEach((order: any) => {
                    const processedOrder = processUserOrder(order, 'open');
                    if (processedOrder) {
                        userOpenOrders.push(processedOrder);
                        if (processedOrder.isPositionTpsl) {
                            if (
                                processedOrder.orderType?.indexOf(
                                    'Take Profit',
                                ) !== -1
                            ) {
                                tpSlMap.set(processedOrder.coin, {
                                    tp: parseNum(processedOrder.triggerPx || 0),
                                    sl:
                                        tpSlMap.get(processedOrder.coin)?.sl ||
                                        0,
                                });
                            } else if (
                                processedOrder.orderType?.indexOf('Stop') !== -1
                            ) {
                                tpSlMap.set(processedOrder.coin, {
                                    tp:
                                        tpSlMap.get(processedOrder.coin)?.tp ||
                                        0,
                                    sl: parseNum(processedOrder.triggerPx || 0),
                                });
                            }
                        }
                    }
                });

                if (data.clearinghouseState) {
                    data.clearinghouseState.assetPositions.forEach(
                        (position: any) => {
                            const processedPosition = processPosition(position);
                            if (tpSlMap.has(processedPosition.coin)) {
                                const existingOrder = tpSlMap.get(
                                    processedPosition.coin,
                                );
                                processedPosition.tp = existingOrder?.tp || 0;
                                processedPosition.sl = existingOrder?.sl || 0;
                            }
                            positions.push(processedPosition);
                            unrealizedPnl += processedPosition.unrealizedPnl;
                            totalPositionsValue +=
                                processedPosition.positionValue;
                        },
                    );

                    if (data.clearinghouseState.marginSummary) {
                        const total = parseNum(
                            data.clearinghouseState.marginSummary.accountValue,
                        );
                        const hold = parseNum(
                            data.clearinghouseState.marginSummary
                                .totalMarginUsed,
                        );
                        userBalances.push({
                            coin: 'USDC',
                            type: 'margin',
                            total: total,
                            entryNtl: 0,
                            hold: hold,
                            sortName: '\x01',
                            usdcValue: total,
                            pnlValue: 0,
                            available: total - hold,
                            metaIndex: 0,
                            buyingPower: total - hold,
                        });
                    }

                    if (data.clearinghouseState.marginSummary) {
                        accountOverview.balance = parseNum(
                            data.clearinghouseState.marginSummary.accountValue,
                        );
                        accountOverview.unrealizedPnl = unrealizedPnl;
                        accountOverview.maintainanceMargin = parseNum(
                            data.clearinghouseState.crossMaintenanceMarginUsed,
                        );
                        accountOverview.crossMarginRatio =
                            (accountOverview.maintainanceMargin /
                                accountOverview.balance) *
                            100;

                        accountOverview.crossAccountLeverage =
                            totalPositionsValue / accountOverview.balance;
                    }
                }

                if (data.spotState && data.spotState.balances) {
                    data.spotState.balances.forEach((balance: any) => {
                        userBalances.push(
                            processUserBalance(balance, 'spot', coinPriceMap),
                        );
                    });
                }
            }
        }

        self.postMessage({
            channel: parsedData.channel,
            data: {
                coins,
                userOpenOrders,
                user: data.user,
                positions,
                coinPriceMap,
                userBalances,
                accountOverview,
            },
        } as WebData2Output);
    } catch (error) {
        console.error('Error processing webdata2 worker:', error);
        self.postMessage({ error: (error as Error).message });
    }
};
