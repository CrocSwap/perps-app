import React, { useState, useEffect, useRef } from 'react';
import useMediaQuery from '~/hooks/useMediaQuery';
import { useChartLinesStore } from '~/stores/ChartLinesStore';
import { useChartScaleStore } from '~/stores/ChartScaleStore';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { getResolutionListForSymbol } from '~/utils/orderbook/OrderBookUtils';

interface ChartElementControlPanelProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    chart?: any;
    canvasHeight?: number;
    canvasWidth?: number;
}

export const ChartElementControlPanel: React.FC<
    ChartElementControlPanelProps
> = ({ chart, canvasHeight, canvasWidth }) => {
    const { selectedOrderLine, setSelectedOrderLine } = useChartLinesStore();
    const scaleDataRef = useChartScaleStore((state) => state.scaleDataRef);
    const priceDomain = useChartScaleStore((state) => state.priceDomain);

    const [previewPrice, setPreviewPrice] = useState<number | null>(null);
    const [originalPrice, setOriginalPrice] = useState<number | null>(null);
    const [top, setTop] = useState<string>('0px');
    const [left, setLeft] = useState<string>('0px');

    useEffect(() => {
        if (selectedOrderLine && originalPrice === null) {
            setOriginalPrice(selectedOrderLine.yPrice);
        }
        if (!selectedOrderLine) {
            setOriginalPrice(null);
        }
    }, [selectedOrderLine, originalPrice]);

    useEffect(() => {
        if (selectedOrderLine) {
            setPreviewPrice(selectedOrderLine.yPrice);
        } else {
            setPreviewPrice(null);
        }
    }, [selectedOrderLine?.yPrice, selectedOrderLine]);

    const isMobile = useMediaQuery('(max-width: 768px)');

    const symbolInfo = useTradeDataStore((state) => state.symbolInfo);

    const calculateStep = () => {
        if (!symbolInfo) return 0.01;

        const resolutionList = getResolutionListForSymbol(symbolInfo);
        if (resolutionList.length === 0) return 0.01;

        return resolutionList[0].val;
    };

    const adjustPrice = (direction: 'up' | 'down', step: number) => {
        if (previewPrice === null || !selectedOrderLine) return;

        const newPrice =
            direction === 'up' ? previewPrice + step : previewPrice - step;

        setSelectedOrderLine({ ...selectedOrderLine, yPrice: newPrice });
    };

    const cancelChanges = () => {
        if (originalPrice !== null) {
            setPreviewPrice(originalPrice);
        }
        setSelectedOrderLine(undefined);
    };

    useEffect(() => {
        if (!selectedOrderLine) {
            return;
        }
        if (!chart || !canvasHeight || !canvasWidth || !scaleDataRef.current)
            return;

        const dpr = window.devicePixelRatio || 1;
        const cssCanvasWidth = canvasWidth / dpr;

        const yPricePixel = scaleDataRef.current.yScale(
            selectedOrderLine.yPrice,
        );

        const chartDiv =
            typeof document !== 'undefined'
                ? document.getElementById('tv_chart')
                : null;
        const iframe = chartDiv?.querySelector('iframe') as HTMLIFrameElement;
        const iframeRect = iframe?.getBoundingClientRect();

        const buttonHeight = 28;
        const padding = 25;

        const position = {
            x: cssCanvasWidth / 2,
            y: yPricePixel + buttonHeight + padding,
        };

        const newTop = iframeRect
            ? `${iframeRect.top + position.y}px`
            : `${position.y}px`;
        const newLeft = iframeRect
            ? `${iframeRect.left + position.x}px`
            : `${position.x}px`;

        setTop(newTop);
        setLeft(newLeft);
    }, [
        chart,
        canvasHeight,
        canvasWidth,
        selectedOrderLine?.yPrice,
        scaleDataRef,
        priceDomain,
    ]);

    if (!isMobile || !selectedOrderLine) {
        return null;
    }

    return (
        <div
            style={{
                position: 'fixed',
                display: 'flex',
                top,
                left,
                zIndex: 10000,
                pointerEvents: 'auto',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    gap: '6px',
                    padding: '4px',
                }}
            >
                <button
                    onClick={() => adjustPrice('up', calculateStep())}
                    style={{
                        width: '28px',
                        height: '28px',
                        padding: '0',
                        backgroundColor: '#1a1a1a',
                        color: '#999',
                        border: '1px solid #3b82f6',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 400,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                    title='Increase'
                >
                    ▲
                </button>
                <button
                    onClick={() => adjustPrice('down', calculateStep())}
                    style={{
                        width: '28px',
                        height: '28px',
                        padding: '0',
                        backgroundColor: '#1a1a1a',
                        color: '#999',
                        border: '1px solid #3b82f6',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 400,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                    title='Decrease'
                >
                    ▼
                </button>
            </div>
            <div
                style={{
                    gap: '6px',
                    padding: '4px',
                    display: 'flex',
                }}
            >
                <button
                    onClick={cancelChanges}
                    style={{
                        width: '28px',
                        height: '28px',
                        padding: '0',
                        backgroundColor: '#1a1a1a',
                        color: '#999',
                        border: '1px solid #3b82f6',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 400,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                    title='Cancel'
                >
                    ✕
                </button>
            </div>
        </div>
    );
};
