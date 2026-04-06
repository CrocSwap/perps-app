import * as d3 from 'd3';
import { useEffect, useRef } from 'react';

interface OrderLinesLabelTooltipProps {
    overlayCanvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
    canvasWrapperRef: React.MutableRefObject<HTMLDivElement | null>;
}

export default function orderLinesLabelTooltip({
    overlayCanvasRef,
    canvasWrapperRef,
}: OrderLinesLabelTooltipProps) {
    // const labelTooltipRef = useRef<any>(null);

    if (!overlayCanvasRef.current || !canvasWrapperRef.current) return;

    if (d3.select(canvasWrapperRef.current).select('.labelTooltip').empty()) {
        const labelTooltip = d3
            .select(canvasWrapperRef.current)
            .append('div')
            .attr('class', 'labelTooltip')
            .style('z-index', '10')
            .style('position', 'absolute')
            .style('text-align', 'center')
            .style('align-items', 'center')
            .style('padding', '5px 7px')
            .style('line-height', '1')
            .style('font-size', '12px')
            .style('pointer-events', 'none')
            .style('background', 'var(--bg-dark4, #27272c)')
            .style('border-radius', 'var(--radius-s, 6px)')
            .style('border', '1px solid var(--bg-dark6, #3e3e42)')
            .style('visibility', 'hidden');

        labelTooltip.html(
            `<p style="color:var(--text3, #88888f)"> Hold to drag </p>`,
        );

        return labelTooltip;
    }
}
