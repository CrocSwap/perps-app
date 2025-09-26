import { useCallback, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { LiqProps } from './LiqComponent';
import { useTradingView } from '~/contexts/TradingviewContext';
import { useLiqudationLines } from './hooks/useLiquidationLines';
import { getPaneCanvasAndIFrameDoc } from '../overlayCanvas/overlayCanvasUtils';
import useNumFormatter from '~/hooks/useNumFormatter';
import { useAppSettings } from '~/stores/AppSettingsStore';
import type {
    CrossHairMovedEventParams,
    ISubscription,
} from '~/tv/charting_library';

const LiqLineTooltip = ({
    overlayCanvasRef,
    canvasWrapperRef,
    canvasSize,
    scaleData,
    zoomChanged,
}: LiqProps) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const liqLineTooltipRef = useRef<any>(null);

    const { chart } = useTradingView();

    const lines = useLiqudationLines();

    const linesRef = useRef(lines);

    const { getBsColor } = useAppSettings();

    const { formatNum } = useNumFormatter();

    useEffect(() => {
        linesRef.current = lines;
    }, [lines]);

    const checkLines = useCallback(
        (offsetX: number, offsetY: number) => {
            if (!linesRef.current?.length || !scaleData?.yScale) return null;
            const dpr = window.devicePixelRatio || 1;

            const tolerance = 10; // pixels

            for (const line of linesRef.current) {
                const y = scaleData.yScale(line.yPrice);
                const localOffsetY = offsetY * dpr;
                if (Math.abs(y - localOffsetY) <= tolerance) {
                    return line;
                }
            }

            return null;
        },
        [scaleData, linesRef],
    );

    const mousemove = useCallback(
        (offsetX: number, offsetY: number) => {
            // Fill and place tooltip
            if (!liqLineTooltipRef.current) return;
            if (!scaleData || !scaleData.yScale) return;
            if (chart === null) return;

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
                    placedLine.type === 'buy' ? 'Long ' : 'Short '
                } Liquidations </p>` +
                    `<p style="color:${placedLine.type === 'buy' ? buyColor : sellColor}"> Price: ${formatNum(placedLine?.yPrice, null, true)} </p>` +
                    `<p style="color: var(--text2, #bcbcc4)"> Volume: 1,23 TKN </p>`,
            );

            const width = liqLineTooltipRef.current
                .node()
                .getBoundingClientRect().width;

            const height = liqLineTooltipRef.current
                .node()
                .getBoundingClientRect().height;

            const horizontal =
                cssOffsetX + width + 10 > rect.right - rect.left
                    ? cssOffsetX - width - 10
                    : cssOffsetX + 10;

            const vertical =
                cssOffsetY + height > rect.bottom - rect.top
                    ? cssOffsetY - height
                    : cssOffsetY;

            liqLineTooltipRef.current
                .style('visibility', 'visible')
                .style('top', vertical + 'px')
                .style('left', horizontal + 'px');
        },
        [scaleData, linesRef],
    );

    useEffect(() => {
        if (!overlayCanvasRef.current || !canvasWrapperRef.current) return;

        let subscription: ISubscription<
            (params: CrossHairMovedEventParams) => void
        > | null = null;

        const context = { name: 'crosshair-handler' };

        const callbackCrosshair = (params: CrossHairMovedEventParams) => {
            const { offsetX, offsetY } = params;
            if (offsetX && offsetY) {
                mousemove(offsetX, offsetY);
            }
        };

        if (chart) {
            chart.onChartReady(() => {
                subscription = chart.activeChart().crossHairMoved();

                subscription.subscribe(context, callbackCrosshair);
            });
        }

        if (
            d3
                .select(canvasWrapperRef.current)
                .select('.liqLineTooltip')
                .empty()
        ) {
            const liqLineTooltip = d3
                .select(canvasWrapperRef.current)
                .append('div')
                .attr('class', 'liqLineTooltip')
                .style('z-index', '10')
                .style('position', 'absolute')
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

        return () => {
            if (liqLineTooltipRef.current) {
                liqLineTooltipRef.current.remove();
                liqLineTooltipRef.current = null;
            }

            if (chart) {
                try {
                    if (subscription) {
                        subscription.unsubscribe(context, callbackCrosshair);
                        subscription = null;
                    }

                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                } catch (error: unknown) {
                    // console.error({ error });
                }
            }
        };
    }, [
        chart,
        overlayCanvasRef.current === null,
        canvasWrapperRef.current === null,
    ]);

    return null;
};

export default LiqLineTooltip;
