import React, { useEffect, useState } from 'react';
import { useAppSettings } from '~/stores/AppSettingsStore';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { useTradingView } from '~/contexts/TradingviewContext';
import {
    getPricetoPixel,
    updateOverlayCanvasSize,
} from '../orders/customOrderLineUtils';
import { getPaneCanvasAndIFrameDoc } from './overlayCanvasUtils';
import { tempPendingOrders } from '../orders/useOpenOrderLines';
import type { LineData } from '../orders/component/LineComponent';
import PriceActionDropdown from './PriceActionDropdown';
import { useOrderPlacementStore } from '../hooks/useOrderPlacement';

interface LimitOrderPlacementProps {
    overlayCanvasRef: React.RefObject<HTMLCanvasElement | null>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    canvasSize: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    scaleData: any;
    overlayCanvasMousePositionRef: React.MutableRefObject<{
        x: number;
        y: number;
    }>;
    zoomChanged: boolean;
}

const LimitOrderPlacement: React.FC<LimitOrderPlacementProps> = ({
    overlayCanvasRef,
    scaleData,
    canvasSize,
    zoomChanged,
    overlayCanvasMousePositionRef,
}) => {
    const [clickedOrder, setClickedOrder] = useState<{
        price: number | null;
        mousePos: { x: number; y: number };
        side: 'buy' | 'sell';
    } | null>(null);
    const [mousePrice, setMousePrice] = useState<number | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingProgress, setProcessingProgress] = useState(0);
    const [buttonBounds, setButtonBounds] = useState<{
        x: number;
        y: number;
        width: number;
        height: number;
    } | null>(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState<{
        x: number;
        y: number;
        price: number;
    } | null>(null);
    const { getBsColor } = useAppSettings();
    const colors = getBsColor();
    const { symbolInfo } = useTradeDataStore();
    const markPx = symbolInfo?.markPx;
    const { chart, isChartReady } = useTradingView();
    const {
        confirmOrder,
        quickMode,
        activeOrder,
        setPreparedOrder,
        preparedOrder,
        clearPreparedOrder,
        openQuickModeConfirm,
    } = useOrderPlacementStore();

    const progressAnimationRef = React.useRef<number | null>(null);

    // Cleanup animation
    useEffect(() => {
        return () => {
            if (progressAnimationRef.current) {
                cancelAnimationFrame(progressAnimationRef.current);
                progressAnimationRef.current = null;
            }
        };
    }, []);

    // Listen for crosshair movement to track price
    useEffect(() => {
        if (!chart || !scaleData) return;

        chart
            .activeChart()
            .crossHairMoved()
            .subscribe(null, ({ offsetX, offsetY, price }) => {
                if (!chart || !scaleData) return;

                const { paneCanvas } = getPaneCanvasAndIFrameDoc(chart);

                if (!paneCanvas || !offsetX || !offsetY) {
                    setMousePrice(null);
                    return;
                }

                const rect = paneCanvas.getBoundingClientRect();

                if (!rect) return;

                const cssOffsetX = offsetX - rect.left;
                const cssOffsetY = offsetY - rect.top;

                const scaleY = paneCanvas.height / rect.height;
                const scaleX = paneCanvas.width / rect.width;

                const overlayOffsetX = cssOffsetX * scaleX;
                const overlayOffsetY = cssOffsetY * scaleY;

                overlayCanvasMousePositionRef.current = {
                    x: overlayOffsetX,
                    y: overlayOffsetY,
                };

                setMousePrice(parseFloat(price.toFixed(3)));
            });

        const { iframeDoc } = getPaneCanvasAndIFrameDoc(chart);
        if (!iframeDoc) return;

        if (iframeDoc) {
            const handleMouseLeave = () => {
                setMousePrice(null);
            };

            iframeDoc.addEventListener('mouseleave', handleMouseLeave);

            return () => {
                iframeDoc.removeEventListener('mouseleave', handleMouseLeave);
            };
        }
    }, [chart, scaleData, overlayCanvasMousePositionRef, quickMode]);

    // Listen for clicks on TradingView chart
    useEffect(() => {
        if (!chart || !scaleData || !overlayCanvasRef.current) return;

        const { iframeDoc } = getPaneCanvasAndIFrameDoc(chart);
        if (!iframeDoc) return;

        const handleChartClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;

            if (target.tagName !== 'CANVAS') return;

            const canvas = overlayCanvasRef.current;
            if (!canvas) return;

            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;

            if (buttonBounds) {
                if (
                    clickX >= buttonBounds.x &&
                    clickX <= buttonBounds.x + buttonBounds.width &&
                    clickY >= buttonBounds.y &&
                    clickY <= buttonBounds.y + buttonBounds.height
                ) {
                    if (mousePrice) {
                        const canvas = overlayCanvasRef.current;
                        if (!canvas) return;

                        const rect = canvas.getBoundingClientRect();
                        const dropdownWidth = 280;
                        const dpr = window.devicePixelRatio || 1;

                        const posX =
                            buttonBounds.x +
                            rect.left -
                            dropdownWidth +
                            buttonBounds.width / dpr;
                        const posY =
                            rect.top +
                            buttonBounds.y +
                            buttonBounds.height / dpr;

                        setDropdownPosition({
                            x: posX,
                            y: posY,
                            price: mousePrice,
                        });
                        setShowDropdown(true);
                    }
                    return;
                }
            }

            if (!quickMode) return;

            const y = e.clientY - canvas.getBoundingClientRect().top;

            const price = scaleData.yScale.invert(y);

            const side: 'buy' | 'sell' =
                markPx && mousePrice && mousePrice > markPx ? 'sell' : 'buy';

            // Set prepared order immediately on click
            if (mousePrice && activeOrder) {
                setPreparedOrder({
                    price: mousePrice,
                    side: side,
                    type: activeOrder.tradeType,
                    size: activeOrder.size,
                    currency: activeOrder.currency,
                    timestamp: Date.now(),
                });
            }

            setClickedOrder({
                price: mousePrice,
                mousePos: {
                    x: e.offsetX * dpr,
                    y: e.offsetY * dpr,
                },
                side: side,
            });
            setIsProcessing(true);
            setProcessingProgress(0);

            console.log('Limit order placement at price:', price);

            if (progressAnimationRef.current) {
                cancelAnimationFrame(progressAnimationRef.current);
                progressAnimationRef.current = null;
            }

            const startTime = Date.now();
            const duration = 3000;

            const animateProgress = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);

                setProcessingProgress(progress);

                if (progress < 1) {
                    progressAnimationRef.current =
                        requestAnimationFrame(animateProgress);
                } else {
                    progressAnimationRef.current = null;
                    setTimeout(() => {
                        setClickedOrder(null);
                        setIsProcessing(false);
                        setProcessingProgress(0);

                        if (mousePrice && activeOrder) {
                            const quantity = activeOrder.size || 0;

                            const newPendingOrder: LineData = {
                                xLoc: 0.4,
                                yPrice: mousePrice,
                                textValue: {
                                    type: 'Limit',
                                    price: mousePrice,
                                    triggerCondition: '',
                                },
                                quantityTextValue: quantity,
                                quantityText: quantity.toString(),
                                color: colors[side],
                                type: 'LIMIT',
                                lineStyle: 3,
                                lineWidth: 1,
                                side: side,
                            };

                            tempPendingOrders.push(newPendingOrder);
                        }
                    }, 100);
                }
            };

            progressAnimationRef.current =
                requestAnimationFrame(animateProgress);
        };

        const handleMouseLeave = () => {
            setMousePrice(null);
        };

        iframeDoc.addEventListener('click', handleChartClick);
        iframeDoc.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            iframeDoc.removeEventListener('click', handleChartClick);
            iframeDoc.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, [
        chart,
        JSON.stringify(scaleData?.yScale.domain()),
        overlayCanvasRef,
        mousePrice,
        buttonBounds,
        markPx,
        colors,
        quickMode,
    ]);

    useEffect(() => {
        if (!chart || !mousePrice) return;

        const { iframeDoc } = getPaneCanvasAndIFrameDoc(chart);
        if (!iframeDoc) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // Alt/Option + Shift + B for Buy (Windows: Alt, Mac: Option)
            if (e.altKey && e.shiftKey && e.code === 'KeyB') {
                e.preventDefault();
                handleBuyLimit(mousePrice);
            }
            // Alt/Option + Shift + S for Sell (Windows: Alt, Mac: Option)
            else if (e.altKey && e.shiftKey && e.code === 'KeyS') {
                e.preventDefault();
                handleSellStop(mousePrice);
            }
        };

        iframeDoc.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            iframeDoc.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [chart, mousePrice]);

    useEffect(() => {
        if (!chart || !isChartReady || !canvasSize) return;

        let animationFrameId: number | null = null;

        const drawAddButton = (
            ctx: CanvasRenderingContext2D,
            canvas: HTMLCanvasElement,
            mouseY: number,
            dpr: number,
        ) => {
            const buttonSize = 21 * dpr;
            const padding = dpr;

            const buttonX = canvas.width - buttonSize - padding;
            const buttonY = mouseY - buttonSize / 2;

            setButtonBounds({
                x: buttonX / dpr,
                y: buttonY / dpr,
                width: buttonSize,
                height: buttonSize,
            });

            ctx.fillStyle = 'rgba(70, 70, 70, 0.9)';
            ctx.beginPath();
            ctx.fillRect(buttonX, buttonY, buttonSize, buttonSize);
            ctx.fill();

            const centerX = buttonX + buttonSize / 2;
            const centerY = buttonY + buttonSize / 2;
            const circleRadius = 7 * dpr;
            const plusSize = 6 * dpr;

            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1 * dpr;
            ctx.beginPath();
            ctx.arc(centerX, centerY, circleRadius, 0, Math.PI * 2);
            ctx.stroke();

            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1 * dpr;
            ctx.lineCap = 'round';

            // Vertical line of +
            ctx.beginPath();
            ctx.moveTo(centerX, centerY - plusSize / 2);
            ctx.lineTo(centerX, centerY + plusSize / 2);
            ctx.stroke();

            // Horizontal line of +
            ctx.beginPath();
            ctx.moveTo(centerX - plusSize / 2, centerY);
            ctx.lineTo(centerX + plusSize / 2, centerY);
            ctx.stroke();
        };

        const draw = () => {
            let heightAttr = canvasSize?.height;
            if (overlayCanvasRef.current) {
                if (overlayCanvasRef.current) {
                    updateOverlayCanvasSize(
                        overlayCanvasRef.current,
                        canvasSize,
                    );
                }
                const canvas = overlayCanvasRef.current;

                const { iframeDoc, paneCanvas } =
                    getPaneCanvasAndIFrameDoc(chart);

                if (!iframeDoc || !paneCanvas || !paneCanvas.parentNode) return;

                const width = overlayCanvasRef.current.style.width;
                const height = overlayCanvasRef.current.style?.height;

                heightAttr = paneCanvas?.height;
                if (
                    width !== canvasSize?.styleWidth ||
                    height !== canvasSize?.styleWidth
                ) {
                    overlayCanvasRef.current.style.width = `${canvasSize?.styleWidth}px`;
                    overlayCanvasRef.current.style.height = `${canvasSize?.styleHeight}px`;
                    overlayCanvasRef.current.width = paneCanvas.width;
                    overlayCanvasRef.current.height = paneCanvas.height;
                }

                const ctx = canvas.getContext('2d');
                if (!ctx) return;

                const dpr = window.devicePixelRatio || 1;

                ctx.clearRect(0, 0, canvas.width, canvas.height);
                if (!mousePrice && !clickedOrder && !showDropdown) return;

                const drawLineAtPrice = (price: number, isClicked: boolean) => {
                    const { chartHeight } = getPricetoPixel(
                        chart,
                        price,
                        'LIMIT',
                        heightAttr,
                        scaleData,
                    );

                    if (!chartHeight || chartHeight === 0) return;

                    if (isClicked && clickedOrder) {
                        const labelWidth = 100 * dpr;
                        const labelHeight = 24 * dpr;

                        const lineColor =
                            clickedOrder.side === 'buy'
                                ? colors.buy
                                : colors.sell;
                        let labelX: number;

                        const clickX = clickedOrder.mousePos.x;
                        const clickY = clickedOrder.mousePos.y;

                        if (isProcessing) {
                            const blinkProgress =
                                Math.sin(processingProgress * Math.PI * 8) *
                                    0.5 +
                                0.5;
                            const alpha = 0.4 + blinkProgress * 0.6;

                            // Draw main line
                            ctx.strokeStyle = lineColor;
                            ctx.lineWidth = 4;
                            ctx.setLineDash([8, 6]);
                            ctx.globalAlpha = alpha;
                            ctx.beginPath();
                            ctx.moveTo(0, clickY);
                            ctx.lineTo(canvas.width, clickY);
                            ctx.stroke();
                            ctx.setLineDash([]);
                            ctx.globalAlpha = 1.0;

                            // Add a subtle glow effect
                            ctx.strokeStyle = lineColor;
                            ctx.lineWidth = 6;
                            ctx.globalAlpha = alpha * 0.3;
                            ctx.beginPath();
                            ctx.moveTo(0, clickY);
                            ctx.lineTo(canvas.width, clickY);
                            ctx.stroke();
                            ctx.globalAlpha = 1.0;
                        } else {
                            // Draw full line normally
                            ctx.strokeStyle = lineColor;
                            ctx.lineWidth = 4;
                            ctx.setLineDash([8, 6]);
                            ctx.beginPath();
                            ctx.moveTo(0, clickY);
                            ctx.lineTo(canvas.width, clickY);
                            ctx.stroke();
                            ctx.setLineDash([]);
                        }

                        labelX = clickX + 15;
                        const labelY = clickY - labelHeight / 2;

                        if (labelX + labelWidth > canvas.width) {
                            labelX = clickX - labelWidth - 15;
                        }

                        ctx.fillStyle = lineColor;
                        ctx.fillRect(labelX, labelY, labelWidth, labelHeight);

                        // Draw price text
                        ctx.fillStyle = '#ffffff';
                        ctx.font = `${12 * dpr}px monospace`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(
                            price.toFixed(5),
                            labelX + labelWidth / 2,
                            labelY + labelHeight / 2,
                        );
                    } else {
                        const mouseY = overlayCanvasMousePositionRef.current.y;
                        drawAddButton(ctx, canvas, mouseY, dpr);
                    }
                };

                if (clickedOrder?.price) {
                    drawLineAtPrice(clickedOrder.price, true);
                }

                if (
                    quickMode &&
                    mousePrice &&
                    mousePrice !== clickedOrder?.price
                ) {
                    drawLineAtPrice(mousePrice, false);
                } else if (
                    !clickedOrder &&
                    (mousePrice || (showDropdown && dropdownPosition))
                ) {
                    const mouseY = overlayCanvasMousePositionRef.current.y;
                    drawAddButton(ctx, canvas, mouseY, dpr);
                }
            }
        };

        const animate = () => {
            draw();
            animationFrameId = requestAnimationFrame(animate);
        };
        animationFrameId = requestAnimationFrame(animate);

        return () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, [
        chart,
        zoomChanged,
        clickedOrder?.price,
        clickedOrder?.mousePos,
        mousePrice,
        colors,
        markPx,
        scaleData,
        canvasSize,
        isChartReady,
        overlayCanvasMousePositionRef,
        isProcessing,
        processingProgress,
        showDropdown,
        dropdownPosition,
    ]);

    // Listen for preparedOrder changes and trigger animation
    useEffect(() => {
        if (!preparedOrder) return;

        console.log('preparedOrder:', preparedOrder);

        const { price, side } = preparedOrder;

        setClickedOrder({
            price,
            mousePos: {
                x: overlayCanvasMousePositionRef.current.x,
                y: overlayCanvasMousePositionRef.current.y,
            },
            side,
        });
        setIsProcessing(true);
        setProcessingProgress(0);

        if (progressAnimationRef.current) {
            cancelAnimationFrame(progressAnimationRef.current);
            progressAnimationRef.current = null;
        }

        const startTime = Date.now();
        const duration = 3000;

        const animateProgress = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            setProcessingProgress(progress);

            if (progress < 1) {
                progressAnimationRef.current =
                    requestAnimationFrame(animateProgress);
            } else {
                progressAnimationRef.current = null;
                setTimeout(() => {
                    setClickedOrder(null);
                    setIsProcessing(false);
                    setProcessingProgress(0);

                    // Add to tempPendingOrders
                    const newPendingOrder: LineData = {
                        xLoc: 0.4,
                        yPrice: price,
                        textValue: {
                            type: 'Limit',
                            price: price,
                            triggerCondition: '',
                        },
                        quantityTextValue: preparedOrder.size,
                        quantityText: preparedOrder.size.toString(),
                        color: colors[side],
                        type: 'LIMIT',
                        lineStyle: 3,
                        lineWidth: 1,
                        side: side,
                    };

                    tempPendingOrders.push(newPendingOrder);
                    clearPreparedOrder();
                }, 100);
            }
        };

        progressAnimationRef.current = requestAnimationFrame(animateProgress);
    }, [
        preparedOrder,
        colors,
        overlayCanvasMousePositionRef,
        clearPreparedOrder,
    ]);

    const handleBuyLimit = (price: number) => {
        const side = 'buy';

        // Set prepared order immediately
        if (activeOrder) {
            setPreparedOrder({
                price: price,
                side: side,
                type: activeOrder.tradeType,
                size: activeOrder.size,
                currency: activeOrder.currency,
                timestamp: Date.now(),
            });
        }

        setClickedOrder({
            price: price,
            mousePos: {
                x: overlayCanvasMousePositionRef.current.x,
                y: overlayCanvasMousePositionRef.current.y,
            },
            side: side,
        });
        setIsProcessing(true);
        setProcessingProgress(0);

        if (progressAnimationRef.current) {
            cancelAnimationFrame(progressAnimationRef.current);
            progressAnimationRef.current = null;
        }

        const startTime = Date.now();
        const duration = 3000;

        const animateProgress = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            setProcessingProgress(progress);

            if (progress < 1) {
                progressAnimationRef.current =
                    requestAnimationFrame(animateProgress);
            } else {
                progressAnimationRef.current = null;
                setTimeout(() => {
                    setClickedOrder(null);
                    setIsProcessing(false);
                    setProcessingProgress(0);

                    if (activeOrder) {
                        const quantity = activeOrder.size || 0;

                        // Set prepared order with all info
                        setPreparedOrder({
                            price: price,
                            side: side,
                            type: activeOrder.tradeType,
                            size: activeOrder.size,
                            currency: activeOrder.currency,
                            timestamp: Date.now(),
                        });

                        const newPendingOrder: LineData = {
                            xLoc: 0.4,
                            yPrice: price,
                            textValue: {
                                type: 'Limit',
                                price: price,
                                triggerCondition: '',
                            },
                            quantityTextValue: quantity,
                            quantityText: quantity.toString(),
                            color: colors[side],
                            type: 'LIMIT',
                            lineStyle: 3,
                            lineWidth: 1,
                            side: side,
                        };

                        tempPendingOrders.push(newPendingOrder);
                    }
                }, 100);
            }
        };

        progressAnimationRef.current = requestAnimationFrame(animateProgress);
    };

    const handleSellStop = (price: number) => {
        const side = 'sell';

        setClickedOrder({
            price: price,
            mousePos: {
                x: overlayCanvasMousePositionRef.current.x,
                y: overlayCanvasMousePositionRef.current.y,
            },
            side: side,
        });
        setIsProcessing(true);
        setProcessingProgress(0);

        // Cancel any existing animation
        if (progressAnimationRef.current) {
            cancelAnimationFrame(progressAnimationRef.current);
            progressAnimationRef.current = null;
        }

        const startTime = Date.now();
        const duration = 3000;

        const animateProgress = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            setProcessingProgress(progress);

            if (progress < 1) {
                progressAnimationRef.current =
                    requestAnimationFrame(animateProgress);
            } else {
                progressAnimationRef.current = null;
                setTimeout(() => {
                    setClickedOrder(null);
                    setIsProcessing(false);
                    setProcessingProgress(0);

                    // Create sell stop order line
                    if (activeOrder) {
                        const quantity = activeOrder.size || 0;

                        // Set prepared order with all info
                        setPreparedOrder({
                            price: price,
                            side: side,
                            type: activeOrder.tradeType,
                            size: activeOrder.size,
                            currency: activeOrder.currency,
                            timestamp: Date.now(),
                        });

                        const newPendingOrder: LineData = {
                            xLoc: 0.4,
                            yPrice: price,
                            textValue: {
                                type: 'Limit',
                                price: price,
                                triggerCondition: '',
                            },
                            quantityTextValue: quantity,
                            quantityText: quantity.toString(),
                            color: colors[side],
                            type: 'LIMIT',
                            lineStyle: 3,
                            lineWidth: 1,
                            side: side,
                        };

                        tempPendingOrders.push(newPendingOrder);
                    }
                }, 100);
            }
        };

        progressAnimationRef.current = requestAnimationFrame(animateProgress);
    };

    return (
        <>
            {showDropdown && dropdownPosition && (
                <PriceActionDropdown
                    position={dropdownPosition}
                    symbolCoin={symbolInfo?.coin}
                    markPx={markPx}
                    onClose={() => setShowDropdown(false)}
                    onBuyLimit={(price) => {
                        setShowDropdown(false);
                        if (!activeOrder) {
                            openQuickModeConfirm();
                        } else {
                            confirmOrder({
                                price,
                                side: 'buy',
                                type: activeOrder.tradeType,
                                size: activeOrder.size,
                                currency: activeOrder.currency,
                                timestamp: Date.now(),
                            });
                        }
                    }}
                    onSellStop={(price) => {
                        setShowDropdown(false);
                        if (!activeOrder) {
                            openQuickModeConfirm();
                        } else {
                            confirmOrder({
                                price,
                                side: 'sell',
                                type: activeOrder.tradeType,
                                size: activeOrder.size,
                                currency: activeOrder.currency,
                                timestamp: Date.now(),
                            });
                        }
                    }}
                />
            )}
        </>
    );
};

export default LimitOrderPlacement;
