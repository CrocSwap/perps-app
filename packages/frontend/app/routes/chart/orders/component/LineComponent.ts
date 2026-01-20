import { useEffect, useRef, useState } from 'react';
import { useTradingView } from '~/contexts/TradingviewContext';
import { useChartLinesStore } from '~/stores/ChartLinesStore';

import type { EntityId, IChartingLibraryWidget } from '~/tv/charting_library';
import { addCustomOrderLine, type LineLabel } from '../customOrderLineUtils';
import type { LabelLocation } from '../orderLineUtils';
import type { ChartLineType } from '../../data/utils/utils';

export type LineData = {
    xLoc: number;
    yPrice: number;
    textValue?: LineLabel;
    priceColor?: string;
    quantityTextValue?: number;
    quantityText?: string;
    color: string;
    type: ChartLineType;
    labelLocations?: LabelLocation[];
    oid?: number | string;
    lineStyle: number;
    lineWidth: number;
    side?: 'buy' | 'sell';
};

interface LineProps {
    lines: LineData[];
    localChartReady: boolean;
    setLocalChartReady: React.Dispatch<React.SetStateAction<boolean>>;
}

export type ChartShapeRefs = {
    lineId: EntityId;
};

const LineComponent = ({
    lines,
    localChartReady,
    setLocalChartReady,
}: LineProps) => {
    const { chart, isChartReady } = useTradingView();
    const { selectedOrderLine } = useChartLinesStore();

    const orderLineItemsRef = useRef<ChartShapeRefs[]>([]);

    const [orderLineItems, setOrderLineItems] = useState<ChartShapeRefs[]>([]);

    const cleanupInProgressRef = useRef(false);
    const isProcessingRef = useRef(false);

    const removeShapeById = async (
        chart: IChartingLibraryWidget,
        id: EntityId,
    ) => {
        const chartRef = chart.activeChart();

        const element = chartRef.getShapeById(id);
        if (element) chartRef.removeEntity(id);
    };
    const cleanupShapes = async () => {
        if (cleanupInProgressRef.current) {
            return;
        }

        cleanupInProgressRef.current = true;

        try {
            if (chart) {
                const chartRef = chart.activeChart();

                if (chartRef) {
                    const prevItems = orderLineItemsRef.current;

                    for (const order of prevItems) {
                        const { lineId } = order;

                        const element = chartRef.getShapeById(lineId);
                        if (element) chartRef.removeEntity(lineId);
                    }
                }
            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error: unknown) {
            // console.warn('Cleanup failed:', error);
        } finally {
            orderLineItemsRef.current = [];
            setOrderLineItems([]);
            cleanupInProgressRef.current = false;
        }
    };

    useEffect(() => {
        let timeoutId: NodeJS.Timeout | undefined = undefined;
        const init = async () => {
            setLocalChartReady(false);
            await cleanupShapes();

            if (isChartReady) {
                timeoutId = setTimeout(() => {
                    setLocalChartReady(true);
                }, 500);
            }
        };

        init();

        return () => {
            clearTimeout(timeoutId);
        };
    }, [isChartReady]);

    useEffect(() => {
        const setupShapes = async () => {
            if (!chart || isProcessingRef.current) return;

            isProcessingRef.current = true;

            try {
                const currentCount = orderLineItemsRef.current.length;
                const newCount = lines.length;

                if (currentCount > newCount) {
                    const toRemove = orderLineItemsRef.current.slice(newCount);
                    for (const shape of toRemove) {
                        removeShapeById(chart, shape.lineId);
                    }
                    orderLineItemsRef.current.length = newCount;
                }

                if (currentCount < newCount) {
                    for (let i = currentCount; i < newCount; i++) {
                        const line = lines[i];
                        const shapeRefs: ChartShapeRefs = {
                            lineId: await addCustomOrderLine(
                                chart,
                                line.yPrice,
                                line.color,
                                line.lineStyle,
                                line.lineWidth,
                            ),
                        };

                        orderLineItemsRef.current.push(shapeRefs);
                    }
                }

                setOrderLineItems([...orderLineItemsRef.current]);
            } finally {
                isProcessingRef.current = false;
            }
        };

        if (localChartReady && isChartReady) {
            setupShapes();
        }
    }, [
        chart,
        isChartReady,
        localChartReady,
        lines.length,
        isProcessingRef.current,
    ]);

    useEffect(() => {
        const updateSingleLine = (item: ChartShapeRefs, lineData: LineData) => {
            if (!chart) return;

            const activeChart = chart.activeChart();

            const { lineId } = item;
            const activeLine = activeChart.getShapeById(lineId);
            if (activeLine) {
                activeLine.setPoints([{ time: 10, price: lineData.yPrice }]);
                activeLine.setProperties({
                    linecolor: lineData.color,
                    borderColor: lineData.color,
                    linestyle: lineData.lineStyle,
                    linewidth: lineData.lineWidth,
                });
            }
        };

        const updateTextPositionOnce = () => {
            orderLineItems.forEach((item, i) => {
                updateSingleLine(item, lines[i]);
            });
        };

        if (
            !chart ||
            orderLineItems.length === 0 ||
            lines.length === 0 ||
            orderLineItems.length !== lines.length ||
            !(localChartReady && isChartReady)
        )
            return;

        updateTextPositionOnce();
    }, [
        JSON.stringify(orderLineItems),
        chart,
        JSON.stringify(lines),
        localChartReady,
        isChartReady,
        selectedOrderLine,
    ]);

    return null;
};

export default LineComponent;
