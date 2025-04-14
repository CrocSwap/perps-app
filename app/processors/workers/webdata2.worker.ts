// jsonParser.worker.js

import type { SymbolInfoIF } from '../../utils/SymbolInfoIFs';
import { processSymbolInfo } from '../processSymbolInfo';
import type { OrderDataIF } from '../../utils/orderbook/OrderBookIFs';
import { processUserOrder } from '../processOrderBook';
import { processPosition } from '../processPosition';
import type { PositionIF } from '../../utils/position/PositionIFs';
import { parseNum } from '../../utils/orderbook/OrderBookUtils';

self.onmessage = function (event) {
    try {
        const size = event.data.length;
        const parsedData = JSON.parse(event.data);
        const coins: SymbolInfoIF[] = [];
        const userOpenOrders: OrderDataIF[] = [];
        const positions: PositionIF[] = [];
        const data = parsedData.data;
        const tpSlMap: Map<string, { tp: number; sl: number }> = new Map();
        const coinPriceMap: Map<string, number> = new Map();

        if (data) {
            if (data.meta && data.meta.universe && data.assetCtxs) {
                data.meta.universe.forEach((coin: any) => {
                    const indexOfCoin = data.meta.universe.findIndex(
                        (item: any) => item.name === coin.name,
                    );
                    const ctxVal = data.assetCtxs[indexOfCoin];
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
                        },
                    );
                }
            }
        }

        self.postMessage({
            channel: parsedData.channel,
            data: {
                coins,
                userOpenOrders,
                user: data.user,
                size,
                positions,
                coinPriceMap,
            },
        });
    } catch (error) {
        self.postMessage({ error: (error as Error).message });
    }
};
