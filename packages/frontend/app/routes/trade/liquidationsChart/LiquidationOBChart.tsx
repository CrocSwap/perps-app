import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAppSettings } from '~/stores/AppSettingsStore';
import { useOrderBookStore } from '~/stores/OrderBookStore';
import { useDebugStore } from '~/stores/DebugStore';
import useNumFormatter from '~/hooks/useNumFormatter';
import { useLazyD3 } from '~/routes/chart/hooks/useLazyD3';
import styles from './LiquidationOBChart.module.css';
import { useTradingView } from '~/contexts/TradingviewContext';
import type {
    CrossHairMovedEventParams,
    ISubscription,
} from '~/tv/charting_library';
import { LiqChartTooltipType, useLiqChartStore } from '~/stores/LiqChartStore';
import type { LiqLevel } from './LiquidationUtils';
import { useTradeDataStore } from '~/stores/TradeDataStore';
interface LiquidationsChartProps {
    buyData: LiqLevel[];
    sellData: LiqLevel[];
    liqBuys: LiqLevel[];
    liqSells: LiqLevel[];
    width?: number;
    height?: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    scaleData?: any;
    location: string;
    chartMode: 'distribution' | 'cumulative';
}

interface LineData {
    x: number;
    y: number;
    offsetY: number;
}

