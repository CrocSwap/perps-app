import React, { useCallback, useEffect, useState } from 'react';
import { isEstablished, useSession } from '@fogo/sessions-sdk-react';
import { useAppSettings } from '~/stores/AppSettingsStore';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { useTradingView } from '~/contexts/TradingviewContext';
import {
    getPricetoPixel,
    updateOverlayCanvasSize,
} from '../orders/customOrderLineUtils';
import { getPaneCanvasAndIFrameDoc } from './overlayCanvasUtils';
import PriceActionDropdown from './PriceActionDropdown';
import { useOrderPlacementStore } from '../hooks/useOrderPlacement';
import { useChartScaleStore } from '~/stores/ChartScaleStore';
import { useChartLinesStore } from '~/stores/ChartLinesStore';
import { useLimitOrderService } from '~/hooks/useLimitOrderService';
import { makeSlug, useNotificationStore } from '~/stores/NotificationStore';
import useNumFormatter from '~/hooks/useNumFormatter';
import { t } from 'i18next';
import { getTxLink } from '~/utils/Constants';
import type { LimitOrderParams } from '~/services/limitOrderService';
import { getDurationSegment } from '~/utils/functions/getSegment';
import {
    getKeyboardShortcutCategories,
    getKeyboardShortcutById,
    matchesShortcutEvent,
} from '~/utils/keyboardShortcuts';

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
}

