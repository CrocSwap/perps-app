import React, { useCallback, useEffect, useRef } from 'react';
import type {
    OrderBookLiqIF,
    OrderBookRowIF,
} from '~/utils/orderbook/OrderBookIFs';
import { useAppSettings } from '~/stores/AppSettingsStore';
import { useOrderBookStore } from '~/stores/OrderBookStore';
import { useDebugStore } from '~/stores/DebugStore';
import useNumFormatter from '~/hooks/useNumFormatter';
import { useLazyD3 } from '~/routes/chart/hooks/useLazyD3';

interface LiquidationsChartProps {
    buyData: OrderBookRowIF[];
    sellData: OrderBookRowIF[];
    liqBuys: OrderBookLiqIF[];
    liqSells: OrderBookLiqIF[];
    width?: number;
    height?: number;
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
    } = props;

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
    const liqTooltipRef = useRef<any>(null);

    const currentBuyDataRef = useRef<OrderBookRowIF[]>([]);
    const currentSellDataRef = useRef<OrderBookRowIF[]>([]);
    const currentLiqBuysRef = useRef<OrderBookLiqIF[]>([]);
    const currentLiqSellsRef = useRef<OrderBookLiqIF[]>([]);
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

    const widthRef = useRef(width);
    widthRef.current = width;
    const heightRef = useRef(height);
    heightRef.current = height;

    const animFrameRef = useRef<number | null>(null);
    const animDuration = 5000;
    const isAnimating = useRef(false);
    const isInitialized = useRef(false);

    const showLiqText = useRef(false);
    const showAreaText = useRef(false);

    const minLiqLine = 10;
    const liqLineWidth = 2;

    const buyColorRef = useRef(getBsColor().buy);
    const sellColorRef = useRef(getBsColor().sell);

    const mouseYRef = useRef(0);

    useEffect(() => {
        buyColorRef.current = getBsColor().buy;
        sellColorRef.current = getBsColor().sell;

        if (isInitialized.current) {
            updateScalesAndSeries();
        }
    }, [bsColor]);

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

                    const xStart =
                        widthRef.current -
                        widthRef.current * (liq.ratio || 0) -
                        minLiqLine;

                    const xEnd = widthRef.current;

                    context.beginPath();
                    context.moveTo(xStart, yPos);
                    context.lineTo(xEnd, yPos);
                    context.stroke();

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

                    const xStart =
                        widthRef.current -
                        widthRef.current * (liq.ratio || 0) -
                        minLiqLine;

                    const xEnd = widthRef.current;

                    context.beginPath();
                    context.moveTo(xStart, yPositionIndex);
                    context.lineTo(xEnd, yPositionIndex);
                    context.stroke();

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

    const updateScalesAndSeries = useCallback(() => {
        const currentBuyData = currentBuyDataRef.current;
        const currentSellData = currentSellDataRef.current;

        if (
            !currentBuyData ||
            !currentSellData ||
            currentBuyData.length === 0 ||
            currentSellData.length === 0 ||
            !d3 ||
            !d3fc
        )
            return;

        // Update scales
        const xScale = d3
            .scaleLinear()
            .domain([0, 1])
            .range([widthRef.current, 0]);
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
        const centerY = heightRef.current / 2;
        const gapSize = rowGap / 2;

        const buyYScale = d3
            .scaleLinear()
            .domain([bottomBoundaryBuy, topBoundaryBuy])
            .range([
                heightRef.current,
                centerY + midHeaderHeight / 2 + gapSize + 1,
            ]);

        const sellYScale = d3
            .scaleLinear()
            .domain([bottomBoundarySell, topBoundarySell])
            .range([centerY - midHeaderHeight / 2 - 1, 0]);

        const pageYScale = d3
            .scaleLinear()
            .domain([0, 100])
            .range([heightRef.current, 0]);

        xScaleRef.current = xScale;
        buyYScaleRef.current = buyYScale;
        sellYScaleRef.current = sellYScale;
        pageYScaleRef.current = pageYScale;

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
                // const isBuy = mouseYRef.current > heightRef.current / 2;
                const d3sellRgbaColor = d3.color(sellRgbaColor)?.copy();

                if (d3sellRgbaColor) {
                    d3sellRgbaColor.opacity =
                        hoverLineDataRef.current.length > 0 ? 0.2 : 0.4;
                }

                context.fillStyle = d3sellRgbaColor?.toString() || '#ff5c5c';
            })
            .mainValue((d: OrderBookRowIF) => d.ratio)
            .crossValue((d: OrderBookRowIF) => d.px)
            .xScale(xScale)
            .yScale(sellYScale);

        const buyArea = d3fc
            .seriesCanvasArea()
            .orient('horizontal')
            .curve(curve)
            .decorate((context: CanvasRenderingContext2D) => {
                // const isBuy = mouseYRef.current > heightRef.current / 2;
                const d3buyRgbaColor = d3.color(buyRgbaColor)?.copy();

                if (d3buyRgbaColor) {
                    d3buyRgbaColor.opacity =
                        hoverLineDataRef.current.length > 0 ? 0.2 : 0.4;
                }
                context.fillStyle = d3buyRgbaColor?.toString() || '4cd471';
            })
            .mainValue((d: OrderBookRowIF) => d.ratio)
            .crossValue((d: OrderBookRowIF) => d.px)
            .xScale(xScale)
            .yScale(buyYScale);

        const sellLine = d3fc
            .seriesCanvasLine()
            .orient('horizontal')
            .curve(curve)
            .mainValue((d: OrderBookRowIF) => d.ratio)
            .crossValue((d: OrderBookRowIF) => d.px)
            .xScale(xScale)
            .yScale(sellYScale)
            .decorate((context: CanvasRenderingContext2D) => {
                context.save();
                context.strokeStyle = sellRgbaColor;
                context.lineWidth = 1.5;
            });

        const buyLine = d3fc
            .seriesCanvasLine()
            .orient('horizontal')
            .curve(curve)
            .mainValue((d: OrderBookRowIF) => d.ratio)
            .crossValue((d: OrderBookRowIF) => d.px)
            .xScale(xScale)
            .yScale(buyYScale)
            .decorate((context: CanvasRenderingContext2D) => {
                context.strokeStyle = buyRgbaColor;
                context.lineWidth = 1.5;
            });

        sellAreaSeriesRef.current = sellArea;
        buyAreaSeriesRef.current = buyArea;
        sellLineSeriesRef.current = sellLine;
        buyLineSeriesRef.current = buyLine;

        // Setup drawing
        const container = d3.select(d3CanvasLiq.current).node() as any;
        if (container) container.requestRedraw();

        d3.select(d3CanvasLiq.current)
            .on('draw', () => {
                if (hoverLineDataRef.current.length > 0) {
                    clipCanvas(
                        hoverLineDataRef.current[0].offsetY,
                        canvas,
                        true,
                    );
                }

                sellArea(currentSellDataRef.current);
                buyArea(currentBuyDataRef.current);
                sellLine(currentSellDataRef.current);
                buyLine(currentBuyDataRef.current);
            })
            .on('measure', () => {
                sellArea?.context(context);
                sellLine?.context(context);
                buyArea?.context(context);
                buyLine?.context(context);
            });
    }, [width, height]);

    useEffect(() => {
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
        const currentBuyData = currentBuyDataRef.current;
        const currentSellData = currentSellDataRef.current;

        if (
            !currentBuyData ||
            !currentSellData ||
            currentBuyData.length === 0 ||
            currentSellData.length === 0 ||
            !d3 ||
            !d3fc
        )
            return;

        // Update scales only
        const xScale = d3
            .scaleLinear()
            .domain([0, 1])
            .range([widthRef.current, 0]);
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

        const centerY = heightRef.current / 2;
        const gapSize = rowGap / 2;

        const buyYScale = d3
            .scaleLinear()
            .domain([bottomBoundaryBuy, topBoundaryBuy])
            .range([
                heightRef.current,
                centerY + midHeaderHeight / 2 + gapSize + 1,
            ]);
        const sellYScale = d3
            .scaleLinear()
            .domain([bottomBoundarySell, topBoundarySell])
            .range([centerY - midHeaderHeight / 2 - 1, 0]);

        xScaleRef.current = xScale;
        buyYScaleRef.current = buyYScale;
        sellYScaleRef.current = sellYScale;

        // Update scales in existing series if they exist
        if (sellAreaSeriesRef.current) {
            sellAreaSeriesRef.current.xScale(xScale).yScale(sellYScale);
        }
        if (buyAreaSeriesRef.current) {
            buyAreaSeriesRef.current.xScale(xScale).yScale(buyYScale);
        }
        if (highlightedSellAreaSeriesRef.current) {
            highlightedSellAreaSeriesRef.current
                .xScale(xScale)
                .yScale(sellYScale);
        }
        if (highlightedBuyAreaSeriesRef.current) {
            highlightedBuyAreaSeriesRef.current
                .xScale(xScale)
                .yScale(buyYScale);
        }
        if (sellLineSeriesRef.current) {
            sellLineSeriesRef.current.xScale(xScale).yScale(sellYScale);
        }
        if (buyLineSeriesRef.current) {
            buyLineSeriesRef.current.xScale(xScale).yScale(buyYScale);
        }
    }, [width, height]);

    const interPolateData = useCallback(
        (
            fromData: OrderBookRowIF[],
            toData: OrderBookRowIF[],
            progress: number,
        ) => {
            if (progress < 0) return fromData;
            if (progress > 1) return toData;
            if (pauseLiqAnimationRef.current) return fromData;

            const interpolatedData: OrderBookRowIF[] = [];

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
                };

                interpolatedData.push(interpolatedRow);
            }

            return interpolatedData;
        },
        [],
    );

    const interPolateLiqData = useCallback(
        (
            fromData: OrderBookLiqIF[],
            toData: OrderBookLiqIF[],
            progress: number,
        ) => {
            if (progress < 0) return fromData;
            if (progress > 1) return toData;
            if (pauseLiqAnimationRef.current) return fromData;

            const interpolatedData: OrderBookLiqIF[] = [];

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
                };

                interpolatedData.push(interpolatedRow);
            }

            return interpolatedData;
        },
        [],
    );

    const animateChart = useCallback(
        (
            newBuyData: OrderBookRowIF[],
            newSellData: OrderBookRowIF[],
            newLiqBuys: OrderBookLiqIF[],
            newLiqSells: OrderBookLiqIF[],
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
                const container = d3.select(d3CanvasLiq.current).node() as any;
                if (container) container.requestRedraw();

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

    const mousemove = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
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

        // Calculate hover line data
        hoverLineDataRef.current = [
            {
                x: xScaleRef.current.invert(xScaleRef.current.range()[0]),
                y: pageYScaleRef.current.invert(offsetY),
                offsetY: offsetY,
            },
            {
                x: xScaleRef.current.invert(offsetX + 10),
                y: pageYScaleRef.current.invert(offsetY),
                offsetY: offsetY,
            },
        ];

        // Fill and place tooltip
        if (!liqTooltipRef.current || !currentBuyDataRef.current) return;

        const mousePoint = buyYScaleRef.current.invert(offsetY);

        const midHeader = document.getElementById('orderBookMidHeader');
        const midHeaderHeight = midHeader?.getBoundingClientRect().height || 0;

        const centerY = heightRef.current / 2;

        const isBuy = centerY < offsetY;

        mouseYRef.current = offsetY;

        const hoveredArray = isBuy ? currentBuyDataRef : currentSellDataRef;

        const nearest = hoveredArray.current.filter((item) =>
            isBuy ? item.px < mousePoint : item.px > mousePoint,
        );

        const snappedPrice =
            nearest.length > 0
                ? nearest.reduce(
                      (closest: OrderBookRowIF, item: OrderBookRowIF) => {
                          if (!closest) return item;
                          return Math.abs(item.px - mousePoint) <
                              Math.abs(closest.px - mousePoint)
                              ? item
                              : closest;
                      },
                  )
                : hoveredArray.current[hoveredArray.current.length - 1];

        const price =
            snappedPrice && snappedPrice.total ? snappedPrice.total : 0;

        const finalTotal =
            hoveredArray.current[hoveredArray.current.length - 1].total;

        const percentage = (price / finalTotal) * 100;

        liqTooltipRef.current.html(
            '<p>' +
                formatNum(percentage) +
                '%</p>' +
                '<p>' +
                formatNum(price, 2) +
                ' </p>',
        );

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
                Math.min(Math.max(horizontal, 10), rect.width - 50) + 'px',
            );

        highlightHoveredArea.current = true;
    }, []);

    const clipCanvas = (
        point: number,
        highlightedCanvas: HTMLCanvasElement,
        reverse: boolean = false,
    ) => {
        const ctx = highlightedCanvas.getContext(
            '2d',
        ) as CanvasRenderingContext2D;

        const clipEdge = highlightedCanvas.height / 2;

        const startY = point;
        const endY = clipEdge - startY;

        ctx.save();
        ctx.beginPath();

        reverse &&
            ctx.rect(0, 0, highlightedCanvas.width, highlightedCanvas.height);

        ctx.rect(0, startY, highlightedCanvas.width, endY);

        reverse ? ctx.clip('evenodd') : ctx.clip();
    };

    useEffect(() => {
        if (buyData.length === 0 || sellData.length === 0) return;

        // For initial load, set current data directly
        if (!isInitialized.current) {
            currentBuyDataRef.current = buyData;
            currentSellDataRef.current = sellData;
            currentLiqBuysRef.current = liqBuys;
            currentLiqSellsRef.current = liqSells;
            isInitialized.current = true;
            updateScalesAndSeries();
            return;
        }

        // For subsequent updates, animate to new data
        // if (!isAnimating.current) {
        animateChart(buyData, sellData, liqBuys, liqSells);
        // }
    }, [
        buyData,
        sellData,
        animateChart,
        liqBuys,
        liqSells,
        updateScalesAndSeries,
        width,
        height,
    ]);

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

    useEffect(() => {
        if (!d3 || !d3fc) return;

        const curve = d3.curveLinear;

        if (
            !xScaleRef.current ||
            !pageYScaleRef.current ||
            !sellYScaleRef.current ||
            !buyYScaleRef.current
        )
            return;

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
            .mainValue((d: OrderBookRowIF) => d.ratio)
            .crossValue((d: OrderBookRowIF) => d.px)
            .xScale(xScaleRef.current)
            .yScale(buyYScaleRef.current);

        const highlightedSellArea = d3fc
            .seriesCanvasArea()
            .orient('horizontal')
            .curve(curve)
            .decorate((context: CanvasRenderingContext2D) => {
                context.fillStyle = d3sellRgbaColor?.toString() || '#ff5c5c';
            })
            .mainValue((d: OrderBookRowIF) => d.ratio)
            .crossValue((d: OrderBookRowIF) => d.px)
            .xScale(xScaleRef.current)
            .yScale(sellYScaleRef.current);

        const hoverLine = d3fc
            .seriesCanvasLine()
            .orient('horizontal')
            .curve(curve)
            .mainValue((d: LineData) => d.x)
            .crossValue((d: LineData) => d.y)
            .xScale(xScaleRef.current)
            .yScale(pageYScaleRef.current)
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

        d3.select(d3CanvasLiqHover.current)
            .on('draw', () => {
                if (hoverLineDataRef.current.length === 0) return;

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
                hoverLine?.context(hovereContext);
                highlightedBuyArea?.context(hovereContext);
                highlightedSellArea?.context(hovereContext);
                sellLineSeriesRef.current?.context(hovereContext);
                buyLineSeriesRef.current?.context(hovereContext);
            });
    }, [width, height, bsColor]);

    return (
        <div
            ref={d3CanvasLiqContianer}
            style={{
                position: 'relative',
                width: `${widthRef.current}px`,
                // height: `${heightRef.current}px`,
            }}
        >
            <d3fc-canvas
                ref={d3CanvasLiqLines}
                style={{
                    position: 'absolute',
                    width: `${widthRef.current}px`,
                    height: `${heightRef.current}px`,
                }}
            ></d3fc-canvas>

            <d3fc-canvas
                ref={d3CanvasLiqHover}
                style={{
                    position: 'absolute',
                    width: `${widthRef.current}px`,
                    height: `${heightRef.current}px`,
                }}
            ></d3fc-canvas>

            <d3fc-canvas
                ref={d3CanvasLiq}
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
