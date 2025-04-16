import { useEffect, useRef, useState } from 'react';
import { useTradingView } from '~/contexts/TradingviewContext';

import type { EntityId } from '~/tv/charting_library';
import {
    addCustomOrderLine,
    createAnchoredMainText,
    createQuantityAnchoredText,
    formatLineLabel,
    getAnchoredQuantityTextLocation,
    priceToPixel,
    quantityTextFormatWithComma,
    type LineLabel,
} from '../customOrderLineUtils';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { useDebugStore } from '~/stores/DebugStore';

export type LineData = {
    xLoc: number;
    yPrice: number;
    textValue: LineLabel;
    quantityTextValue?: number;
    color: string;
    type: 'PNL' | 'LIMIT' | 'TP_SL' | 'LIQ';
};

interface LineProps {
    lines: LineData[];
}

export type ChartShapeRefs = {
    lineId: EntityId;
    textId: EntityId;
    quantityTextId?: EntityId;
};

const LineComponent = ({ lines }: LineProps) => {
    const { chart } = useTradingView();

    const orderLineItemsRef = useRef<ChartShapeRefs[]>([]);

    const [orderLineItems, setOrderLineItems] = useState<ChartShapeRefs[]>([]);

    const { symbol } = useTradeDataStore();
    const { debugWallet } = useDebugStore();

    const cleanupShapes = async () => {
        try {
            if (chart) {
                const chartRef = chart.activeChart();
                const prevItems = orderLineItemsRef.current;

                for (const order of prevItems) {
                    const { lineId, textId, quantityTextId } = order;

                    const element = chartRef.getShapeById(lineId);
                    if (element) chartRef.removeEntity(lineId);

                    const elementText = chartRef.getShapeById(textId);
                    if (elementText) chartRef.removeEntity(textId);

                    if (quantityTextId) {
                        const quantityElementText =
                            chartRef.getShapeById(quantityTextId);
                        if (quantityElementText)
                            chartRef.removeEntity(quantityTextId);
                    }
                }

                orderLineItemsRef.current = [];
                setOrderLineItems([]);
            }
        } catch (error: unknown) {
            orderLineItemsRef.current = [];
            setOrderLineItems([]);
            console.error({ error });
        }
    };

    const [chartReady, setChartReady] = useState(true);

    useEffect(() => {
        let intervalId: NodeJS.Timeout | undefined = undefined;

        const chartRef = chart?.activeChart();
        setChartReady(false);
        cleanupShapes();
        if (!chartRef) return;

        intervalId = setInterval(async () => {
            const current = chartRef.symbol();
            if (current === symbol) {
                setTimeout(() => {
                    setChartReady(true);
                }, 2500);

                clearInterval(intervalId);
            }
        }, 100);

        return () => {
            clearInterval(intervalId);
            setChartReady(false);
        };
    }, [symbol, debugWallet]);

    useEffect(() => {
        const setupShapes = async () => {
            if (!chart || lines.length === 0) return;
            const shapeRefs: ChartShapeRefs[] = [];

            for (const line of lines) {
                const lineId = await addCustomOrderLine(
                    chart,
                    line.yPrice,
                    line.color,
                );
                const textId = await createAnchoredMainText(
                    chart,
                    line.xLoc,
                    line.yPrice,
                    line.textValue,
                    line.color,
                );
                const quantityTextId = line.quantityTextValue
                    ? await createQuantityAnchoredText(
                          chart,
                          getAnchoredQuantityTextLocation(
                              chart,
                              line.xLoc,
                              line.textValue,
                          ),

                          line.yPrice,
                          quantityTextFormatWithComma(line.quantityTextValue),
                      )
                    : undefined;

                shapeRefs.push({ lineId, textId, quantityTextId });
            }

            orderLineItemsRef.current = shapeRefs;
            setOrderLineItems(shapeRefs);
        };

        if (lines.length !== 0 && chartReady) {
            cleanupShapes();
            setupShapes();
        }
    }, [chart, chartReady, lines.length]);

    useEffect(() => {
        let isCancelled = false;
        const intervals: number[] = [];

        const updateTextPosition = async () => {
            if (!chart || orderLineItems.length === 0 || lines.length === 0)
                return;

            orderLineItems.forEach((item, i) => {
                const lineData = lines[i];
                const { lineId, textId, quantityTextId } = item;

                const interval = setInterval(() => {
                    if (isCancelled) return;

                    const pricePerPixel = priceToPixel(chart, lineData.yPrice);

                    const activeLabel = chart
                        .activeChart()
                        .getShapeById(textId);

                    if (activeLabel) {
                        const activeLabelText = formatLineLabel(
                            lineData.textValue,
                        );
                        activeLabel.setProperties({
                            text: activeLabelText,
                            wordWrapWidth:
                                activeLabelText.length > 13 ? 100 : 70,
                        });

                        activeLabel.setAnchoredPosition({
                            x: lineData.xLoc,
                            y: pricePerPixel,
                        });
                    }

                    if (quantityTextId && lineData.quantityTextValue) {
                        const activeQuantityLabel = chart
                            .activeChart()
                            .getShapeById(quantityTextId);
                        if (activeQuantityLabel) {
                            const quantityText = quantityTextFormatWithComma(
                                lineData.quantityTextValue,
                            );
                            activeQuantityLabel.setAnchoredPosition({
                                x: getAnchoredQuantityTextLocation(
                                    chart,
                                    lineData.xLoc,
                                    lineData.textValue,
                                ),
                                y: pricePerPixel,
                            });
                            activeQuantityLabel.setProperties({
                                text: quantityText,
                                wordWrapWidth:
                                    quantityText.length > 8 ? 70 : 60,
                            });
                        }
                    }

                    const activeLine = chart.activeChart().getShapeById(lineId);
                    if (activeLine) {
                        activeLine.setPoints([
                            { time: 10, price: lineData.yPrice },
                        ]);
                        activeLine.setProperties({
                            linecolor: lineData.color,
                            borderColor: lineData.color,
                        });
                    }
                }, 10) as unknown as number;

                intervals.push(interval);
            });
        };

        updateTextPosition();

        return () => {
            isCancelled = true;
            intervals.forEach(clearInterval);
        };
    }, [orderLineItems, chart, lines]);

    return null;
};

export default LineComponent;
