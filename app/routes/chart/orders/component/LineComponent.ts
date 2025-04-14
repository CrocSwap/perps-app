import { useEffect, useRef, useState } from 'react';
import { useTradingView } from '~/contexts/TradingviewContext';

import type { EntityId, IPaneApi } from '~/tv/charting_library';
import {
    addCustomOrderLine,
    createAnchoredMainText,
    createQuantityAnchoredText,
    getAnchoredQuantityTextLocation,
    priceToPixel,
} from '../customOrderLineUtils';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { useDebugStore } from '~/stores/DebugStore';

export type LineData = {
    xLoc: number;
    yLoc: number;
    text: string;
    quantityText?: string;
    color: string;
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
        let intervalId: NodeJS.Timeout;

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
                    line.yLoc,
                    line.color,
                );
                const textId = await createAnchoredMainText(
                    chart,
                    line.xLoc,
                    line.yLoc,
                    line.text,
                    line.color,
                );
                const quantityTextId = line.quantityText
                    ? await createQuantityAnchoredText(
                          chart,
                          line.xLoc,
                          line.yLoc,
                          line.text,
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

                    const priceScalePane = chart
                        .activeChart()
                        .getPanes()[0] as IPaneApi;

                    const priceScale = priceScalePane.getMainSourcePriceScale();
                    if (priceScale) {
                        const priceRange = priceScale.getVisiblePriceRange();
                        const chartHeight = priceScalePane.getHeight();

                        if (!priceRange) return;

                        const maxPrice = priceRange.to;
                        const minPrice = priceRange.from;

                        const pixel = priceToPixel(
                            minPrice,
                            maxPrice,
                            chartHeight,
                            lineData.yLoc,
                            priceScale.getMode() === 1,
                        );
                        const pricePerPixel = pixel / chartHeight;

                        const activeLabel = chart
                            .activeChart()
                            .getShapeById(textId);

                        if (activeLabel) {
                            activeLabel.setProperties({
                                text: lineData.text,
                                wordWrapWidth:
                                    lineData.text.length > 13 ? 100 : 70,
                            });

                            activeLabel.setAnchoredPosition({
                                x: lineData.xLoc,
                                y: pricePerPixel,
                            });
                        }

                        if (quantityTextId && lineData.quantityText) {
                            const activeQuantityLabel = chart
                                .activeChart()
                                .getShapeById(quantityTextId);
                            if (activeQuantityLabel) {
                                activeQuantityLabel.setAnchoredPosition({
                                    x: getAnchoredQuantityTextLocation(
                                        chart,
                                        lineData.xLoc,
                                        lineData.text,
                                    ),
                                    y: pricePerPixel,
                                });
                                activeQuantityLabel.setProperties({
                                    text: lineData.quantityText,
                                    wordWrapWidth:
                                        lineData.quantityText.length > 8
                                            ? 70
                                            : 60,
                                });
                            }
                        }

                        const activeLine = chart
                            .activeChart()
                            .getShapeById(lineId);
                        if (activeLine) {
                            activeLine.setPoints([
                                { time: 10, price: lineData.yLoc },
                            ]);
                            activeLine.setProperties({
                                linecolor: lineData.color,
                                borderColor: lineData.color,
                            });
                        }
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
