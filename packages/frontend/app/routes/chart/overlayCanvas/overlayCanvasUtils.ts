import type { IChartingLibraryWidget, IPaneApi } from '~/tv/charting_library';
import type { LineData } from '../orders/component/LineComponent';
import type { LabelLocation } from '../orders/orderLineUtils';

export type LabelLocationData = {
    label: LabelLocation | undefined;
    parentLine: LineData;
};

export const mousePositionRef = { current: { x: 0, y: 0 } };
export type CanvasSize = {
    width: number;
    height: number;
};
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
    // dpr: number,
    rect: DOMRect,
) {
    // let evtY;
    // let evtX;

    // let retY = 0;
    // let retX = 0;

    // // BACKUP : LIQUIDATION

    // //if (
    // //    typeof TouchEvent !== 'undefined' &&
    // //    event.sourceEvent instanceof TouchEvent
    // //) {
    // //  offsetY = event.sourceEvent.touches[0].clientY * dpr;
    // // offsetX = event.sourceEvent.touches[0].clientX * dpr;
    // //}

    // if (event.sourceEvent.touches && event.sourceEvent.touches.length > 0) {
    //     evtY = event.sourceEvent.touches[0].clientY * dpr;
    //     evtX = event.sourceEvent.touches[0].clientX * dpr;

    //     console.log('>>>> evtY', evtY);
    //     console.log('>>>> evtX', evtX);
    // } else if (event.x && event.y) {
    //     evtY = event.y * dpr;
    //     evtX = event.x * dpr;
    //     console.log('>>>> evtY 2', evtY);
    //     console.log('>>>> evtX 2', evtX);
    //     console.log('>>>> rect.top', rect.top);
    //     console.log('>>>> rect.left', rect.left);
    // }

    // if (evtY && evtX) {
    //     retY = evtY - rect.top;
    //     retX = evtX - rect.left;
    // }

    // return { offsetX: retX, offsetY: retY };

    let offsetY = event.sourceEvent.clientY - rect?.top;
    let offsetX = event.sourceEvent.clientX - rect?.left;

    if (event.sourceEvent.touches && event.sourceEvent.touches.length > 0) {
        offsetY = event.sourceEvent.touches[0].clientY - rect.top;
        offsetX = event.sourceEvent.touches[0].clientX - rect?.left;
    }

    // return { offsetX, offsetY };
    const dpr = window.devicePixelRatio || 1;
    return { offsetX: offsetX * dpr, offsetY: offsetY * dpr };
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
    sizeReferenceCanvas: HTMLCanvasElement | null;
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
            sizeReferenceCanvas: null,
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
            sizeReferenceCanvas: null,
            priceAxisContainers: null,
        };
    }

    // Find the container that has width > 0 (active price scale position)
    const activeContainer = priceAxisContainers.find((container) => {
        const rect = container.getBoundingClientRect();
        return rect.width > 0;
    });

    let yAxisCanvas: HTMLCanvasElement | null = null;
    let sizeReferenceCanvas: HTMLCanvasElement | null = null;

    if (activeContainer) {
        // Find the price-axis div within the active container
        const priceAxisDiv =
            activeContainer.querySelector<HTMLDivElement>('div.price-axis');
        if (priceAxisDiv) {
            const priceAxisRect = priceAxisDiv.getBoundingClientRect();
            const canvases =
                priceAxisDiv.querySelectorAll<HTMLCanvasElement>('canvas');

            // Find canvas with highest z-index for overlay parent
            let maxZIndex = -1;
            for (const canvas of canvases) {
                const zIndex = parseInt(canvas.style.zIndex) || 0;
                if (zIndex > maxZIndex) {
                    maxZIndex = zIndex;
                    yAxisCanvas = canvas;
                }
            }

            // Find canvas that matches price-axis dimensions for size reference
            for (const canvas of canvases) {
                const canvasStyleWidth = parseFloat(canvas.style.width) || 0;
                const canvasStyleHeight = parseFloat(canvas.style.height) || 0;

                if (
                    Math.abs(canvasStyleWidth - priceAxisRect.width) < 1 &&
                    Math.abs(canvasStyleHeight - priceAxisRect.height) < 1
                ) {
                    sizeReferenceCanvas = canvas;
                    break;
                }
            }
        }
    }

    return {
        iframeDoc,
        yAxisCanvas: yAxisCanvas ?? null,
        sizeReferenceCanvas: sizeReferenceCanvas ?? null,
        priceAxisContainers:
            priceAxisContainers.length > 0 ? priceAxisContainers : null,
    };
}

export const updateOverlayCanvasSize = (
    canvas: HTMLCanvasElement,
    canvasSize: CanvasSize,
) => {
    const dpr = window.devicePixelRatio || 1;

    const width = canvasSize.width;
    const height = canvasSize.height;

    canvas.width = width;
    canvas.style.width = `${width / dpr}px`;

    canvas.height = height;
    canvas.style.height = `${height / dpr}px`;
};
