import React, { useState, useEffect } from 'react';
import useMediaQuery from '~/hooks/useMediaQuery';
import { useChartLinesStore } from '~/stores/ChartLinesStore';
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

    const [previewPrice, setPreviewPrice] = useState<number | null>(null);
    const [originalPrice, setOriginalPrice] = useState<number | null>(null);

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

    const saveChanges = () => {
        if (!selectedOrderLine || previewPrice === null) return;

        setSelectedOrderLine({ ...selectedOrderLine, yPrice: previewPrice });
        setOriginalPrice(previewPrice);
    };

    const cancelChanges = () => {
        if (originalPrice !== null) {
            setPreviewPrice(originalPrice);
        }
        setSelectedOrderLine(undefined);
    };

    const hasChanges = () => {
        if (previewPrice === null || originalPrice === null) return false;
        return Math.abs(previewPrice - originalPrice) > 0.001;
    };

    if (
        !isMobile ||
        !selectedOrderLine ||
        !chart ||
        !canvasHeight ||
        !canvasWidth
    ) {
        return null;
    }

    const dpr = window.devicePixelRatio || 1;
    const cssCanvasHeight = canvasHeight / dpr;
    const cssCanvasWidth = canvasWidth / dpr;

    const position = {
        x: cssCanvasWidth / 2,
        y: cssCanvasHeight,
    };

    const chartDiv =
        typeof document !== 'undefined'
            ? document.getElementById('tv_chart')
            : null;
    const iframe = chartDiv?.querySelector('iframe') as HTMLIFrameElement;
    const iframeRect = iframe?.getBoundingClientRect();

    return (
        <div
            style={{
                position: 'fixed',
                display: 'flex',
                top: iframeRect
                    ? `${iframeRect.top + position.y}px`
                    : `${position.y}px`,
                left: iframeRect
                    ? `${iframeRect.left + position.x}px`
                    : `${position.x}px`,
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
                        backgroundColor: 'transparent',
                        color: '#999',
                        border: '1px solid #444',
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
                        backgroundColor: 'transparent',
                        color: '#999',
                        border: '1px solid #444',
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
                {hasChanges() && (
                    <button
                        onClick={saveChanges}
                        style={{
                            width: '28px',
                            height: '28px',
                            padding: '0',
                            backgroundColor: 'transparent',
                            color: '#999',
                            border: '1px solid #444',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 400,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                        title='Save'
                    >
                        ✓
                    </button>
                )}
                <button
                    onClick={cancelChanges}
                    style={{
                        width: '28px',
                        height: '28px',
                        padding: '0',
                        backgroundColor: 'transparent',
                        color: '#999',
                        border: '1px solid #444',
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
