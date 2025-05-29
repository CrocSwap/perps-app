import { useEffect, useRef, useState } from 'react';
import { useTradingView } from '~/contexts/TradingviewContext';

import type { EntityId, IChartingLibraryWidget } from '~/tv/charting_library';
import { addCustomOrderLine, type LineLabel } from '../customOrderLineUtils';

export type LineData = {
    xLoc: number;
    yPrice: number;
    textValue: LineLabel;
    quantityTextValue?: number;
    color: string;
    type: 'PNL' | 'LIMIT' | 'LIQ';
};

interface LineProps {
    lines: LineData[];
}

export type ChartShapeRefs = {
    lineId: EntityId;
};

const LineComponent = ({ lines }: LineProps) => {
    const { chart, isChartReady } = useTradingView();

    const orderLineItemsRef = useRef<ChartShapeRefs[]>([]);

    const [orderLineItems, setOrderLineItems] = useState<ChartShapeRefs[]>([]);
    const [localChartReady, setLocalChartReady] = useState(true);

    const cleanupInProgressRef = useRef(false);

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

                    orderLineItemsRef.current = [];
                    setOrderLineItems([]);
                }
            }
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error: unknown) {
            // console.warn('Cleanup failed:', error);
        } finally {
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
            if (!chart) return;

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
                        ),
                    };
                    orderLineItemsRef.current.push(shapeRefs);
                }
            }

            setOrderLineItems([...orderLineItemsRef.current]);
        };

        if (localChartReady && isChartReady) {
            setupShapes();
        }
    }, [chart, isChartReady, localChartReady, lines.length]);

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
    ]);

    return null;
};

export default LineComponent;
