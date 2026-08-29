import { useCallback, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { useTradingView } from '~/contexts/TradingviewContext';
import { getPaneCanvasAndIFrameDoc } from '../overlayCanvas/overlayCanvasUtils';
import useNumFormatter from '~/hooks/useNumFormatter';
import { useAppSettings } from '~/stores/AppSettingsStore';
import type {
    CrossHairMovedEventParams,
    ISubscription,
    MouseEventParams,
} from '~/tv/charting_library';
import type { HorizontalLineData } from './LiqudationLines';
import { LiqChartTooltipType, useLiqChartStore } from '~/stores/LiqChartStore';
import { useTradeDataStore } from '~/stores/TradeDataStore';

interface LiqTooltipProps {
    overlayCanvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
    canvasWrapperRef: React.MutableRefObject<HTMLDivElement | null>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    scaleData: any;
    lines: HorizontalLineData[];
}

const LiqLineTooltip = ({
    overlayCanvasRef,
    canvasWrapperRef,
    scaleData,
    lines,
}: LiqTooltipProps) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const liqLineTooltipRef = useRef<any>(null);
    const { activeTooltipType } = useLiqChartStore();
    const activeTooltipTypeRef = useRef(activeTooltipType);
    activeTooltipTypeRef.current = activeTooltipType;

    const { symbolInfo } = useTradeDataStore();
    const symbolPriceRef = useRef(symbolInfo?.markPx ?? 0);
    symbolPriceRef.current = symbolInfo?.markPx ?? 0;

    const { chart } = useTradingView();

    // const lines = useLiqudationLines(scaleData);

    const linesRef = useRef(lines);

    const shouldOpenTooltip = useRef(true);

    const { getBsColor } = useAppSettings();

    const { formatNum, activeDecimalSeparator, activeGroupSeparator } =
        useNumFormatter();

    useEffect(() => {
        linesRef.current = lines;
    }, [JSON.stringify(lines), lines]);

    const checkLines = useCallback(
        (offsetX: number, offsetY: number) => {
            const lines = linesRef.current;
            const yScale = scaleData?.yScale;
            if (!lines?.length || !yScale) return null;

            const dpr = window.devicePixelRatio || 1;
            const cursorY = offsetY * dpr;

            const nearest = lines.reduce(
                (acc, line) => {
                    const dist = Math.abs(yScale(line.yPrice) - cursorY);
                    return dist < acc.minDist ? { line, minDist: dist } : acc;
                },
                {
                    line: null as (typeof lines)[number] | null,
                    minDist: Infinity,
                },
            );

            const threshold = 8;
            return nearest.minDist < threshold ? nearest.line : null;
        },
        [scaleData, linesRef],
    );

    const mousemove = useCallback(
        (offsetX: number, offsetY: number) => {
            // Fill and place tooltip
            if (!liqLineTooltipRef.current) return;
            if (!scaleData || !scaleData.yScale) return;
            if (chart === null) return;
            if (!shouldOpenTooltip.current) return;

            const { paneCanvas } = getPaneCanvasAndIFrameDoc(chart);

            if (!paneCanvas) return;

            const rect = paneCanvas?.getBoundingClientRect();

            const cssOffsetX = offsetX - rect.left;
            const cssOffsetY = offsetY - rect.top;

            const placedLine = checkLines(cssOffsetX, cssOffsetY);

            if (!placedLine) {
                liqLineTooltipRef.current.style('visibility', 'hidden');
                return;
            }

            const buyColor = getBsColor().buy;
            const sellColor = getBsColor().sell;

            // formatNum(percentage) +
            liqLineTooltipRef.current.html(
                `<p style="color:var(--text3, #88888f)"> ${
                    placedLine.type
                } Liquidations </p>` +
                    `<p style="color:${placedLine.type === 'Short' ? buyColor : sellColor}"> Price: ${formatNum(placedLine?.yPrice, null, true)} </p>` +
                    // `<p style="color: var(--text2, #bcbcc4)"> Volume: ${formatNum(placedLine.liqValue, null, true)} TKN </p>`,
                    `<p style="color: var(--text2, #bcbcc4)"> Liquidation: ${formatNum(placedLine.liqValue * symbolPriceRef.current, null, true)} USD </p>`,
            );

            const width = liqLineTooltipRef.current
                .node()
                .getBoundingClientRect().width;

            const height = liqLineTooltipRef.current
                .node()
                .getBoundingClientRect().height;

            const tooltipOffsetY = offsetY + 5 - height / 2;

            const horizontal =
                cssOffsetX + width + 5 > rect.right - rect.left
                    ? cssOffsetX - width - 5
                    : cssOffsetX + 5;

            const vertical =
                tooltipOffsetY + height > rect.bottom - rect.top
                    ? tooltipOffsetY - height - 5
                    : tooltipOffsetY;

            liqLineTooltipRef.current
                .style('visibility', 'visible')
                .style('top', vertical + 'px')
                .style('left', horizontal + 'px');
        },
        [
            scaleData,
            linesRef,
            chart,
            liqLineTooltipRef.current === null,
            formatNum,
        ],
    );

    const callbackCrosshair = useCallback(
        (params: CrossHairMovedEventParams) => {
            if (
                activeTooltipTypeRef.current ===
                LiqChartTooltipType.Distribution
            ) {
                liqLineTooltipRef.current.style('visibility', 'hidden');
                return;
            }

            const { offsetX, offsetY } = params;
            if (offsetX && offsetY) {
                mousemove(offsetX, offsetY);
            }
        },
        [
            scaleData,
            linesRef,
            chart,
            liqLineTooltipRef.current === null,
            activeDecimalSeparator,
            activeGroupSeparator,
            formatNum,
        ],
    );

    const onMouseLeave = useCallback(() => {
        shouldOpenTooltip.current = false;
        if (liqLineTooltipRef)
            liqLineTooltipRef.current.style('visibility', 'hidden');
    }, [liqLineTooltipRef]);

    const callbackMouseDown = (event: MouseEventParams) => {
        setTimeout(() => {
            onMouseLeave();
        }, 300);
    };

    const callbackMouseUp = (event: MouseEventParams) => {
        setTimeout(() => {
            shouldOpenTooltip.current = true;
            if (liqLineTooltipRef) mousemove(event.clientX, event.clientY);
        }, 100);
    };

    useEffect(() => {
        if (!overlayCanvasRef.current || !canvasWrapperRef.current) return;
        if (!chart) return;

        let crosshairSubscription: ISubscription<
            (params: CrossHairMovedEventParams) => void
        > | null = null;

        const context = { name: 'crosshair-handler' };

        chart.onChartReady(() => {
            crosshairSubscription = chart.activeChart().crossHairMoved();

            chart.subscribe('mouse_down', callbackMouseDown);
            chart.subscribe('mouse_up', callbackMouseUp);

            if (crosshairSubscription)
                crosshairSubscription.subscribe(context, callbackCrosshair);
        });

        const { iframeDoc, paneCanvas } = getPaneCanvasAndIFrameDoc(chart);

        const dpr = window.devicePixelRatio || 1;

        if (!iframeDoc || !paneCanvas || !paneCanvas.parentNode) return;

        if (!document.getElementById('iqLine-tooltip-wrapper')) {
            const wrapper = iframeDoc.createElement('div');
            wrapper.style.position = 'absolute';
            wrapper.style.width = paneCanvas.width / dpr + 'px';
            wrapper.style.height = paneCanvas.height / dpr + 'px';
            wrapper.style.pointerEvents = 'none';
            wrapper.style.zIndex = '6';
            wrapper.style.top = '0';
            wrapper.style.left = '0';
            wrapper.id = 'liqLine-tooltip-wrapper';

            paneCanvas.parentNode.appendChild(wrapper);

            iframeDoc.addEventListener('mouseleave', () => {
                onMouseLeave();
            });

            iframeDoc.addEventListener('mouseenter', () => {
                shouldOpenTooltip.current = true;
            });

            window.addEventListener('orderLineDragStart', () => {
                onMouseLeave();
            });

            window.addEventListener('orderLineDragEnd', () => {
                shouldOpenTooltip.current = true;
            });

            if (d3.select(wrapper).select('.liqLineTooltip').empty()) {
                const liqLineTooltip = d3
                    .select(wrapper)
                    .append('div')
                    .attr('class', 'liqLineTooltip')
                    .style('z-index', '999999')
                    .style('position', 'fixed')
                    .style('text-align', 'start')
                    .style('align-items', 'start')
                    .style('padding', '10px 14px')
                    .style('line-height', '1.4')
                    .style('font-size', '16px')
                    .style('pointer-events', 'none')
                    .style('background', 'var(--bg-dark2, #111117)')
                    .style('border-radius', 'var(--radius-s, 6px)')
                    .style('border', '1px solid var(--bg-dark6, #3e3e42)')
                    .style('min-width', '150px')
                    .style('visibility', 'hidden');

                liqLineTooltipRef.current = liqLineTooltip;
            }
        }

        return () => {
            if (liqLineTooltipRef.current) {
                liqLineTooltipRef.current.remove();
                liqLineTooltipRef.current = null;
            }

            if (chart) {
                try {
                    if (crosshairSubscription) {
                        crosshairSubscription.unsubscribe(
                            context,
                            callbackCrosshair,
                        );
                        crosshairSubscription = null;
                    }

                    chart.unsubscribe('mouse_down', callbackMouseDown);
                    chart.unsubscribe('mouse_up', callbackMouseUp);

                    // eslint-disable-next-line @typescript-eslint/no-unused-vars

                    iframeDoc.removeEventListener('mouseleave', onMouseLeave);
                    iframeDoc.removeEventListener('mouseenter', () => {
                        shouldOpenTooltip.current = true;
                    });
                    window.removeEventListener(
                        'orderLineDragStart',
                        onMouseLeave,
                    );
                    window.removeEventListener('orderLineDragEnd', () => {
                        shouldOpenTooltip.current = true;
                    });
                } catch (error: unknown) {
                    // console.error({ error });
                }
            }
        };
    }, [
        chart,
        overlayCanvasRef.current === null,
        canvasWrapperRef.current === null,
        activeDecimalSeparator,
        activeGroupSeparator,
        formatNum,
        scaleData,
    ]);

    return null;
};

export default LiqLineTooltip;
