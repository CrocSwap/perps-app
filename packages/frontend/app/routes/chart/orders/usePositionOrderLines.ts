import { useEffect, useMemo, useState } from 'react';
import { useTradingView } from '~/contexts/TradingviewContext';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { type LineLabel } from './customOrderLineUtils';
import type { LineData } from './component/LineComponent';
import { useAppSettings } from '~/stores/AppSettingsStore';
import { LIQ_PRICE_LINE_COLOR } from './orderLineUtils';

export const usePositionOrderLines = (): LineData[] => {
    const { chart } = useTradingView();
    const { positions, symbol } = useTradeDataStore();
    const { bsColor, getBsColor } = useAppSettings();

    const [lines, setLines] = useState<LineData[]>([]);

    const filteredPositions = useMemo(() => {
        return positions
            .filter((i) => i.coin === symbol)
            .map((i) => ({
                price: i.entryPx,
                pnl: i.unrealizedPnl,
                szi: i.szi,
                liqPrice: i.liquidationPx,
            }));
    }, [JSON.stringify(positions), symbol]);

    useEffect(() => {
        if (!chart || !positions?.length) {
            setLines([]);
            return;
        }

        const newLines: LineData[] = filteredPositions.flatMap((order) => {
            const result: LineData[] = [];
            const pnl = Number(order.pnl.toFixed(2));

            if (order.price > 0) {
                result.push({
                    xLoc: 0.1,
                    yPrice: order.price,
                    textValue: { type: 'PNL', pnl } as LineLabel,
                    quantityTextValue: order.szi,
                    color: pnl > 0 ? getBsColor().buy : getBsColor().sell,
                    type: 'PNL',
                    lineStyle: 3,
                    lineWidth: 1,
                });
            }

            if (order.liqPrice > 0) {
                result.push({
                    xLoc: 0.2,
                    yPrice: order.liqPrice,
                    textValue: {
                        type: 'Liq',
                        text: ' Liq. Price',
                    } as LineLabel,
                    quantityTextValue: undefined,
                    color: LIQ_PRICE_LINE_COLOR,
                    type: 'LIQ',
                    lineStyle: 3,
                    lineWidth: 2,
                });
            }

            return result;
        });

        setLines(newLines);
    }, [chart, JSON.stringify(filteredPositions), symbol, bsColor]);

    return lines;
};