const LimitOrderPlacement: React.FC<LimitOrderPlacementProps> = ({
    overlayCanvasRef,
    scaleData,
    canvasSize,
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
    const { zoomChanged } = useChartScaleStore();
    const {
        showPlusButton,
        setShowPlusButton,
        isCancelClicking,
        setIsCancelClicking,
    } = useChartLinesStore();
    const { executeLimitOrder } = useLimitOrderService();
    const notifications = useNotificationStore();
    const { formatNum } = useNumFormatter();

    const session = useSession();
    const isSessionEstablished = isEstablished(session);

    const clickSessionButton = useCallback(() => {
        const sessionWrap = document.querySelector('[class*="sessionWrap"]');
        const sessionBtn = sessionWrap?.querySelector(
            'button, [role="button"]',
        ) as HTMLElement | null;
        sessionBtn?.click();
    }, []);

    const progressAnimationRef = React.useRef<number | null>(null);
    const isExecutingRef = React.useRef(false);
    const lastCursorToolRef = React.useRef<'cursor' | 'dot' | 'arrow_cursor'>(
        'cursor',
    );
    const mouseDownTimeRef = React.useRef<number | null>(null);
    const mouseDownDomainRef = React.useRef<{
        min: number;
        max: number;
    } | null>(null);
    const hadSelectionOnMouseDownRef = React.useRef(false);

    function roundDownToTenth(value: number) {
        return Math.floor(value * 10) / 10;
    }

    // Cleanup animation
    useEffect(() => {
        return () => {
            if (progressAnimationRef.current) {
                cancelAnimationFrame(progressAnimationRef.current);
                progressAnimationRef.current = null;
            }
        };
    }, []);

    // Initialize last cursor tool from current selection
    useEffect(() => {
        if (!chart || !isChartReady) return;

        const selectedTool = chart.selectedLineTool();
        const cursorTools = ['cursor', 'dot', 'arrow_cursor'];

        if (cursorTools.includes(selectedTool)) {
            lastCursorToolRef.current = selectedTool as
                | 'cursor'
                | 'dot'
                | 'arrow_cursor';
        }
    }, [chart, isChartReady]);

    // Disable quick mode when a non-cursor drawing tool is selected
    useEffect(() => {
        if (!chart || !isChartReady) return;

        const handleLineToolChanged = () => {
            const selectedTool = chart.selectedLineTool();
            const cursorTools = ['cursor', 'dot', 'arrow_cursor'];

            if (cursorTools.includes(selectedTool)) {
                lastCursorToolRef.current = selectedTool as
                    | 'cursor'
                    | 'dot'
                    | 'arrow_cursor';
            } else {
                useOrderPlacementStore.setState({ quickMode: false });
            }
        };

        chart.subscribe('onSelectedLineToolChanged', handleLineToolChanged);

        return () => {
            try {
                chart.unsubscribe(
                    'onSelectedLineToolChanged',
                    handleLineToolChanged,
                );
            } catch {
                // Chart may have been destroyed during navigation
            }
        };
    }, [chart, isChartReady]);

    // Switch to last cursor tool when quick mode is enabled
    useEffect(() => {
        if (!chart || !isChartReady || !quickMode) return;

        try {
            const selectedTool = chart.selectedLineTool();
            const cursorTools = ['cursor', 'dot', 'arrow_cursor'];

            if (!cursorTools.includes(selectedTool)) {
                chart.selectLineTool(lastCursorToolRef.current);
            }
        } catch (error) {
            console.error(error);
        }
    }, [chart, isChartReady, quickMode]);

    // Listen for crosshair movement to track price
    useEffect(() => {
        if (!chart || !scaleData) return;

        chart
            .activeChart()
            .crossHairMoved()
            .subscribe(
                null,
                ({
                    offsetX,
                    offsetY,
                    price,
                }: {
                    offsetX: number;
                    offsetY: number;
                    price: number;
                }) => {
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
                },
            );

        const { iframeDoc, paneCanvas } = getPaneCanvasAndIFrameDoc(chart);
        if (!iframeDoc || !paneCanvas) return;

        const handleMouseMove = (e: MouseEvent) => {
            const rect = paneCanvas.getBoundingClientRect();
            const isOutside =
                e.clientX < rect.left ||
                e.clientX > rect.right ||
                e.clientY < rect.top ||
                e.clientY > rect.bottom;

            if (isOutside) {
                setMousePrice(null);
                setShowPlusButton(false);
            }
        };

        iframeDoc.addEventListener('mousemove', handleMouseMove);

        return () => {
            iframeDoc.removeEventListener('mousemove', handleMouseMove);
        };
    }, [chart, scaleData, overlayCanvasMousePositionRef, quickMode]);

    useEffect(() => {
        if (!chart || !scaleData) return;

        const handleMouseDown = () => {
            mouseDownTimeRef.current = Date.now();

            try {
                const selection = chart.activeChart().selection();

                if (!selection.isEmpty()) {
                    const sources = selection.allSources();

                    let hasShape = false;
                    for (const entityId of sources) {
                        try {
                            chart.activeChart().getShapeById(entityId);
                            hasShape = true;
                            break;
                        } catch {
                            // If it throws, it's a mark/indicator, not a shape
                        }
                    }

                    hadSelectionOnMouseDownRef.current = hasShape;
                } else {
                    hadSelectionOnMouseDownRef.current = false;
                }
            } catch {
                hadSelectionOnMouseDownRef.current = false;
            }

            const currentDomain = scaleData?.yScale.domain();
            if (currentDomain && currentDomain.length >= 2) {
                mouseDownDomainRef.current = {
                    min: currentDomain[0],
                    max: currentDomain[1],
                };
            }
        };

        const handleMouseUp = (e: MouseEvent) => {
            if (isCancelClicking) {
                mouseDownTimeRef.current = null;
                mouseDownDomainRef.current = null;
                setIsCancelClicking(false);
                return;
            }

            if (hadSelectionOnMouseDownRef.current) {
                mouseDownTimeRef.current = null;
                mouseDownDomainRef.current = null;
                hadSelectionOnMouseDownRef.current = false;
                return;
            }

            try {
                const selection = chart.activeChart().selection();
                if (!selection.isEmpty()) {
                    mouseDownTimeRef.current = null;
                    mouseDownDomainRef.current = null;
                    return;
                }
            } catch (error) {
                console.error('Error checking selection:', error);
            }

            hadSelectionOnMouseDownRef.current = false;

            if (mouseDownTimeRef.current && mouseDownDomainRef.current) {
                const mouseUpTime = Date.now();
                const duration = mouseUpTime - mouseDownTimeRef.current;
                const currentDomain = scaleData?.yScale.domain();

                if (
                    duration > 150 &&
                    currentDomain &&
                    currentDomain.length >= 2
                ) {
                    const domainChanged =
                        Math.abs(
                            currentDomain[0] - mouseDownDomainRef.current.min,
                        ) > 0.0001 ||
                        Math.abs(
                            currentDomain[1] - mouseDownDomainRef.current.max,
                        ) > 0.0001;

                    if (domainChanged) {
                        mouseDownTimeRef.current = null;
                        mouseDownDomainRef.current = null;
                        return;
                    }
                }
            }

            mouseDownTimeRef.current = null;
            mouseDownDomainRef.current = null;

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
                        const dropdownWidth = 280;

                        const panes = chart.activeChart().getPanes();
                        const mainPane = panes[0];
                        const hasRightPriceScale =
                            mainPane &&
                            mainPane.getRightPriceScales().length > 0;

                        const posX = hasRightPriceScale
                            ? buttonBounds.x +
                              rect.left -
                              dropdownWidth +
                              buttonBounds.width / dpr
                            : buttonBounds.x + rect.left;

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
            if (isExecutingRef.current) return;

            const side: 'buy' | 'sell' =
                markPx && mousePrice && mousePrice > markPx ? 'sell' : 'buy';

            if (!mousePrice) return;

            useTradeDataStore.getState().setOrderInputPriceValue({
                value: mousePrice,
                changeType: 'quickTradeMode',
            });
            useTradeDataStore.getState().setTradeDirection(side);
            useTradeDataStore.getState().setMarketOrderType('limit');
            useTradeDataStore.getState().setIsMidModeActive(false);

            // Convert currency string to OrderBookMode
            const currency = activeOrder?.currency || 'USD';
            const upperSymbol = symbolInfo?.coin?.toUpperCase() ?? 'BTC';
            const denom = currency === upperSymbol ? 'symbol' : 'usd';

            useTradeDataStore.getState().setOrderInputSizeValue({
                value: activeOrder?.size || 0,
                denom: denom,
            });

            if (!activeOrder?.bypassConfirmation) {
                return;
            }
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
                }
            };

            progressAnimationRef.current =
                requestAnimationFrame(animateProgress);
        };

        try {
            chart.subscribe('mouse_down', handleMouseDown);
            chart.subscribe('mouse_up', handleMouseUp);
        } catch (error) {
            console.error('Failed to subscribe to mouse events:', error);
        }

        return () => {
            try {
                chart.unsubscribe('mouse_down', handleMouseDown);
                chart.unsubscribe('mouse_up', handleMouseUp);
            } catch {
                // Chart may have been destroyed
            }
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
        isCancelClicking,
    ]);

    useEffect(() => {
        if (!chart) return;

        const { iframeDoc } = getPaneCanvasAndIFrameDoc(chart);
        if (!iframeDoc) return;

        const handleIframeKeyDown = (e: KeyboardEvent) => {
            // Check if this is the settings shortcut (cmd+,) and prevent default browser behavior
            const categories = getKeyboardShortcutCategories(t);
            const settingsShortcut = getKeyboardShortcutById(
                categories,
                'settings.open',
            );

            if (
                settingsShortcut &&
                matchesShortcutEvent(e, settingsShortcut.keys)
            ) {
                e.preventDefault();
            }

            // Forward iframe keydown to window so global shortcuts work
            window.dispatchEvent(
                new KeyboardEvent('keydown', {
                    key: e.key,
                    code: e.code,
                    altKey: e.altKey,
                    ctrlKey: e.ctrlKey,
                    metaKey: e.metaKey,
                    shiftKey: e.shiftKey,
                    repeat: e.repeat,
                    bubbles: true,
                }),
            );

            // for demonstration cursor
            if (e.altKey) {
                try {
                    chart.selectedLineTool();
                } catch {
                    useOrderPlacementStore.setState({ quickMode: false });
                }
            }
        };

        iframeDoc.addEventListener('keydown', handleIframeKeyDown);

        return () => {
            iframeDoc.removeEventListener('keydown', handleIframeKeyDown);
        };
    }, [chart]);

    useEffect(() => {
        if (!chart || !isChartReady || !canvasSize) return;

        let animationFrameId: number | null = null;

        const drawPlusButton = (
            ctx: CanvasRenderingContext2D,
            canvas: HTMLCanvasElement,
            mouseY: number,
            dpr: number,
        ) => {
            const buttonSize = 21 * dpr;
            const padding = dpr;

            const panes = chart.activeChart().getPanes();
            const mainPane = panes[0];
            const hasRightPriceScale =
                mainPane && mainPane.getRightPriceScales().length > 0;

            const buttonX = hasRightPriceScale
                ? canvas.width - buttonSize - padding
                : padding;
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
                    const { chartHeight, rawPixel } = getPricetoPixel(
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

                        const clickY = rawPixel;

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
                    } else if (showPlusButton) {
                        const mouseY = overlayCanvasMousePositionRef.current.y;
                        drawPlusButton(ctx, canvas, mouseY, dpr);
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
                    showPlusButton &&
                    (mousePrice || (showDropdown && dropdownPosition))
                ) {
                    const mouseY = overlayCanvasMousePositionRef.current.y;
                    drawPlusButton(ctx, canvas, mouseY, dpr);
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
        showPlusButton,
        JSON.stringify(scaleData?.yScale.domain()),
    ]);

    // Listen for preparedOrder changes and trigger animation + order execution
    useEffect(() => {
        if (!preparedOrder) return;
        if (isExecutingRef.current) return;

        const { price, side, size, currency } = preparedOrder;

        const currentSymbolInfo = useTradeDataStore.getState().symbolInfo;
        const markPx = currentSymbolInfo?.markPx || 1;
        const quantity = currency === 'USD' ? size / markPx : size;
        const usdValue = currency === 'USD' ? size : size * markPx;

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
            }
        };

        progressAnimationRef.current = requestAnimationFrame(animateProgress);

        const executeOrder = async () => {
            isExecutingRef.current = true;

            const slug = makeSlug(10);
            const symbol = currentSymbolInfo?.coin || 'BTC';
            const usdValueOfOrderStr = formatNum(usdValue, 2, true, true);

            notifications.add({
                title:
                    side === 'buy'
                        ? t('transactions.buyLongLimitOrderPending')
                        : t('transactions.sellShortLimitOrderPending'),
                message:
                    side === 'buy'
                        ? t('transactions.placingBuyLongLimitOrderFor', {
                              usdValueOfOrderStr,
                              symbol,
                              limitPrice: roundDownToTenth(price),
                          })
                        : t('transactions.placingLimitOrderFor', {
                              usdValueOfOrderStr,
                              symbol,
                              limitPrice: roundDownToTenth(price),
                          }),
                icon: 'spinner',
                slug,
                removeAfter: 60000,
            });

            const orderParams: LimitOrderParams = {
                price: roundDownToTenth(price),
                side,
                quantity,
            };

            const timeOfTxBuildStart = Date.now();
            let isSuccess = false;

            try {
                const result = await executeLimitOrder(orderParams);

                if (result.success) {
                    notifications.remove(slug);
                    if (typeof plausible === 'function') {
                        plausible('Onchain Action - Quick Trade', {
                            props: {
                                actionType: 'Limit Success',
                                orderType: 'Limit',
                                direction: side === 'buy' ? 'Buy' : 'Sell',
                                success: true,
                                txBuildDuration: getDurationSegment(
                                    timeOfTxBuildStart,
                                    result.timeOfSubmission,
                                ),
                                txDuration: getDurationSegment(
                                    result.timeOfSubmission,
                                    Date.now(),
                                ),
                                txSignature: result.signature,
                            },
                        });
                    }
                    notifications.add({
                        title:
                            side === 'buy'
                                ? t('transactions.buyLongLimitOrderPlaced')
                                : t('transactions.sellShortLimitOrderPlaced'),
                        message:
                            side === 'buy'
                                ? t(
                                      'transactions.successfullyPlacedBuyOrderFor',
                                      {
                                          usdValueOfOrderStr,
                                          symbol,
                                          limitPrice: roundDownToTenth(price),
                                      },
                                  )
                                : t(
                                      'transactions.successfullyPlacedSellOrderFor',
                                      {
                                          usdValueOfOrderStr,
                                          symbol,
                                          limitPrice: roundDownToTenth(price),
                                      },
                                  ),
                        icon: 'check',
                        txLink: getTxLink(result.signature),
                        removeAfter: 5000,
                    });

                    isSuccess = true;
                } else {
                    notifications.remove(slug);
                    if (typeof plausible === 'function') {
                        plausible('Onchain Action - Quick Trade', {
                            props: {
                                actionType: 'Limit Fail',
                                orderType: 'Limit',
                                direction: side === 'buy' ? 'Buy' : 'Sell',
                                success: false,
                                txBuildDuration: getDurationSegment(
                                    timeOfTxBuildStart,
                                    result.timeOfSubmission,
                                ),
                                txDuration: getDurationSegment(
                                    result.timeOfSubmission,
                                    Date.now(),
                                ),
                                txSignature: result.signature,
                            },
                        });
                    }
                    notifications.add({
                        title: t('transactions.limitOrderFailed'),
                        message:
                            result.error ||
                            t('transactions.failedToPlaceLimitOrder'),
                        icon: 'error',
                        removeAfter: 10000,
                        txLink: getTxLink(result.signature),
                    });
                }
            } catch (error) {
                notifications.remove(slug);
                notifications.add({
                    title: t('transactions.limitOrderFailed'),
                    message:
                        error instanceof Error
                            ? error.message
                            : t('transactions.unknownErrorOccurred'),
                    icon: 'error',
                });
                if (typeof plausible === 'function') {
                    plausible('Offchain Failure - Quick Trade', {
                        props: {
                            actionType: 'Limit Fail',
                            orderType: 'Limit',
                            direction: side === 'buy' ? 'Buy' : 'Sell',
                            success: false,
                            errorMessage:
                                error instanceof Error
                                    ? error.message
                                    : 'Unknown error occurred',
                        },
                    });
                }
            } finally {
                const cleanup = () => {
                    if (progressAnimationRef.current) {
                        cancelAnimationFrame(progressAnimationRef.current);
                        progressAnimationRef.current = null;
                    }
                    setClickedOrder(null);
                    setIsProcessing(false);
                    setProcessingProgress(0);
                    clearPreparedOrder();
                    isExecutingRef.current = false;
                };

                if (isSuccess) {
                    setTimeout(cleanup, 500);
                } else {
                    cleanup();
                }
            }
        };

        executeOrder();
    }, [
        preparedOrder,
        colors,
        overlayCanvasMousePositionRef,
        clearPreparedOrder,
    ]);

    const handleBuyLimit = (price: number) => {
        if (!activeOrder) {
            openQuickModeConfirm();
            return;
        }
        if (!isSessionEstablished) {
            clickSessionButton();
            return;
        }

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
            }
        };

        progressAnimationRef.current = requestAnimationFrame(animateProgress);
    };

    const handleSellStop = (price: number) => {
        if (!activeOrder) {
            openQuickModeConfirm();
            return;
        }
        if (!isSessionEstablished) {
            clickSessionButton();
            return;
        }

        const side = 'sell';

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
                        } else if (!isSessionEstablished) {
                            clickSessionButton();
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
                        } else if (!isSessionEstablished) {
                            clickSessionButton();
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
