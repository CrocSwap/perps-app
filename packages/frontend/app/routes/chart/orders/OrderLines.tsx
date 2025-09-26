import React, { useEffect, useRef, useState } from 'react';
import { useOpenOrderLines } from './useOpenOrderLines';
import { usePositionOrderLines } from './usePositionOrderLines';
import LineComponent, { type LineData } from './component/LineComponent';
import LabelComponent from './component/LabelComponent';
import { useTradingView } from '~/contexts/TradingviewContext';
import { type LabelLocationData } from '../overlayCanvas/overlayCanvasUtils';
import { getPricetoPixel } from './customOrderLineUtils';
import { MIN_VISIBLE_ORDER_LABEL_RATIO } from '~/utils/Constants';

export type OrderLinesProps = {
    overlayCanvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
    canvasWrapperRef: React.MutableRefObject<HTMLDivElement | null>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    canvasSize: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    scaleData: any;
    overlayCanvasMousePositionRef: React.MutableRefObject<{
        x: number;
        y: number;
    }>;
    zoomChanged: boolean;
};

export default function OrderLines({
    overlayCanvasRef,
    canvasWrapperRef,
    canvasSize,
    scaleData,
    overlayCanvasMousePositionRef,
    zoomChanged,
}: OrderLinesProps) {
    const { chart } = useTradingView();

    const openLines = useOpenOrderLines();
    const positionLines = usePositionOrderLines();

    const [lines, setLines] = useState<LineData[]>([]);
    const [visibleLines, setVisibleLines] = useState<LineData[]>([]);

    const [localChartReady, setLocalChartReady] = useState(true);
    const drawnLabelsRef = useRef<LineData[]>([]);
    const [selectedLine, setSelectedLine] = useState<
        undefined | LabelLocationData
    >(undefined);

    useEffect(() => {
        let matchFound = false;

        const linesData = [...openLines, ...positionLines];

        const updatedLines = linesData.map((line) => {
            if (
                line.type !== 'PNL' &&
                selectedLine &&
                line.oid === selectedLine.parentLine.oid
            ) {
                matchFound = true;
                return selectedLine.parentLine;
            }
            return line;
        });

        if (selectedLine && !matchFound) {
            setSelectedLine(undefined);
        }

        setLines(updatedLines);
    }, [openLines, positionLines, selectedLine]);

    useEffect(() => {
        if (!scaleData || !chart || !canvasSize) return;

        if (!lines.length) setVisibleLines([]);

        const [minY, maxY] = scaleData.yScale.domain();

        const filtered = lines.filter((line) => {
            const height = canvasSize.height;

            const labelInformation = getPricetoPixel(
                chart,
                line.yPrice,
                line.type,
                height,
                scaleData,
            );
            const yPricePixel = labelInformation.pixel;

            const visibleBuffer =
                labelInformation.textHeight * MIN_VISIBLE_ORDER_LABEL_RATIO;
            const labelMaxPixel = Math.ceil(
                yPricePixel + labelInformation.textHeight,
            );

            const isVisibleEnough =
                Math.min(labelMaxPixel, height) - Math.max(yPricePixel, 0) >=
                visibleBuffer;

            const max = Math.max(minY, maxY);
            const min = Math.min(minY, maxY);
            return (
                (line.yPrice >= min && line.yPrice <= max && isVisibleEnough) ||
                (selectedLine && line.oid === selectedLine?.parentLine.oid)
            );
        });

        setVisibleLines(filtered);
    }, [
        lines,
        canvasSize,
        selectedLine,
        JSON.stringify(scaleData?.yScale.domain()),
    ]);

    return (
        <>
            <LineComponent
                key='lines'
                lines={visibleLines}
                localChartReady={localChartReady}
                setLocalChartReady={setLocalChartReady}
            />
            {localChartReady && (
                <LabelComponent
                    key='labels'
                    lines={visibleLines}
                    overlayCanvasRef={overlayCanvasRef}
                    canvasWrapperRef={canvasWrapperRef}
                    zoomChanged={zoomChanged}
                    canvasSize={canvasSize}
                    drawnLabelsRef={drawnLabelsRef}
                    scaleData={scaleData}
                    selectedLine={selectedLine}
                    setSelectedLine={setSelectedLine}
                    overlayCanvasMousePositionRef={
                        overlayCanvasMousePositionRef
                    }
                />
            )}
        </>
    );
}
