import { isEstablished, useSession } from '@fogo/sessions-sdk-react';
import { useEffect, useMemo, useState } from 'react';
import { useTradingView } from '~/contexts/TradingviewContext';
import { useAppSettings } from '~/stores/AppSettingsStore';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { MIN_POSITION_USD_SIZE } from '~/utils/Constants';
import type { LineData } from './component/LineComponent';
import {
    formatLiquidationPrice,
    quantityTextFormatWithComma,
    type LineLabel,
} from './customOrderLineUtils';
import { LIQ_PRICE_LINE_COLOR } from './orderLineUtils';
import useNumFormatter from '~/hooks/useNumFormatter';
import { t } from 'i18next';

export const usePositionOrderLines = (): LineData[] => {
    const { chart } = useTradingView();
    const { positions, symbol } = useTradeDataStore();
    const { bsColor, getBsColor } = useAppSettings();

    const sessionState = useSession();
    const isSessionEstablished = isEstablished(sessionState);
    const { formatNum } = useNumFormatter();

    const [lines, setLines] = useState<LineData[]>([]);

    const filteredPositions = useMemo(() => {
        return positions
            .filter((i) => i.coin === symbol)
            .filter((i) => Math.abs(i.szi) * i.entryPx > MIN_POSITION_USD_SIZE)
            .map((i) => ({
                price: i.entryPx,
                pnl: i.unrealizedPnl,
                szi: i.szi,
                liqPrice: i.liquidationPx,
            }));
    }, [JSON.stringify(positions), symbol]);

    useEffect(() => {
        if (!isSessionEstablished || !chart || !positions?.length) {
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
                    quantityText: quantityTextFormatWithComma(order.szi),
                    color: pnl > 0 ? getBsColor().buy : getBsColor().sell,
                    type: 'PNL',
                    lineStyle: 3,
                    lineWidth: 1,
                    dash: [6, 6],
                });
            }

            if (order.liqPrice > 0) {
                result.push({
                    xLoc: 0.2,
                    yPrice: order.liqPrice,
                    textValue: {
                        type: 'Liq',
                        text: `${t('chart.liqPrice')}`,
                    } as LineLabel,
                    quantityTextValue: order.liqPrice,
                    quantityText: formatLiquidationPrice(
                        order.liqPrice,
                        formatNum,
                    ),
                    color: LIQ_PRICE_LINE_COLOR,
                    type: 'LIQ',
                    lineStyle: 3,
                    lineWidth: 2,
                    dash: [12, 12],
                });
            }

            return result;
        });

        setLines(newLines);
    }, [
        isSessionEstablished,
        chart,
        JSON.stringify(filteredPositions),
        symbol,
        bsColor,
    ]);

    return lines;
};
