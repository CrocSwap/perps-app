import type { IChartingLibraryWidget, IPaneApi } from '~/tv/charting_library';

export const buyColor = '#26A69A';
export const sellColor = '#E57373';

export type LineLabelType =
    | 'PNL'
    | 'Limit'
    | 'Take Profit Market'
    | 'Stop Market'
    | 'Stop Limit'
    | 'Liq';
export type LineLabel =
    | { type: 'PNL'; pnl: number }
    | { type: 'Limit'; price: number; triggerCondition: string }
    | {
          type: 'Take Profit Market';
          triggerCondition: string;
          orderType: string;
      }
    | { type: 'Stop Market'; triggerCondition: string; orderType: string }
    | {
          type: 'Stop Limit';
          price: string;
          triggerCondition: string;
          orderType: string;
      }
    | { type: 'Liq'; text: ' Liq. Price' };

export const addCustomOrderLine = async (
    chart: IChartingLibraryWidget,
    orderPrice: number,
    lineColor: string,
) => {
    const orderLine = await chart
        .activeChart()
        .createMultipointShape([{ time: 10, price: orderPrice }], {
            shape: 'horizontal_line',
            lock: true,
            disableSelection: true,
            disableSave: true,
            disableUndo: true,
            overrides: {
                linecolor: lineColor,
                borderColor: lineColor,
                linestyle: 3,
                linewidth: 1,
            },
        });

    chart.activeChart().getShapeById(orderLine).sendToBack();
    return orderLine;
};

export const priceToPixel = (chart: IChartingLibraryWidget, price: number) => {
    const { pixel, chartHeight } = getPricetoPixel(chart, price);

    if (chartHeight) return pixel / chartHeight;

    return 0;
};

export function getDynamicSymlogConstant(
    minPrice: number,
    maxPrice: number,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    scale: any,
): number {
    if (minPrice < scale.domain()[0] || maxPrice > scale.domain()[1]) {
        return 1e300;
    }

    return 0.00001;
}

export const getPricetoPixel = (
    chart: IChartingLibraryWidget,
    price: number,
    chartHeight?: number,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    scaleData?: any,
) => {
    const dpr = window.devicePixelRatio || 1;
    const textHeight = 15 * dpr;
    let pixel = 0;
    const priceScalePane = chart.activeChart().getPanes()[0] as IPaneApi;

    const priceScale = priceScalePane.getMainSourcePriceScale();
    if (priceScale) {
        const priceRange = priceScale.getVisiblePriceRange();

        const chartHeightTemp = chartHeight
            ? chartHeight
            : priceScalePane.getHeight();

        if (!priceRange) return { pixel: 0, chartHeight: 0 };

        const maxPrice = priceRange.to;
        const minPrice = priceRange.from;
        const isLogarithmic = priceScale.getMode() === 1;
        if (isLogarithmic) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { coordOffset } = (priceScale as any)._priceScale._logFormula;
            scaleData.scaleSymlog.constant(coordOffset);
            const logPrice = scaleData.scaleSymlog(price) * dpr;

            pixel = logPrice - textHeight / 2;

            console.log('Price: ' + price + ' -> ' + logPrice);
            console.log('pixel :', pixel);
            console.log('Domain :', minPrice, '-', maxPrice);

            console.log('--------------------------------');
        } else {
            const priceDifference = maxPrice - minPrice;
            const relativePrice = price - minPrice;
            const pixelCoordinate =
                (relativePrice / priceDifference) * chartHeightTemp;

            pixel = chartHeightTemp - pixelCoordinate - textHeight / 2;
        }

        return { pixel: pixel, chartHeight: chartHeightTemp };
    }

    return { pixel: 0, chartHeight: 0 };
};

export function estimateTextWidth(text: string, fontSize: number = 10): number {
    const isMac = navigator.userAgent.includes('Macintosh');
    const charWidthFactor = isMac ? 0.58 : 0.5;

    const avgCharWidth = fontSize * charWidthFactor;
    return text.length * avgCharWidth;
}

export const getAnchoredQuantityTextLocation = (
    chart: IChartingLibraryWidget,
    bufferX: number,
    orderTextValue: LineLabel,
) => {
    const timeScale = chart.activeChart().getTimeScale();
    const chartWidth = Math.floor(timeScale.width());

    const orderText = formatLineLabel(orderTextValue);
    const wrapWidthPx = estimateTextWidth(orderText) + 5;

    const offsetX = Number(wrapWidthPx / chartWidth);

    return bufferX + offsetX;
};

export const getAnchoredCancelButtonTextLocation = (
    chart: IChartingLibraryWidget,
    bufferX: number,
    orderTextValue: LineLabel,
    orderQuantityText?: string,
) => {
    const timeScale = chart.activeChart().getTimeScale();
    const chartWidth = Math.floor(timeScale.width());

    const orderText = formatLineLabel(orderTextValue);
    const wrapWidthPx = estimateTextWidth(orderText) + 5;

    const offsetX = Number(wrapWidthPx / chartWidth);

    const quantityTextWidth = orderQuantityText
        ? Number((estimateTextWidth(orderQuantityText) + 15) / chartWidth)
        : 0;
    return bufferX + offsetX + quantityTextWidth;
};

