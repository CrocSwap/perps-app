import React, { useState, useEffect } from 'react';
import useMediaQuery from '~/hooks/useMediaQuery';
import { useChartLinesStore } from '~/stores/ChartLinesStore';
import { useChartScaleStore } from '~/stores/ChartScaleStore';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { getResolutionListForSymbol } from '~/utils/orderbook/OrderBookUtils';
import { getPaneCanvasAndIFrameDoc } from '../../overlayCanvas/overlayCanvasUtils';
import { useTradingView } from '~/contexts/TradingviewContext';
import type { TabType } from '~/routes/trade';
import { usePreviewOrderLines } from '../usePreviewOrderLines';

interface ChartElementControlPanelProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    chart?: any;
    canvasHeight?: number;
    canvasWidth?: number;
}

export const ChartElementControlPanel: React.FC<
    ChartElementControlPanelProps
> = ({ chart, canvasHeight, canvasWidth }) => {
    const { selectedOrderLine, setSelectedOrderLine, setShouldConfirmOrder } =
        useChartLinesStore();
    const scaleDataRef = useChartScaleStore((state) => state.scaleDataRef);
    const priceDomain = useChartScaleStore((state) => state.priceDomain);
    const { setObChosenPrice } = useTradeDataStore();
    const { switchTab } = useTradingView();

    const [previewPrice, setPreviewPrice] = useState<number | null>(null);
    const [originalPrice, setOriginalPrice] = useState<number | null>(null);
    const [top, setTop] = useState<string>('0px');
    const [left, setLeft] = useState<string>('0px');
    const { updateYPosition } = usePreviewOrderLines();

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

    const hasChanges =
        selectedOrderLine &&
        selectedOrderLine.originalPrice &&
        Math.abs(selectedOrderLine.yPrice - selectedOrderLine.originalPrice) >
            0.001;

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

        // Track mobile order adjustment usage
        if (typeof plausible === 'function') {
            plausible('Mobile Order Adjustment', {
                props: {
                    method: 'Button',
                    action: direction === 'up' ? 'Increase' : 'Decrease',
                    orderType: selectedOrderLine.type,
                },
            });
        }

        setSelectedOrderLine({
            ...selectedOrderLine,
            yPrice: newPrice,
            textValue:
                selectedOrderLine.textValue &&
                selectedOrderLine.textValue.type === 'Limit'
                    ? {
                          ...selectedOrderLine.textValue,
                          price: newPrice,
                      }
                    : selectedOrderLine.textValue,
        });
    };

    const cancelChanges = () => {
        if (originalPrice !== null) {
            setPreviewPrice(originalPrice);
            if (
                selectedOrderLine &&
                selectedOrderLine.type === 'PREVIEW_ORDER'
            ) {
                updateYPosition(originalPrice);
            }
        }
        setSelectedOrderLine(undefined);
    };

    const confirmChanges = () => {
        if (!selectedOrderLine) return;

        if (selectedOrderLine.type === 'PREVIEW_ORDER') {
            const newPrice = selectedOrderLine.yPrice;

            setObChosenPrice(newPrice);

            // Navigate to trade page (order tab) and focus on size input
            if (switchTab) {
                switchTab('order' as TabType);

                requestAnimationFrame(() => {
                    // Wait for navigation and then focus
                    setTimeout(() => {
                        const sizeInput = document.getElementById(
                            'trade-module-size-input',
                        ) as HTMLInputElement;
                        if (sizeInput) {
                            sizeInput.focus();
                        }
                    }, 100);
                });
            }
            return;
        }

        // For open  orders, trigger confirm in LabelComponent
        setShouldConfirmOrder(true);
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

        const { paneCanvas } = getPaneCanvasAndIFrameDoc(chart);
        const canvasRect = paneCanvas?.getBoundingClientRect();

        const buttonHeight = 28;
        const padding = 25;

        const position = {
            x: cssCanvasWidth / 2,
            y: yPricePixel + buttonHeight + padding,
        };

        const absoluteTop = iframeRect
            ? iframeRect.top + position.y
            : position.y;
        const absoluteLeft = iframeRect
            ? iframeRect.left + position.x
            : position.x;

        if (canvasRect) {
            // Check if panel is outside canvas bounds (iframe-relative coordinates)
            const isOutOfBounds =
                absoluteTop < iframeRect.top + canvasRect.top ||
                absoluteTop >
                    canvasRect.height + iframeRect.top + canvasRect.top;

            if (isOutOfBounds) {
                setTop('0px');
                setLeft('0px');
                return;
            }
        }

        setTop(`${absoluteTop}px`);
        setLeft(`${absoluteLeft}px`);
    }, [
        chart,
        canvasHeight,
        canvasWidth,
        selectedOrderLine?.yPrice,
        scaleDataRef,
        priceDomain,
    ]);

    if (!isMobile || !selectedOrderLine || (top === '0px' && left === '0px')) {
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
                {hasChanges && (
                    <button
                        onClick={confirmChanges}
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
                        title='Confirm'
                    >
                        ✓
                    </button>
                )}
            </div>
        </div>
    );
};
