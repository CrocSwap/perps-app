import { useEffect, useMemo, useState } from 'react';
import { useTradingView } from '~/contexts/TradingviewContext';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { useDebugStore } from '~/stores/DebugStore';
import {
    quantityTextFormatWithComma,
    type LineLabel,
} from './customOrderLineUtils';
import type { LineData } from './component/LineComponent';
import { useAppSettings } from '~/stores/AppSettingsStore';
import { useMobile } from '~/hooks/useMediaQuery';

export const useOpenOrderLines = (): LineData[] => {
    const { bsColor, getBsColor } = useAppSettings();
    const { chart } = useTradingView();
    const { userSymbolOrders, positions, symbol } = useTradeDataStore();
    const { debugWallet } = useDebugStore();
    const isMobile = useMobile();

    const [lines, setLines] = useState<LineData[]>([]);

    const pnlSzi = useMemo(() => {
        const data = positions
            .filter((i) => i.coin === symbol)
            .map((i) => ({
                price: i.entryPx,
                pnl: i.unrealizedPnl,
                szi: i.szi,
                liqPrice: i.liquidationPx,
            }));

        return data.length > 0 ? data[0].szi : undefined;
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
                    oid,
                } = order;

                const color =
                    side === 'buy' ? getBsColor().buy : getBsColor().sell;
                const xLoc = isMobile ? 0.3 : 0.4;
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

                let priceColor: string | undefined;

                if (orderType === 'Limit') {
                    label = {
                        type: 'Limit',
                        price: limitPx,
                        triggerCondition: tempTriggerCondition,
                    };

                    priceColor = '#3b82f6';
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
                    quantityTextValue = sz || pnlSzi || 0;
                }

                return {
                    xLoc,
                    yPrice,
                    textValue: label,
                    priceColor,
                    quantityTextValue,
                    quantityText:
                        quantityTextFormatWithComma(quantityTextValue),
                    color,
                    type,
                    oid,
                    lineStyle: 3,
                    lineWidth: 1,
                    side: side,
                };
            });

        setLines(newLines.filter((i) => i.yPrice > 0));
    }, [
        chart,
        JSON.stringify(userSymbolOrders),
        debugWallet,
        symbol,
        JSON.stringify(pnlSzi),
        bsColor,
    ]);

    return lines;
};