const LiquidationsChart: React.FC<LiquidationsChartProps> = (props) => {
    const {
        sellData,
        buyData,
        liqBuys,
        liqSells,
        width = 300,
        height = 400,
        scaleData,
        location,
        chartMode,
    } = props;

    const {
        setActiveTooltipType,
        setFocusedPrice,
        focusedPrice,
        setFocusSource,
        focusSource,
    } = useLiqChartStore();
    const focusSourceRef = useRef(focusSource);
    focusSourceRef.current = focusSource;

    const { symbolInfo } = useTradeDataStore();
    const symbolInfoRef = useRef(symbolInfo);
    symbolInfoRef.current = symbolInfo;

    const chartModeRef = useRef(chartMode);
    chartModeRef.current = chartMode;

    const d3CanvasLiq = useRef<HTMLCanvasElement | null>(null);
    const d3CanvasLiqHover = useRef<HTMLCanvasElement | null>(null);
    const d3CanvasLiqLines = useRef<HTMLCanvasElement | null>(null);
    const d3CanvasLiqContianer = useRef<HTMLDivElement | null>(null);
    const gap = 4;
    const { d3, d3fc } = useLazyD3() ?? {};

    // All refs instead of state
    const xScaleRef = useRef<d3.ScaleLinear<number, number> | null>(null);
    const buyYScaleRef = useRef<d3.ScaleLinear<number, number> | null>(null);
    const sellYScaleRef = useRef<d3.ScaleLinear<number, number> | null>(null);
    const pageYScaleRef = useRef<d3.ScaleLinear<number, number> | null>(null);

    const [chartReady, setChartReady] = useState(false);

    const { chart } = useTradingView();

    const locationRef = useRef(location);
    locationRef.current = location;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sellAreaSeriesRef = useRef<any>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buyAreaSeriesRef = useRef<any>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const highlightedSellAreaSeriesRef = useRef<any>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const highlightedBuyAreaSeriesRef = useRef<any>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sellLineSeriesRef = useRef<any>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buyLineSeriesRef = useRef<any>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hoverLineSeriesRef = useRef<any>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buyLiqLineSeriesRef = useRef<any>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sellLiqLineSeriesRef = useRef<any>(null);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const liqTooltipRef = useRef<any>(null);

    const currentBuyDataRef = useRef<LiqLevel[]>([]);
    const currentSellDataRef = useRef<LiqLevel[]>([]);
    const currentLiqBuysRef = useRef<LiqLevel[]>([]);
    const currentLiqSellsRef = useRef<LiqLevel[]>([]);
    const hoverLineDataRef = useRef<LineData[]>([]);

    const highlightHoveredArea = useRef(false);

    const { orderCount } = useOrderBookStore();
    const orderCountRef = useRef(0);
    orderCountRef.current = orderCount;

    const { bsColor, getBsColor } = useAppSettings();

    const { pauseLiqAnimation } = useDebugStore();
    const pauseLiqAnimationRef = useRef(pauseLiqAnimation);
    pauseLiqAnimationRef.current = pauseLiqAnimation;

    const { formatNum } = useNumFormatter();

    const OVERLAY_WIDTH_RATIO = 0.1;

    const widthRef = useRef(width);
    widthRef.current =
        location === 'liqMobile' ? width * OVERLAY_WIDTH_RATIO : width;
    const heightRef = useRef(height);
    heightRef.current = height;

    const scaleDataRef = useRef(scaleData);
    scaleDataRef.current = scaleData;

    const animFrameRef = useRef<number | null>(null);
    const animDuration = 1000;
    const isAnimating = useRef(false);
    const isInitialized = useRef(false);

    const showLiqText = useRef(false);
    const showAreaText = useRef(false);

    // Debug flag - set to true to show liq sizes on lines
    const debugTexts = false;

    const minLiqLine = 2;
    const baseLiqWidth = 6; // base width when slot has liq value
    const minAreaWidth = 2; // minimum width in pixels for area chart ticks
    const liqLineWidth = 2;

    const buyColorRef = useRef(getBsColor().buy);
    const sellColorRef = useRef(getBsColor().sell);

    const hideTooltipRef = useRef(false);

    // Helper to ensure minimum width for area chart ticks (using ref for stable reference)
    const getMinRatioRef = useRef((ratio: number | undefined): number => {
        if (!ratio || ratio === 0) return 0;
        const minRatio = minAreaWidth / widthRef.current;
        return Math.max(ratio, minRatio);
    });

    // Update the ref function when width changes
    useEffect(() => {
        getMinRatioRef.current = (ratio: number | undefined): number => {
            if (!ratio || ratio === 0) return 0;
            const minRatio = minAreaWidth / widthRef.current;
            return Math.max(ratio, minRatio);
        };
    }, [width]);

    const getMinRatio = (ratio: number | undefined): number => {
        return getMinRatioRef.current(ratio);
    };

    // calculates center y for liq chart (on overlay chart that center point is changed based on tv chart y axis positioning)
    const getCenterY = useCallback(() => {
        if (
            locationRef.current === 'liqMobile' &&
            scaleDataRef.current &&
            currentBuyDataRef.current.length > 0
        ) {
            const buyPx = currentBuyDataRef.current[0].px;
            const buyY = scaleDataRef.current.yScale(buyPx);
            return buyY;
        }

        return heightRef.current / 2;
    }, []);

    useEffect(() => {
        buyColorRef.current = getBsColor().buy;
        sellColorRef.current = getBsColor().sell;

        if (isInitialized.current) {
            updateScalesAndSeries();
            bindHighlightActions();
        }
    }, [bsColor]);

    // draws liquidation lines on the liq chart
    const drawLiquidationLines = useCallback(
        (context: CanvasRenderingContext2D) => {
            if (
                !xScaleRef.current ||
                !buyYScaleRef.current ||
                !sellYScaleRef.current
            )
                return;

            const root = document.documentElement;

            const styles = getComputedStyle(root);

            const rowGap = parseInt(styles.getPropertyValue('--gap-s'), 10);

            const midHeader = document.getElementById('orderBookMidHeader');
            const obBuyBlock = document.getElementById('orderbook-buy-block');
            const obSellBlock = document.getElementById('orderbook-sell-block');
            const singleRow = document.getElementById('order-sell-srow-0');
            const slotsWrapper = document.getElementById(
                'orderBookSlotsWrapper',
            );

            // const obSellBlock = document.getElementById('orderbook-sell-block');

            const basicMenuContainer = document.getElementById(
                'order-trades-list-container',
            );

            const tradeListHeight = basicMenuContainer
                ? basicMenuContainer?.getBoundingClientRect().height / 2
                : 0;
            const obBuyBlockHeight =
                obBuyBlock?.getBoundingClientRect().height ||
                tradeListHeight ||
                0;
            const obSellBlockHeight =
                obSellBlock?.getBoundingClientRect().height ||
                tradeListHeight ||
                0;
            const midHeaderHeight =
                midHeader?.getBoundingClientRect().height || 0;

            const rowCssHeight =
                singleRow?.getBoundingClientRect().height || 16;

            const slotsWrapperHeight =
                slotsWrapper?.getBoundingClientRect().height || 0;

            const rowHeight = rowCssHeight
                ? rowCssHeight + rowGap / 2
                : obSellBlockHeight / orderCountRef.current;

            const isSellFilled =
                currentLiqSellsRef.current.length >= orderCountRef.current;

            const diff =
                orderCountRef.current - currentLiqSellsRef.current.length;

            const topPadding =
                slotsWrapperHeight -
                obSellBlockHeight -
                obBuyBlockHeight -
                midHeaderHeight;

            const topGap = topPadding / 2 - rowGap / 2;

            if (obBuyBlockHeight === 0 || obSellBlockHeight === 0) return;

            context.save();

            // Set text properties
            context.font = '12px Arial';
            context.textAlign = 'left';
            context.textBaseline = 'middle';

            // Draw buy liquidation lines (in buy section) with equal spacing
            context.strokeStyle = sellColorRef.current;
            context.lineWidth = liqLineWidth;
            const buyLiqCount = currentLiqBuysRef.current.length;

            const buyLineStarterY =
                obSellBlockHeight + topGap + rowGap / 2 + midHeaderHeight;

            if (buyLiqCount > 0) {
                currentLiqBuysRef.current.forEach((liq, index) => {
                    if (index >= orderCountRef.current) return;

                    const yPos =
                        buyLineStarterY +
                        rowGap / 2 +
                        rowHeight * index +
                        rowHeight / 2;

                    const hasLiq = (liq.sz || 0) > 0.01;
                    const minWidth = hasLiq
                        ? minAreaWidth + baseLiqWidth
                        : minLiqLine;
                    const xStart =
                        widthRef.current -
                        widthRef.current * (liq.ratio || 0) -
                        minWidth;

                    const xEnd = widthRef.current;

                    context.beginPath();
                    context.moveTo(xStart, yPos);
                    context.lineTo(xEnd, yPos);
                    context.stroke();

                    if (debugTexts && liq.sz > 0.01) {
                        // Draw liq size and ratio text to the left of the line
                        context.fillStyle = sellColorRef.current;
                        context.font = '10px Arial';
                        context.textAlign = 'right';
                        const sizeText = `${liq.sz.toFixed(2)} (${((liq.ratio || 0) * 100).toFixed(1)}%)`;
                        context.fillText(sizeText, xStart - 4, yPos + 3);
                    }

                    if (showLiqText.current) {
                        // Draw px value text
                        context.fillStyle = sellColorRef.current;
                        const pxText =
                            liq.sz.toFixed(2) + ' ' + liq.ratio?.toFixed(2);
                        context.fillText(pxText, 20, yPos - 3);
                    }
                });
            }

            // Draw sell liquidation lines (in sell section) with equal spacing
            context.strokeStyle = buyColorRef.current;
            // context.strokeStyle = 'gray';
            context.lineWidth = liqLineWidth;
            const sellLiqCount = currentLiqSellsRef.current.length;

            if (sellLiqCount > 0) {
                currentLiqSellsRef.current.forEach((liq, index) => {
                    if (index >= orderCountRef.current) return;

                    const yPositionIndex =
                        topGap +
                        rowHeight / 2 +
                        rowHeight * index +
                        (isSellFilled ? 0 : diff * rowHeight);

                    const hasLiq = (liq.sz || 0) > 0.01;
                    const minWidth = hasLiq
                        ? minAreaWidth + baseLiqWidth
                        : minLiqLine;
                    const xStart =
                        widthRef.current -
                        widthRef.current * (liq.ratio || 0) -
                        minWidth;

                    const xEnd = widthRef.current;

                    context.beginPath();
                    context.moveTo(xStart, yPositionIndex);
                    context.lineTo(xEnd, yPositionIndex);
                    context.stroke();

                    if (debugTexts && liq.sz > 0.01) {
                        // Draw liq size and ratio text to the left of the line
                        context.fillStyle = buyColorRef.current;
                        context.font = '10px Arial';
                        context.textAlign = 'right';
                        const sizeText = `${liq.sz.toFixed(2)} (${((liq.ratio || 0) * 100).toFixed(1)}%)`;
                        context.fillText(
                            sizeText,
                            xStart - 4,
                            yPositionIndex + 3,
                        );
                    }

                    if (showLiqText.current) {
                        // Draw px value text
                        context.fillStyle = buyColorRef.current;
                        const pxText =
                            liq.sz.toFixed(2) + ' ' + liq.ratio?.toFixed(2);
                        context.fillText(pxText, 20, yPositionIndex - 3);
                    }
                });
            }

            if (showAreaText.current) {
                context.font = '8px Arial';
                context.textAlign = 'left';
                context.textBaseline = 'middle';
                context.fillStyle = 'white';
                currentSellDataRef.current.forEach((d, index) => {
                    const yPos = sellYScaleRef.current
                        ? sellYScaleRef.current(d.px)
                        : 0;
                    context.fillStyle = 'white';
                    context.fillText(d.ratio?.toFixed(2) || '0', 20, yPos - 3);
                });
            }

            //  add mid line
            const yPos =
                obSellBlockHeight + topGap + rowGap + midHeaderHeight / 2 - 2;
            context.strokeStyle = '#BCBCC4';
            context.lineWidth = liqLineWidth;
            context.setLineDash([4, 4]);
            context.beginPath();
            context.moveTo(0, yPos);
            context.lineTo(widthRef.current, yPos);
            context.stroke();

            context.restore();
        },
        [],
    );

    const updateScales = useCallback(() => {
        const currentBuyData = currentBuyDataRef.current;
        const currentSellData = currentSellDataRef.current;

        if (
            !currentBuyData ||
            !currentSellData
            //  \\ currentBuyData.length === 0 ||
            // currentSellData.length === 0
        )
            return;

        const dpr = window.devicePixelRatio || 1;

        // Calculate max ratio in data based on chart mode
        const getRatioValue = (d: LiqLevel) =>
            chartModeRef.current === 'distribution'
                ? getMinRatio(d.ratio)
                : getMinRatio(d.cumulativeRatio);

        const maxBuyRatio =
            currentBuyData.length > 0
                ? Math.max(...currentBuyData.map(getRatioValue))
                : 0;
        const maxSellRatio =
            currentSellData.length > 0
                ? Math.max(...currentSellData.map(getRatioValue))
                : 0;
        const maxRatio = Math.max(maxBuyRatio, maxSellRatio);

        // Scale width of chart to fit 50% of area if ratio is below 50%
        const domainMax = maxRatio > 0 && maxRatio < 0.5 ? maxRatio * 2 : 1;

        const xScale = d3
            .scaleLinear()
            .domain([0, domainMax])
            .range([widthRef.current * dpr, 0]);

        const topBoundaryBuy = Math.max(...currentBuyData.map((d) => d.px));
        const bottomBoundaryBuy = Math.min(...currentBuyData.map((d) => d.px));
        const topBoundarySell = Math.max(...currentSellData.map((d) => d.px));
        const bottomBoundarySell = Math.min(
            ...currentSellData.map((d) => d.px),
        );

        const midHeader = document.getElementById('orderBookMidHeader');
        const midHeaderHeight = midHeader?.getBoundingClientRect().height || 0;

        const root = document.documentElement;

        const styles = getComputedStyle(root);

        const rowGap = parseInt(styles.getPropertyValue('--gap-s'), 10);

        // mid gap
        const centerY = getCenterY();
        const gapSize = rowGap / 2;

        const buyYScale = d3
            .scaleLinear()
            .domain([bottomBoundaryBuy, topBoundaryBuy])
            .range([
                heightRef.current * dpr,
                (centerY + midHeaderHeight / 2 + gapSize + 1) * dpr,
            ]);

        const sellYScale = d3
            .scaleLinear()
            .domain([bottomBoundarySell, topBoundarySell])
            .range([(centerY - midHeaderHeight / 2 - 1) * dpr, 0]);

        const pageYScale = d3
            .scaleLinear()
            .domain([bottomBoundaryBuy, topBoundarySell])
            .range([heightRef.current, 0]);

        xScaleRef.current = xScale;
        buyYScaleRef.current = scaleDataRef.current
            ? scaleDataRef.current.yScale
            : buyYScale;
        sellYScaleRef.current = scaleDataRef.current
            ? scaleDataRef.current.yScale
            : sellYScale;
        pageYScaleRef.current = scaleDataRef.current
            ? scaleDataRef.current.yScale
            : pageYScale;
    }, []);

    const updateScalesAndSeries = useCallback(() => {
        if (!d3 || !d3fc) return;

        if (location === 'liqMobile' && !chartReady) return;

        updateScales();

        const dpr = window.devicePixelRatio || 1;

        const canvas = d3
            .select(d3CanvasLiq.current)
            .select('canvas')
            .node() as HTMLCanvasElement;
        if (!canvas) return;
        const context = canvas.getContext('2d');
        if (!context) return;

        // const curve = d3.curveStepAfter;

        const curve = d3.curveLinear;

        const buyRgbaColor = sellColorRef.current;
        const sellRgbaColor = buyColorRef.current;

        const sellArea = d3fc
            .seriesCanvasArea()
            .orient('horizontal')
            .curve(curve)
            .decorate((context: CanvasRenderingContext2D) => {
                const d3sellRgbaColor = d3.color(sellRgbaColor)?.copy();

                if (d3sellRgbaColor) {
                    d3sellRgbaColor.opacity =
                        hoverLineDataRef.current.length > 0 ? 0.2 : 0.4;
                }

                context.fillStyle = d3sellRgbaColor?.toString() || '#ff5c5c';
            })
            .mainValue((d: LiqLevel) =>
                chartModeRef.current === 'distribution'
                    ? getMinRatio(d.ratio)
                    : getMinRatio(d.cumulativeRatio),
            )
            .crossValue((d: LiqLevel) => d.px)
            .xScale(xScaleRef.current)
            .yScale(
                scaleDataRef.current
                    ? scaleDataRef.current.yScale
                    : sellYScaleRef.current,
            );

        const buyArea = d3fc
            .seriesCanvasArea()
            .orient('horizontal')
            .curve(curve)
            .decorate((context: CanvasRenderingContext2D) => {
                const d3buyRgbaColor = d3.color(buyRgbaColor)?.copy();

                if (d3buyRgbaColor) {
                    d3buyRgbaColor.opacity =
                        hoverLineDataRef.current.length > 0 ? 0.2 : 0.4;
                }
                context.fillStyle = d3buyRgbaColor?.toString() || '4cd471';
            })
            .mainValue((d: LiqLevel) =>
                chartModeRef.current === 'distribution'
                    ? getMinRatio(d.ratio)
                    : getMinRatio(d.cumulativeRatio),
            )
            .crossValue((d: LiqLevel) => d.px)
            .xScale(xScaleRef.current)
            .yScale(
                scaleDataRef.current
                    ? scaleDataRef.current.yScale
                    : buyYScaleRef.current,
            );

        const sellLine = d3fc
            .seriesCanvasLine()
            .orient('horizontal')
            .curve(curve)
            .mainValue((d: LiqLevel) =>
                chartModeRef.current === 'distribution'
                    ? getMinRatio(d.ratio)
                    : getMinRatio(d.cumulativeRatio),
            )
            .crossValue((d: LiqLevel) => d.px)
            .xScale(xScaleRef.current)
            .yScale(
                scaleDataRef.current
                    ? scaleDataRef.current.yScale
                    : sellYScaleRef.current,
            )
            .decorate((context: CanvasRenderingContext2D) => {
                context.save();
                context.strokeStyle = sellRgbaColor;
                context.lineWidth = 1.5;
            });

        const buyLine = d3fc
            .seriesCanvasLine()
            .orient('horizontal')
            .curve(curve)
            .mainValue((d: LiqLevel) =>
                chartModeRef.current === 'distribution'
                    ? getMinRatio(d.ratio)
                    : getMinRatio(d.cumulativeRatio),
            )
            .crossValue((d: LiqLevel) => d.px)
            .xScale(xScaleRef.current)
            .yScale(
                scaleDataRef.current
                    ? scaleDataRef.current.yScale
                    : buyYScaleRef.current,
            )
            .decorate((context: CanvasRenderingContext2D) => {
                context.save();
                context.strokeStyle = buyRgbaColor;
                context.lineWidth = 1.5;
            });

        sellAreaSeriesRef.current = sellArea;
        buyAreaSeriesRef.current = buyArea;
        sellLineSeriesRef.current = sellLine;
        buyLineSeriesRef.current = buyLine;

        // Setup drawing
        d3.select(d3CanvasLiq.current).dispatch('draw', { bubbles: false });
        sellArea?.context(context);
        sellLine?.context(context);
        buyArea?.context(context);
        buyLine?.context(context);

        if (
            sellLiqLineSeriesRef.current &&
            buyLiqLineSeriesRef.current &&
            location === 'liqMobile'
        ) {
            buyLiqLineSeriesRef.current?.context(context);
            sellLiqLineSeriesRef.current?.context(context);
        }

        d3.select(d3CanvasLiq.current).on('draw', () => {
            canvas.width = scaleDataRef.current
                ? widthRef.current * dpr
                : widthRef.current * dpr;
            canvas.height = scaleDataRef.current ? height * dpr : height * dpr;
            canvas.style.width = `${widthRef.current}px`;
            canvas.style.height = `${height}px`;

            if (hoverLineDataRef.current.length > 0) {
                clipCanvas(hoverLineDataRef.current[0].offsetY, canvas, true);
            }

            sellArea(currentSellDataRef.current);
            buyArea(currentBuyDataRef.current);
            sellLine(currentSellDataRef.current);
            buyLine(currentBuyDataRef.current);
        });
    }, [width, height, location, chartReady, chartMode]);

    useEffect(() => {
        if (location !== 'obBook') return;
        if (!d3 || !d3fc) return;

        const canvas = d3
            .select(d3CanvasLiqLines.current)
            .select('canvas')
            .node() as HTMLCanvasElement;

        if (!canvas) return;
        const context = canvas.getContext('2d');
        if (!context) return;

        const container = d3.select(d3CanvasLiqLines.current).node() as any;
        if (container) container.requestRedraw();

        d3.select(d3CanvasLiqLines.current).on('draw', () => {
            // Draw liquidation lines using our custom function
            drawLiquidationLines(context);
        });
    }, [width, height, drawLiquidationLines]);

    const updateScalesOnly = useCallback(() => {
        updateScales();

        // Update scales in existing series if they exist
        if (sellAreaSeriesRef.current) {
            sellAreaSeriesRef.current
                .xScale(xScaleRef.current)
                .yScale(
                    scaleDataRef.current
                        ? scaleDataRef.current.yScale
                        : sellYScaleRef.current,
                );
        }
        if (buyAreaSeriesRef.current) {
            buyAreaSeriesRef.current
                .xScale(xScaleRef.current)
                .yScale(
                    scaleDataRef.current
                        ? scaleDataRef.current.yScale
                        : buyYScaleRef.current,
                );
        }
        if (highlightedSellAreaSeriesRef.current) {
            highlightedSellAreaSeriesRef.current
                .xScale(xScaleRef.current)
                .yScale(
                    scaleDataRef.current
                        ? scaleDataRef.current.yScale
                        : sellYScaleRef.current,
                );
        }
        if (highlightedBuyAreaSeriesRef.current) {
            highlightedBuyAreaSeriesRef.current
                .xScale(xScaleRef.current)
                .yScale(
                    scaleDataRef.current
                        ? scaleDataRef.current.yScale
                        : buyYScaleRef.current,
                );
        }
        if (sellLineSeriesRef.current) {
            sellLineSeriesRef.current
                .xScale(xScaleRef.current)
                .yScale(
                    scaleDataRef.current
                        ? scaleDataRef.current.yScale
                        : sellYScaleRef.current,
                );
        }
        if (buyLineSeriesRef.current) {
            buyLineSeriesRef.current
                .xScale(xScaleRef.current)
                .yScale(
                    scaleDataRef.current
                        ? scaleDataRef.current.yScale
                        : buyYScaleRef.current,
                );
        }
        if (sellLiqLineSeriesRef.current) {
            sellLiqLineSeriesRef.current
                .xScale(xScaleRef.current)
                .yScale(
                    scaleDataRef.current
                        ? scaleDataRef.current.yScale
                        : sellYScaleRef.current,
                );
        }
        if (buyLiqLineSeriesRef.current) {
            buyLiqLineSeriesRef.current
                .xScale(xScaleRef.current)
                .yScale(
                    scaleDataRef.current
                        ? scaleDataRef.current.yScale
                        : buyYScaleRef.current,
                );
        }
    }, [width, height]);

    const interPolateData = useCallback(
        (fromData: LiqLevel[], toData: LiqLevel[], progress: number) => {
            if (progress < 0) return fromData;
            if (progress > 1) return toData;
            if (pauseLiqAnimationRef.current) return fromData;

            const interpolatedData: LiqLevel[] = [];

            if (fromData.length != toData.length) {
                return toData;
            }

            for (let i = 0; i < fromData.length; i++) {
                const fromRow = fromData[i];
                const toRow = toData[i];

                const interpolatedRow = {
                    ...fromRow,
                    ratio:
                        (fromRow.ratio || 0) +
                        ((toRow.ratio || 0) - (fromRow.ratio || 0)) * progress,
                    px:
                        (fromRow.px || 0) +
                        ((toRow.px || 0) - (fromRow.px || 0)) * progress,
                    sz:
                        (fromRow.sz || 0) +
                        ((toRow.sz || 0) - (fromRow.sz || 0)) * progress,
                    cumulativeRatio:
                        (fromRow.cumulativeRatio || 0) +
                        ((toRow.cumulativeRatio || 0) -
                            (fromRow.cumulativeRatio || 0)) *
                            progress,
                };

                interpolatedData.push(interpolatedRow);
            }

            return interpolatedData;
        },
        [],
    );

    const interPolateLiqData = useCallback(
        (fromData: LiqLevel[], toData: LiqLevel[], progress: number) => {
            if (progress < 0) return fromData;
            if (progress > 1) return toData;
            if (pauseLiqAnimationRef.current) return fromData;

            const interpolatedData: LiqLevel[] = [];

            const maxLength = Math.max(fromData.length, toData.length);

            for (let i = 0; i < maxLength; i++) {
                const fromRow = fromData[i];
                const toRow = toData[i];

                // Create default row with zero values for missing data
                const defaultRow: LiqLevel = {
                    ratio: 0,
                    px: fromRow?.px || toRow?.px || 0,
                    sz: 0,
                    type: fromRow?.type || toRow?.type || 'buy',
                    cumulativeRatio: 0,
                    cumulativeSz: 0,
                };

                const safeFromRow = fromRow || defaultRow;
                const safeToRow = toRow || defaultRow;

                const interpolatedRow = {
                    ...safeFromRow,
                    ratio:
                        (safeFromRow.ratio || 0) +
                        ((safeToRow.ratio || 0) - (safeFromRow.ratio || 0)) *
                            progress,
                    px:
                        (safeFromRow.px || 0) +
                        ((safeToRow.px || 0) - (safeFromRow.px || 0)) *
                            progress,
                    sz:
                        (safeFromRow.sz || 0) +
                        ((safeToRow.sz || 0) - (safeFromRow.sz || 0)) *
                            progress,
                    cumulativeRatio:
                        (safeFromRow.cumulativeRatio || 0) +
                        ((safeToRow.cumulativeRatio || 0) -
                            (safeFromRow.cumulativeRatio || 0)) *
                            progress,
                };

                interpolatedData.push(interpolatedRow);
            }

            return interpolatedData;
        },
        [],
    );

    const animateChart = useCallback(
        (
            newBuyData: LiqLevel[],
            newSellData: LiqLevel[],
            newLiqBuys: LiqLevel[],
            newLiqSells: LiqLevel[],
        ) => {
            if (
                isAnimating.current &&
                animFrameRef.current
                // && !pauseLiqAnimationRef.current
            ) {
                cancelAnimationFrame(animFrameRef.current);
                isAnimating.current = false;
            }

            isAnimating.current = true;

            const startTs = performance.now();

            const anim = (time: number) => {
                if (!d3 || !d3fc) return;
                const elapsed = time - startTs;
                const progress = Math.min(elapsed / animDuration, 1);

                const interpolatedBuys = interPolateData(
                    currentBuyDataRef.current,
                    newBuyData,
                    progress,
                );
                const interpolatedSells = interPolateData(
                    currentSellDataRef.current,
                    newSellData,
                    progress,
                );
                const interpolatedLiqBuys = interPolateLiqData(
                    currentLiqBuysRef.current,
                    newLiqBuys,
                    progress,
                );
                const interpolatedLiqSells = interPolateLiqData(
                    currentLiqSellsRef.current,
                    newLiqSells,
                    progress,
                );

                currentBuyDataRef.current = interpolatedBuys;
                currentSellDataRef.current = interpolatedSells;
                currentLiqBuysRef.current = interpolatedLiqBuys;
                currentLiqSellsRef.current = interpolatedLiqSells;

                // Update only scales, not full series recreation
                updateScalesOnly();

                // Trigger redraw
                d3.select(d3CanvasLiq.current).dispatch('draw', {
                    bubbles: false,
                });

                const lineContainer = d3
                    .select(d3CanvasLiqLines.current)
                    .node() as any;
                if (lineContainer) lineContainer.requestRedraw();

                const hoveredContainer = d3
                    .select(d3CanvasLiqHover.current)
                    .node() as any;
                if (hoveredContainer) {
                    hoveredContainer.requestRedraw();
                }

                if (progress < 1) {
                    animFrameRef.current = requestAnimationFrame(anim);
                } else {
                    isAnimating.current = false;
                    animFrameRef.current = null;
                    // Final scale update when animation completes
                    updateScalesOnly();
                }
            };

            animFrameRef.current = requestAnimationFrame(anim);
        },
        [animDuration, interPolateData, interPolateLiqData, updateScalesOnly],
    );

    useEffect(() => {
        if (!pageYScaleRef.current) return;
        if (location === focusSourceRef.current) return;

        const dpr = window.devicePixelRatio || 1;
        const usedDpr = location === 'liqMobile' ? dpr : 1;

        let yPoint = 0;
        if (location === 'liqMobile') {
            yPoint = scaleDataRef.current.yScale(focusedPrice) / usedDpr;
        } else {
            yPoint = pageYScaleRef.current(focusedPrice / usedDpr);
        }
        handleTooltip(0, yPoint, true);
    }, [focusedPrice, location]);

    const handleTooltip = useCallback(
        (
            offsetX: number,
            offsetY: number,
            updateFromStore: boolean = false,
        ) => {
            if (
                !xScaleRef.current ||
                !pageYScaleRef.current ||
                !buyYScaleRef.current ||
                !d3 ||
                !d3fc
            )
                return;

            const dpr = window.devicePixelRatio || 1;
            const usedDpr = location === 'liqMobile' ? dpr : 1;

            const canvas = d3
                .select(d3CanvasLiqHover.current)
                .select('canvas')
                .node() as HTMLCanvasElement;

            const rect = canvas.getBoundingClientRect();

            const centerY = getCenterY();
            const isBuy = centerY < offsetY * usedDpr;

            const priceOnMousePoint = pageYScaleRef.current.invert(
                offsetY * usedDpr,
            );

            // chart is being updated from store, so we don't need to update the store
            if (!updateFromStore) {
                setFocusedPrice(priceOnMousePoint);
            }

            // Calculate hover line data
            hoverLineDataRef.current = [
                {
                    x: xScaleRef.current.invert(
                        xScaleRef.current.range()[0] * usedDpr,
                    ),
                    y: priceOnMousePoint,
                    offsetY: offsetY,
                },
                {
                    x: xScaleRef.current.invert((offsetX + 10) * usedDpr),
                    y: priceOnMousePoint,
                    offsetY: offsetY,
                },
            ];

            // Fill and place tooltip
            if (!liqTooltipRef.current || !currentBuyDataRef.current) return;

            let hoveredArray = isBuy
                ? currentBuyDataRef.current
                : currentSellDataRef.current;

            if (!hoveredArray || hoveredArray.length === 0) return;

            if (locationRef.current === 'liqMobile') {
                hoveredArray = hoveredArray.slice(0, hoveredArray.length - 1);
            }

            const nearest = hoveredArray.filter((item) =>
                isBuy
                    ? item.px < priceOnMousePoint
                    : item.px > priceOnMousePoint,
            );

            let nextNearest: LiqLevel | undefined = undefined;

            if (hoveredArray.length > nearest.length) {
                nextNearest =
                    hoveredArray[hoveredArray.length - nearest.length + 1];
            }

            const snappedPricePoint =
                nearest.length > 0
                    ? nearest.reduce((closest: LiqLevel, item: LiqLevel) => {
                          if (!closest) return item;
                          return Math.abs(item.px - priceOnMousePoint) <
                              Math.abs(closest.px - priceOnMousePoint)
                              ? item
                              : closest;
                      })
                    : hoveredArray[hoveredArray.length - 1];

            let priceText = formatNum(snappedPricePoint.px);
            if (nextNearest) {
                priceText = priceText + ' ~ ' + formatNum(nextNearest.px);
            }

            const amount =
                snappedPricePoint && snappedPricePoint.cumulativeSz
                    ? snappedPricePoint.cumulativeSz
                    : 0;

            const finalTotal =
                hoveredArray[hoveredArray.length - 1].cumulativeSz || Infinity;

            const percentage = (amount / finalTotal) * 100;

            if (!hideTooltipRef.current) {
                liqTooltipRef.current.html(
                    '<p>' +
                        formatNum(percentage) +
                        '%</p>' +
                        '<p>' +
                        'Cumulative Liq: ' +
                        formatNum(amount, 2) +
                        ' ' +
                        symbolInfoRef.current?.coin +
                        ' </p>' +
                        '<p>' +
                        'Price: ' +
                        priceText +
                        ' </p>' +
                        '<p>' +
                        'Size: ' +
                        formatNum(snappedPricePoint.sz, 2) +
                        ' ' +
                        symbolInfoRef.current?.coin +
                        ' </p>',
                );
            } else {
                liqTooltipRef.current.html('');
            }

            const width = liqTooltipRef.current
                .node()
                .getBoundingClientRect().width;

            const height = liqTooltipRef.current
                .node()
                .getBoundingClientRect().height;

            const horizontal = offsetX - width / 2;
            const vertical = offsetY - (height + 10);

            const verticalPosition = vertical < 0 ? offsetY + 10 : vertical;

            liqTooltipRef.current
                .style('visibility', 'visible')
                .style('top', verticalPosition + 'px')
                .style(
                    'left',
                    '10%',
                    // Math.min(Math.max(horizontal, 10), rect.width - 50) + 'px',
                )
                .style('width', '80%');

            if (locationRef.current === 'liqMobile') {
                liqTooltipRef.current.style('left', '0%');
                liqTooltipRef.current.style('background', 'var(--bg-dark2)');
                liqTooltipRef.current.style(
                    'border',
                    '1px solid var(--bg-dark6)',
                );
                liqTooltipRef.current.style('transform', 'translateX(-100%)');
                liqTooltipRef.current.style('width', '12rem');
            }

            highlightHoveredArea.current = true;
        },
        [getCenterY],
    );

    const mousemove = useCallback(
        (event: React.MouseEvent<HTMLDivElement>) => {
            if (
                !xScaleRef.current ||
                !pageYScaleRef.current ||
                !buyYScaleRef.current ||
                !d3 ||
                !d3fc
            )
                return;

            const canvas = d3
                .select(d3CanvasLiqHover.current)
                .select('canvas')
                .node() as HTMLCanvasElement;

            const rect = canvas.getBoundingClientRect();

            const offsetY = event.clientY - rect?.top;
            const offsetX = event.clientX - rect?.left;

            handleTooltip(offsetX, offsetY);
            setFocusSource(location);
        },
        [handleTooltip, location],
    );

    const clipCanvas = (
        point: number,
        highlightedCanvas: HTMLCanvasElement,
        reverse: boolean = false,
    ) => {
        const dpr = window.devicePixelRatio || 1;

        const ctx = highlightedCanvas.getContext(
            '2d',
        ) as CanvasRenderingContext2D;

        let clipEdge = highlightedCanvas.height / 2;

        if (scaleDataRef.current && currentBuyDataRef.current.length > 0) {
            const buyPx = currentBuyDataRef.current[0].px;
            const buyY = scaleDataRef.current.yScale(buyPx);
            clipEdge = buyY;
        }

        const startY = point * dpr;
        const endY = clipEdge - startY;

        ctx.save();
        ctx.beginPath();

        reverse &&
            ctx.rect(0, 0, highlightedCanvas.width, highlightedCanvas.height);

        ctx.rect(0, startY, highlightedCanvas.width, endY);

        reverse ? ctx.clip('evenodd') : ctx.clip();
    };

    useEffect(() => {
        if (location === 'liqMobile' && !chartReady) return;
        // if (buyData.length === 0 || sellData.length === 0) return;

        // For initial load, set current data directly
        if (!isInitialized.current) {
            currentBuyDataRef.current = buyData;
            currentSellDataRef.current = sellData;
            currentLiqBuysRef.current = liqBuys;
            currentLiqSellsRef.current = liqSells;
            isInitialized.current = true;
            updateScalesAndSeries();
            bindHighlightActions();
            return;
        }

        // For subsequent updates, animate to new data
        animateChart(buyData, sellData, liqBuys, liqSells);
    }, [
        buyData,
        sellData,
        animateChart,
        liqBuys,
        liqSells,
        updateScalesAndSeries,
        location,
        chartReady,
    ]);

    useEffect(() => {
        updateScalesAndSeries();
    }, [width, height, chartReady, chartMode]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (!d3 || !d3fc) return;

            if (animFrameRef.current) {
                cancelAnimationFrame(animFrameRef.current);
                animFrameRef.current = null;
            }
            isAnimating.current = false;
            isInitialized.current = false;

            // Clear D3 event listeners
            if (d3CanvasLiq.current) {
                d3.select(d3CanvasLiq.current)
                    .on('draw', null)
                    .on('measure', null);
            }
            // Clear D3 event listeners
            if (d3CanvasLiqHover.current) {
                d3.select(d3CanvasLiqHover.current)
                    .on('draw', null)
                    .on('measure', null);
            }

            if (d3CanvasLiqLines.current) {
                d3.select(d3CanvasLiqLines.current)
                    .on('draw', null)
                    .on('measure', null);
            }

            // Clear refs
            currentBuyDataRef.current = [];
            currentSellDataRef.current = [];
            currentLiqBuysRef.current = [];
            currentLiqSellsRef.current = [];

            // Clear D3 refs
            xScaleRef.current = null;
            buyYScaleRef.current = null;
            sellYScaleRef.current = null;
            sellAreaSeriesRef.current = null;
            buyAreaSeriesRef.current = null;
            sellLiqLineSeriesRef.current = null;
            buyLiqLineSeriesRef.current = null;
            sellLineSeriesRef.current = null;
            buyLineSeriesRef.current = null;
            pageYScaleRef.current = null;
            hoverLineSeriesRef.current = null;
        };
    }, []);

    useEffect(() => {
        if (!d3 || !d3fc) return;

        d3.select(d3CanvasLiqContianer.current).on(
            'mousemove',
            function (event: React.MouseEvent<HTMLDivElement>) {
                mousemove(event);
            },
            { passive: true },
        );

        d3.select(d3CanvasLiqContianer.current).on(
            'mouseout',
            function (event: React.MouseEvent<HTMLDivElement>) {
                highlightHoveredArea.current = false;
                hoverLineDataRef.current = [];
                liqTooltipRef.current.style('visibility', 'hidden');
            },
            { passive: true },
        );

        if (
            d3
                .select(d3CanvasLiqContianer.current)
                .select('.liqTooltip')
                .node() === null
        ) {
            const liqTooltip = d3
                .select(d3CanvasLiqContianer.current)
                .append('div')
                .attr('class', 'liqTooltip')
                .style('position', 'absolute')
                .style('text-align', 'center')
                .style('align-items', 'center')
                .style('background', 'rgba(78, 78, 100, 0.47)')
                .style('padding', '3px')
                .style('font-size', 'small')
                .style('pointer-events', 'none')
                .style('visibility', 'hidden');

            liqTooltipRef.current = liqTooltip;
        }
    }, []);

    const bindHighlightActions = useCallback(() => {
        if (!d3 || !d3fc) return;
        if (location === 'liqMobile' && !chartReady) return;

        const curve = d3.curveLinear;

        if (
            !xScaleRef.current ||
            !pageYScaleRef.current ||
            !sellYScaleRef.current ||
            !buyYScaleRef.current
        ) {
            return;
        }

        const d3buyRgbaColor = d3.color(sellColorRef.current)?.copy();
        const d3sellRgbaColor = d3.color(buyColorRef.current)?.copy();
        if (d3buyRgbaColor) d3buyRgbaColor.opacity = 0.4;
        if (d3sellRgbaColor) d3sellRgbaColor.opacity = 0.4;

        const highlightedBuyArea = d3fc
            .seriesCanvasArea()
            .orient('horizontal')
            .curve(curve)
            .decorate((context: CanvasRenderingContext2D) => {
                context.fillStyle = d3buyRgbaColor?.toString() || '4cd471';
            })
            .mainValue((d: LiqLevel) =>
                chartModeRef.current === 'distribution'
                    ? getMinRatio(d.ratio)
                    : getMinRatio(d.cumulativeRatio),
            )
            .crossValue((d: LiqLevel) => d.px)
            .xScale(xScaleRef.current)
            .yScale(
                scaleDataRef.current
                    ? scaleDataRef.current.yScale
                    : buyYScaleRef.current,
            );

        const highlightedSellArea = d3fc
            .seriesCanvasArea()
            .orient('horizontal')
            .curve(curve)
            .decorate((context: CanvasRenderingContext2D) => {
                context.fillStyle = d3sellRgbaColor?.toString() || '#ff5c5c';
            })
            .mainValue((d: LiqLevel) =>
                chartModeRef.current === 'distribution'
                    ? getMinRatio(d.ratio)
                    : getMinRatio(d.cumulativeRatio),
            )
            .crossValue((d: LiqLevel) => d.px)
            .xScale(xScaleRef.current)
            .yScale(
                scaleDataRef.current
                    ? scaleDataRef.current.yScale
                    : sellYScaleRef.current,
            );

        const hoverLine = d3fc
            .seriesCanvasLine()
            .orient('horizontal')
            .curve(curve)
            .mainValue((d: LineData) => d.x)
            .crossValue((d: LineData) => d.y)
            .xScale(xScaleRef.current)
            .yScale(
                scaleDataRef.current
                    ? scaleDataRef.current.yScale
                    : pageYScaleRef.current,
            )
            .decorate((context: CanvasRenderingContext2D) => {
                context.strokeStyle = '#8b98a5';
                context.lineWidth = 1.5;
            });

        highlightedSellAreaSeriesRef.current = highlightedSellArea;
        highlightedBuyAreaSeriesRef.current = highlightedBuyArea;
        hoverLineSeriesRef.current = hoverLine;

        const hoveredCanvas = d3
            .select(d3CanvasLiqHover.current)
            .select('canvas')
            .node() as HTMLCanvasElement;
        if (!hoveredCanvas) return;

        const hovereContext = hoveredCanvas.getContext('2d');
        if (!hovereContext) return;

        const hoveredContainer = d3
            .select(d3CanvasLiqHover.current)
            .node() as any;
        if (hoveredContainer) hoveredContainer.requestRedraw();

        const dpr = window.devicePixelRatio || 1;

        d3.select(d3CanvasLiqHover.current)
            .on('draw', () => {
                if (hoverLineDataRef.current.length === 0) return;

                hoveredCanvas.width = widthRef.current * dpr;
                hoveredCanvas.height = heightRef.current * dpr;

                if (highlightHoveredArea.current) {
                    clipCanvas(
                        hoverLineDataRef.current[0].offsetY,
                        hoveredCanvas,
                    );

                    sellLineSeriesRef.current(currentSellDataRef.current);
                    buyLineSeriesRef.current(currentBuyDataRef.current);

                    hoverLine(hoverLineDataRef.current);
                    highlightedBuyArea(currentBuyDataRef.current);
                    highlightedSellArea(currentSellDataRef.current);
                }
            })
            .on('measure', () => {
                hoveredCanvas.width = widthRef.current * dpr;
                hoveredCanvas.height = heightRef.current * dpr;
                hoverLine?.context(hovereContext);
                highlightedBuyArea?.context(hovereContext);
                highlightedSellArea?.context(hovereContext);
                sellLineSeriesRef.current?.context(hovereContext);
                buyLineSeriesRef.current?.context(hovereContext);
            });
    }, [location, chartReady]);

    const callbackCrosshair = useCallback(
        (params: CrossHairMovedEventParams) => {
            const { offsetX, offsetY } = params;
            const tvChart = document.getElementById('tv_chart');
            if (!tvChart) return;

            const tvChartRect = tvChart.getBoundingClientRect();

            if (!offsetX || !offsetY) return;
            if (!d3CanvasLiqContianer.current) return;

            const mouseX = tvChartRect.left + offsetX;
            const mouseY = tvChartRect.top + offsetY;

            d3CanvasLiqContianer.current.getBoundingClientRect();

            // TODO: price axis right-left switch will be handled on these calculations
            const relativeMouseX =
                mouseX -
                d3CanvasLiqContianer.current.getBoundingClientRect().left;
            const relativeMouseY =
                mouseY -
                d3CanvasLiqContianer.current.getBoundingClientRect().top;

            if (relativeMouseX < 0 || relativeMouseY < 0) {
                highlightHoveredArea.current = false;
                hoverLineDataRef.current = [];
                liqTooltipRef.current.style('visibility', 'hidden');
                setActiveTooltipType(LiqChartTooltipType.Level);

                // can be reactivated to sync both tooltips (chart and independent)
                // handleTooltip(relativeMouseX, relativeMouseY);
                hideTooltipRef.current = true;
                return;
            }

            handleTooltip(relativeMouseX, relativeMouseY);
            setActiveTooltipType(LiqChartTooltipType.Distribution);
            hideTooltipRef.current = false;
            setFocusSource(location);
        },
        [handleTooltip, location],
    );

    useEffect(() => {
        if (!chart) return;
        if (location !== 'liqMobile') return;

        let crosshairSubscription: ISubscription<
            (params: CrossHairMovedEventParams) => void
        > | null = null;

        const context = { name: 'crosshair-handler' };

        chart.onChartReady(() => {
            crosshairSubscription = chart.activeChart().crossHairMoved();
            setChartReady(true);

            if (crosshairSubscription) {
                crosshairSubscription.subscribe(context, callbackCrosshair);
            }
        });

        chart
            .activeChart()
            .onVisibleRangeChanged()
            .subscribe(null, () => {
                updateScalesAndSeries();
            });
    }, [chart, location, updateScalesAndSeries]);

    return (
        <div
            ref={d3CanvasLiqContianer}
            id={`d3CanvasLiqContianer-${location}`}
            style={{
                width: `${widthRef.current}px`,
                // height: `${heightRef.current}px`,
            }}
            className={`${styles.liqChartCanvasWrapper} ${location === 'liqMobile' ? styles.liqMobile : ''}`}
        >
            <d3fc-canvas
                ref={d3CanvasLiqLines}
                className={styles.linesCanvas}
                style={{
                    position: 'absolute',
                    width: `${widthRef.current}px`,
                    height: `${heightRef.current}px`,
                }}
            ></d3fc-canvas>

            <d3fc-canvas
                ref={d3CanvasLiqHover}
                className={styles.hoverCanvas}
                style={{
                    position: 'absolute',
                    width: `${widthRef.current}px`,
                    height: `${heightRef.current}px`,
                }}
            ></d3fc-canvas>

            <d3fc-canvas
                ref={d3CanvasLiq}
                className={styles.distCanvas}
                style={{
                    position: 'absolute',
                    width: `${widthRef.current}px`,
                    height: `${heightRef.current}px`,
                }}
            />
        </div>
    );
};

export default LiquidationsChart;
