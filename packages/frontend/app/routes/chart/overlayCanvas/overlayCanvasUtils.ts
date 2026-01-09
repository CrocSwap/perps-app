import type { IChartingLibraryWidget, IPaneApi } from '~/tv/charting_library';
import type { LineData } from '../orders/component/LineComponent';
import type { LabelLocation } from '../orders/orderLineUtils';

export type LabelLocationData = {
    label: LabelLocation | undefined;
    parentLine: LineData;
};

export const mousePositionRef = { current: { x: 0, y: 0 } };

export function findLimitLabelAtPosition(
    x: number,
    y: number,
    drawnLabels: LineData[],
): {
    label: LabelLocation | undefined;
    parentLine: LineData;
    matchType: 'onLabel' | 'onLine';
} | null {
    let yMathcLineLoc = undefined;
    let yMathcParentLine = undefined;

    for (let i = drawnLabels.length - 1; i >= 0; i--) {
        const labelLocs = drawnLabels[i].labelLocations;
        if (!labelLocs) continue;

        for (const loc of labelLocs) {
            const startX = loc.x;
            const endX = loc.x + loc.width;
            const startY = loc.y;
            const endY = loc.y + loc?.height;

            if (x >= startX && x <= endX && y >= startY && y <= endY) {
                return {
                    label: loc,
                    parentLine: drawnLabels[i],
                    matchType: 'onLabel',
                };
            }

            if (y >= startY && y <= endY) {
                yMathcLineLoc = loc;
                yMathcParentLine = drawnLabels[i];
            }
        }
    }
    if (yMathcLineLoc && yMathcParentLine) {
        return {
            label: undefined,
            parentLine: yMathcParentLine,
            matchType: 'onLine',
        };
    }
    return null;
}
export function getXandYLocationForChartDrag(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    event: any,
    rect: DOMRect,
) {
    let offsetY = event.sourceEvent.clientY - rect?.top;
    let offsetX = event.sourceEvent.clientX - rect?.left;

    if (event.sourceEvent.touches && event.sourceEvent.touches.length > 0) {
        offsetY = event.sourceEvent.touches[0].clientY - rect.top;
        offsetX = event.sourceEvent.touches[0].clientX - rect?.left;
    }

    return { offsetX: offsetX, offsetY: offsetY };
}

export const getPixelToPrice = (
    chart: IChartingLibraryWidget,
    yPixel: number,
    chartHeight?: number,
): number | null => {
    const dpr = window.devicePixelRatio || 1;
    const textHeight = 15 * dpr;

    const paneIndex = getMainSeriesPaneIndex(chart);
    if (paneIndex === null) return null;
    const priceScalePane = chart.activeChart().getPanes()[
        paneIndex
    ] as IPaneApi;
    const priceScale = priceScalePane.getMainSourcePriceScale();

    if (!priceScale) return null;

    const priceRange = priceScale.getVisiblePriceRange();
    const chartHeightTemp = chartHeight
        ? chartHeight
        : priceScalePane.getHeight();

    if (!priceRange) return null;

    const maxPrice = priceRange.to;
    const minPrice = priceRange.from;
    const isLogarithmic = priceScale.getMode() === 1;

    const adjustedYPixel = chartHeightTemp - yPixel - textHeight / 2;

    if (isLogarithmic) {
        if (minPrice > 0) {
            const logMinPrice = Math.log(minPrice);
            const logMaxPrice = Math.log(maxPrice);

            const priceDifference = logMaxPrice - logMinPrice;
            const ratio = adjustedYPixel / chartHeightTemp;
            const logPrice = ratio * priceDifference + logMinPrice;

            return Math.exp(logPrice);
        } else {
            const logMaxPrice = Math.log(maxPrice);
            const upperHeight =
                (logMaxPrice * chartHeightTemp) /
                (logMaxPrice + Math.abs(minPrice));

            const minHeight = chartHeightTemp - upperHeight;
            const pixel0 = minHeight - adjustedYPixel;

            const ratio = pixel0 / upperHeight;
            const logPrice = ratio * logMaxPrice;

            return Math.exp(logPrice);
        }
    } else {
        const priceDifference = maxPrice - minPrice;
        const ratio = adjustedYPixel / chartHeightTemp;
        const price = ratio * priceDifference + minPrice;

        return price;
    }
};

export function getMainSeriesPaneIndex(
    chart: IChartingLibraryWidget,
): number | null {
    const panes = chart.activeChart().getPanes();
    for (const pane of panes) {
        if (pane.hasMainSeries()) {
            return pane.paneIndex();
        }
    }
    return null;
}
export function getPaneCanvasAndIFrameDoc(chart: IChartingLibraryWidget): {
    iframeDoc: Document | null;
    paneCanvas: HTMLCanvasElement | null;
} {
    const chartDiv = document.getElementById('tv_chart');
    const iframe = chartDiv?.querySelector('iframe') as HTMLIFrameElement;
    const iframeDoc =
        iframe?.contentDocument || iframe?.contentWindow?.document;

    if (!iframeDoc) {
        return { iframeDoc: null, paneCanvas: null };
    }

    const paneCanvases = iframeDoc.querySelectorAll<HTMLCanvasElement>(
        'canvas[data-name="pane-canvas"]',
    );

    const paneIndex = getMainSeriesPaneIndex(chart);
    if (paneIndex === null || paneIndex === undefined) {
        return { iframeDoc, paneCanvas: null };
    }

    return {
        iframeDoc,
        paneCanvas: paneCanvases[paneIndex] ?? null,
    };
}

export function getPriceAxisContainer(chart: IChartingLibraryWidget): {
    iframeDoc: Document | null;
    yAxisCanvas: HTMLCanvasElement | null;
    priceAxisContainers: HTMLElement[] | null;
} {
    const chartDiv = document.getElementById('tv_chart');
    const iframe = chartDiv?.querySelector('iframe') as HTMLIFrameElement;
    const iframeDoc =
        iframe?.contentDocument || iframe?.contentWindow?.document;

    if (!iframeDoc) {
        return {
            iframeDoc: null,
            yAxisCanvas: null,
            priceAxisContainers: null,
        };
    }

    const priceAxisContainers = Array.from(
        iframeDoc.querySelectorAll<HTMLElement>(
            '.chart-markup-table.price-axis-container',
        ),
    );

    const paneIndex = getMainSeriesPaneIndex(chart);
    if (paneIndex === null || paneIndex === undefined) {
        return {
            iframeDoc,
            yAxisCanvas: null,
            priceAxisContainers: null,
        };
    }

    // Find the container that has width > 0 (active price scale position)
    const activeContainer = priceAxisContainers.find((container) => {
        const rect = container.getBoundingClientRect();
        return rect.width > 0;
    });

    let yAxisCanvas: HTMLCanvasElement | null = null;

    if (activeContainer) {
        // Find the price-axis div within the active container
        const priceAxisDiv =
            activeContainer.querySelector<HTMLDivElement>('div.price-axis');
        if (priceAxisDiv) {
            const canvases =
                priceAxisDiv.querySelectorAll<HTMLCanvasElement>('canvas');
            yAxisCanvas = canvases.length > 1 ? canvases[1] : null;
        }
    }

    return {
        iframeDoc,
        yAxisCanvas: yAxisCanvas ?? null,
        priceAxisContainers:
            priceAxisContainers.length > 0 ? priceAxisContainers : null,
    };
}
