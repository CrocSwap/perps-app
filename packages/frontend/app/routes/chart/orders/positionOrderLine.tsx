import { useEffect, useMemo, useState } from 'react';
import { useTradingView } from '~/contexts/TradingviewContext';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import type { LineData } from './component/LineComponent';
import { buyColor, sellColor, type LineLabel } from './customOrderLineUtils';
import LineComponent from './component/LineComponent';

const PositionOrderLine = () => {
    const { chart } = useTradingView();
    const { positions, symbol } = useTradeDataStore();

    const [lines, setLines] = useState<LineData[]>([]);

    const filteredPositions = useMemo(() => {
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

        return data;
    }, [JSON.stringify(positions), symbol]);

    useEffect(() => {
        if (!chart || !positions?.length) {
            setLines([]);
            return;
        }

        const newLines: LineData[] = filteredPositions.flatMap((order) => {
            const pnl = Number(order.pnl.toFixed(2));
            const orderTextValuePNL = { type: 'PNL', pnl: pnl } as LineLabel;
            const orderTextValueLiq = {
                type: 'Liq',
                text: ' Liq. Price',
            } as LineLabel;

            const pnlLine: LineData = {
                xLoc: 0.1,
                yPrice: order.price,
                textValue: orderTextValuePNL,
                quantityTextValue: order.szi,
                color: pnl > 0 ? buyColor : sellColor,
                type: 'PNL',
            };

            const liqLine: LineData = {
                xLoc: 0.2,
                yPrice: order.liqPrice,
                textValue: orderTextValueLiq,
                quantityTextValue: undefined,
                color: sellColor,
                type: 'LIQ',
            };

            return [pnlLine, liqLine];
        });

        setLines(newLines);
    }, [chart, JSON.stringify(filteredPositions), symbol]);

    if (!chart) return null;

    return <LineComponent key='pnl' lines={lines} />;
};

export default PositionOrderLine;