export const createAnchoredMainText = async (
    chart: IChartingLibraryWidget,
    xLoc: number,
    yPrice: number,
    textValue: LineLabel,
    borderColor: string,
) => {
    const text = formatLineLabel(textValue);
    return createAnchoredText(
        chart,
        xLoc,
        yPrice,
        text,
        '#D1D1D1',
        estimateTextWidth(text),
        borderColor,
    );
};

export const createQuantityAnchoredText = async (
    chart: IChartingLibraryWidget,
    xLoc: number,
    yPrice: number,
    text: string,
) => {
    return createAnchoredText(
        chart,
        xLoc,
        yPrice,
        text,
        '#000000',
        estimateTextWidth(text) + 15,
        '#3C91FF',
        '#FFFFFF',
    );
};

export const createCancelAnchoredText = async (
    chart: IChartingLibraryWidget,
    xLoc: number,
    yPrice: number,
) => {
    return createAnchoredText(
        chart,
        xLoc,
        yPrice,
        ' X ',
        '#D1D1D1',
        12,
        '#3C91FF',
    );
};

export const createAnchoredText = async (
    chart: IChartingLibraryWidget,
    xLoc: number,
    yPrice: number,
    text: string,
    backgroundColor: string,
    wordWrapWidth: number,
    borderColor: string,
    color?: string,
) => {
    const shape = await chart.activeChart().createAnchoredShape(
        {
            x: xLoc,
            y: priceToPixel(chart, yPrice),
        },
        {
            shape: 'anchored_text',
            lock: true,
            disableSelection: true,
            disableSave: true,
            disableUndo: true,
            text: text,
            overrides: {
                fontsize: 10,
                backgroundColor: backgroundColor,
                bold: true,
                fillBackground: true,
                drawBorder: true,
                wordWrap: true,
                wordWrapWidth: wordWrapWidth,
                color: color,
                borderWidth: 3,
                borderColor: borderColor,
                zOrder: 'top',
            },
        },
    );

    chart.activeChart().getShapeById(shape).bringToFront();

    return shape;
};

export const quantityTextFormatWithComma = (value: number): string => {
    const isNegative = value < 0;
    const [integerPart, decimalPart] = Math.abs(value).toString().split('.');

    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    let result = formattedInteger;
    if (decimalPart !== undefined) {
        result += '.' + decimalPart;
    }

    return isNegative ? `-${result}` : result;
};

function getTriggerConditionText(rawText: string, orderType: string): string {
    const match = rawText.match(/Price (above|below) (\d+)/);

    if (!match) return rawText;

    const direction = match[1];
    const price = match[2];
    const operator = direction === 'above' ? '>' : '<';
    let labelPrefix = '';

    if (orderType === 'Take Profit Market') {
        labelPrefix = 'TP';
    }

    if (orderType === 'Stop Market') {
        labelPrefix = 'SL';
    }

    if (orderType === 'Stop Limit') {
        labelPrefix = '';
    }

    return ` ${labelPrefix} Price ${operator} ${price}  `;
}

export function formatLineLabel(label: LineLabel): string {
    switch (label.type) {
        case 'PNL': {
            const pnl = quantityTextFormatWithComma(Math.abs(label.pnl));
            return ' PNL ' + (label.pnl > 0 ? `$${pnl}  ` : `-$${pnl} `);
        }
        case 'Limit':
            return ` Limit ${label.price}  ${label.triggerCondition} `;
        case 'Take Profit Market':
            return getTriggerConditionText(
                label.triggerCondition,
                label.orderType,
            );
        case 'Stop Market':
            return getTriggerConditionText(
                label.triggerCondition,
                label.orderType,
            );
        case 'Stop Limit': {
            const triggerConditionText = getTriggerConditionText(
                label.triggerCondition,
                label.orderType,
            );
            return ` ${label.orderType} ${label.price} ${triggerConditionText}   `;
        }
        case 'Liq':
            return label.text;
        default:
            return '';
    }
}

export function isInsideTextBounds(
    hoverX: number,
    hoverY: number,
    textX: number,
    cancelTextX: number,
    textY: number,
): boolean {
    const estimatedTextsEndLocation = cancelTextX + estimateTextWidth(' X ');
    const estimatedHeight = 10 * 1.1;

    return (
        hoverX >= textX &&
        hoverX <= estimatedTextsEndLocation &&
        hoverY >= textY &&
        hoverY <= textY + estimatedHeight
    );
}

export function isInsideCancelTextBounds(
    clickX: number,
    clickY: number,
    textX: number,
    textY: number,
): boolean {
    const estimatedCancelTextEndLocation = textX + estimateTextWidth(' X ');
    const estimatedHeight = 10 * 1.1;

    return (
        clickX >= textX &&
        clickX <= estimatedCancelTextEndLocation &&
        clickY >= textY &&
        clickY <= textY + estimatedHeight
    );
}
