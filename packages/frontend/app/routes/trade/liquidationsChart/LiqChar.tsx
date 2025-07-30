import React, { useCallback, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import * as d3fc from 'd3fc';
import type {
    OrderBookLiqIF,
    OrderBookRowIF,
} from '~/utils/orderbook/OrderBookIFs';
import { useAppSettings } from '~/stores/AppSettingsStore';
import { useOrderBookStore } from '~/stores/OrderBookStore';
import { useDebugStore } from '~/stores/DebugStore';

interface LiquidationsChartProps {
    buyData: OrderBookRowIF[];
    sellData: OrderBookRowIF[];
    liqBuys: OrderBookLiqIF[];
    liqSells: OrderBookLiqIF[];
    width?: number;
    height?: number;
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
    const gap = 4;

    // All refs instead of state
    const xScaleRef = useRef<d3.ScaleLinear<number, number> | null>(null);
    const buyYScaleRef = useRef<d3.ScaleLinear<number, number> | null>(null);
    const sellYScaleRef = useRef<d3.ScaleLinear<number, number> | null>(null);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sellAreaSeriesRef = useRef<any>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buyAreaSeriesRef = useRef<any>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sellLineSeriesRef = useRef<any>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buyLineSeriesRef = useRef<any>(null);

    const currentBuyDataRef = useRef<OrderBookRowIF[]>([]);
    const currentSellDataRef = useRef<OrderBookRowIF[]>([]);
    const currentLiqBuysRef = useRef<OrderBookLiqIF[]>([]);
    const currentLiqSellsRef = useRef<OrderBookLiqIF[]>([]);

    const { orderCount } = useOrderBookStore();
    const orderCountRef = useRef(0);
    orderCountRef.current = orderCount;

    const { bsColor, getBsColor } = useAppSettings();

    const { pauseLiqAnimation } = useDebugStore();
    const pauseLiqAnimationRef = useRef(pauseLiqAnimation);
    pauseLiqAnimationRef.current = pauseLiqAnimation;

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

            const midHeader = document.getElementById('orderBookMidHeader');
            const obBuyBlock = document.getElementById('orderbook-buy-block');
            const obSellBlock = document.getElementById('orderbook-sell-block');

            const obBuyBlockHeight =
                obBuyBlock?.getBoundingClientRect().height || 0;
            const obSellBlockHeight =
                obSellBlock?.getBoundingClientRect().height || 0;
            const midHeaderHeight =
                midHeader?.getBoundingClientRect().height || 0;

            const rowHeight = obBuyBlockHeight / orderCountRef.current;

            context.save();

            // Set text properties
            context.font = '12px Arial';
            context.textAlign = 'left';
            context.textBaseline = 'middle';

            // Draw buy liquidation lines (in buy section) with equal spacing
            context.strokeStyle = sellColorRef.current;
            context.lineWidth = liqLineWidth;
            const buyLiqCount = currentLiqBuysRef.current.length;
            if (buyLiqCount > 0) {
                currentLiqBuysRef.current.forEach((liq, index) => {
                    if (index >= orderCountRef.current) return;
                    const yPos =
                        obSellBlockHeight +
                        midHeaderHeight +
                        rowHeight * index +
                        rowHeight / 2 +
                        4;
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

            const diff = rowHeight - sellLiqCount;

            if (sellLiqCount > 0) {
                currentLiqSellsRef.current.forEach((liq, index) => {
                    if (index >= orderCountRef.current) return;

                    const matchingYPos =
                        rowHeight * (diff < 1 && diff > 0 ? index + 1 : index) +
                        rowHeight / 2;
                    const fillerYPos =
                        obSellBlockHeight -
                        rowHeight * (sellLiqCount - index) +
                        rowHeight / 2;

                    const yPos = diff > 1 ? fillerYPos : matchingYPos;
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
                        context.fillStyle = buyColorRef.current;
                        const pxText =
                            liq.sz.toFixed(2) + ' ' + liq.ratio?.toFixed(2);
                        context.fillText(pxText, 20, yPos - 3);
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
            const yPos = obBuyBlockHeight + midHeaderHeight / 2;
            context.strokeStyle = '#BCBCC4';
            context.lineWidth = liqLineWidth;
            context.setLineDash([4, 4]);
            context.beginPath();
            context.moveTo(20, yPos);
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
            currentSellData.length === 0
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

        // mid gap
        const centerY = heightRef.current / 2;
        const gapSize = gap;

        const buyYScale = d3
            .scaleLinear()
            .domain([bottomBoundaryBuy, topBoundaryBuy])
            .range([heightRef.current, centerY + gapSize]);
        const sellYScale = d3
            .scaleLinear()
            .domain([bottomBoundarySell, topBoundarySell])
            .range([centerY - gapSize, 0]);

        xScaleRef.current = xScale;
        buyYScaleRef.current = buyYScale;
        sellYScaleRef.current = sellYScale;

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
        const d3buyRgbaColor = d3.color(buyRgbaColor)?.copy();
        const d3sellRgbaColor = d3.color(sellRgbaColor)?.copy();
        if (d3buyRgbaColor) d3buyRgbaColor.opacity = 0.4;
        if (d3sellRgbaColor) d3sellRgbaColor.opacity = 0.4;

        const sellArea = d3fc
            .seriesCanvasArea()
            .orient('horizontal')
            .curve(curve)
            .decorate((context: CanvasRenderingContext2D) => {
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
                sellArea(currentSellDataRef.current);
                buyArea(currentBuyDataRef.current);
                sellLine(currentSellDataRef.current);
                buyLine(currentBuyDataRef.current);

                // Draw liquidation lines using our custom function
                drawLiquidationLines(context);
            })
            .on('measure', (event: CustomEvent) => {
                sellArea?.context(context);
                sellLine?.context(context);
                buyArea?.context(context);
                buyLine?.context(context);
            });
    }, [width, height, drawLiquidationLines]);

    const updateScalesOnly = useCallback(() => {
        const currentBuyData = currentBuyDataRef.current;
        const currentSellData = currentSellDataRef.current;

        if (
            !currentBuyData ||
            !currentSellData ||
            currentBuyData.length === 0 ||
            currentSellData.length === 0
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

        // Add 20px gap in center: sell area (0 to center-10px), buy area (center+10px to bottom)
        const centerY = heightRef.current / 2;
        const gapSize = gap; // 10px on each side = 20px total gap

        const buyYScale = d3
            .scaleLinear()
            .domain([bottomBoundaryBuy, topBoundaryBuy])
            .range([heightRef.current, centerY + gapSize]);
        const sellYScale = d3
            .scaleLinear()
            .domain([bottomBoundarySell, topBoundarySell])
            .range([centerY - gapSize, 0]);

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
        };
    }, []);

    return (
        <>
            <d3fc-canvas
                ref={d3CanvasLiq}
                style={{
                    position: 'relative',
                    width: `${widthRef.current}px`,
                    height: `${heightRef.current}px`,
                }}
            />
        </>
    );
};

export default LiquidationsChart;
