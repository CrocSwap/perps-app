import { useEffect, useMemo, useState } from 'react';
import { useTradingView } from '~/contexts/TradingviewContext';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { useDebugStore } from '~/stores/DebugStore';
import type { LineData } from './component/LineComponent';
import {
    buyColor,
    quantityTextFormatWithComma,
    sellColor,
    type LineLabel,
} from './customOrderLineUtils';
import LineComponent from './component/LineComponent';

const OpenOrderLine = () => {
    const { chart } = useTradingView();
    const { userSymbolOrders, positions, symbol } = useTradeDataStore();
    const { debugWallet } = useDebugStore();

    const [lines, setLines] = useState<LineData[]>([]);

    const pnlSzi = useMemo(() => {
        const data = positions
            .filter((i) => i.coin === symbol)
            .map((i) => {
                return {
                    price: i.entryPx,
                    pnl: i.unrealizedPnl,
                    szi: i.szi,
                    liqPrice: i.liquidationPx,
                };
            });

        if (data.length > 0) {
            return data[0].szi;
        } else {
            return undefined;
        }
    }, [JSON.stringify(positions), symbol]);

    useEffect(() => {
        if (!chart || !userSymbolOrders?.length) {
            setLines([]);
            return;
        }
        const newLines: LineData[] = userSymbolOrders
            .sort((a, b) => a.timestamp - b.timestamp)
            .map((order): LineData => {
                const {
                    sz,
                    side,
                    orderType,
                    limitPx,
                    triggerPx,
                    triggerCondition,
                } = order;

                const color = side === 'buy' ? buyColor : sellColor;
                const xLoc = 0.4;
                const tempTriggerCondition =
                    triggerCondition && triggerCondition !== 'N/A'
                        ? triggerCondition
                        : '';

                let yPrice = limitPx;
                let quantityTextValue = sz;
                let label: LineLabel = {
                    type: 'Limit',
                    price: limitPx,
                    triggerCondition: tempTriggerCondition,
                };
                const type = 'LIMIT';

                if (orderType === 'Limit') {
                    label = {
                        type: 'Limit',
                        price: limitPx,
                        triggerCondition: tempTriggerCondition,
                    };
                } else {
                    if (orderType === 'Stop Limit') {
                        label = {
                            type: 'Stop Limit',
                            price: quantityTextFormatWithComma(limitPx),
                            triggerCondition: tempTriggerCondition,
                            orderType,
                        };
                    }
                    if (
                        orderType === 'Take Profit Market' ||
                        orderType === 'Stop Market'
                    ) {
                        label = {
                            type: orderType,
                            triggerCondition: tempTriggerCondition,
                            orderType,
                        };
                    }

                    if (triggerPx) {
                        yPrice = triggerPx;
                    }
                    quantityTextValue = sz ? sz : pnlSzi ? pnlSzi : 0;
                }

                return {
                    xLoc,
                    yPrice,
                    textValue: label,
                    quantityTextValue,
                    color,
                    type,
                };
            });

        setLines(newLines);
    }, [
        chart,
        JSON.stringify(userSymbolOrders),
        debugWallet,
        symbol,
        JSON.stringify(pnlSzi),
    ]);

    if (!chart) return null;

    return <LineComponent key='limit' orderType='openOrder' lines={lines} />;
};

export default OpenOrderLine;
