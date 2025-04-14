import type { IChartingLibraryWidget } from '~/tv/charting_library';

export const buyColor = '#26A69A';
export const sellColor = '#E57373';

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

    return orderLine;
};

export const priceToPixel = (
    minPrice: number,
    maxPrice: number,
    chartHeight: number,
    price: number,
    isLogarithmic: boolean = false,
) => {
    const textHeight = 15;

    if (isLogarithmic) {
        const logMinPrice = Math.log(minPrice);
        const logMaxPrice = Math.log(maxPrice);
        const logPrice = Math.log(price);

        const priceDifference = logMaxPrice - logMinPrice;
        const relativePrice = logPrice - logMinPrice;
        const pixelCoordinate = (relativePrice / priceDifference) * chartHeight;

        return chartHeight - pixelCoordinate - textHeight / 2;
    } else {
        const priceDifference = maxPrice - minPrice;
        const relativePrice = price - minPrice;
        const pixelCoordinate = (relativePrice / priceDifference) * chartHeight;

        return chartHeight - pixelCoordinate - textHeight / 2;
    }
};

export const getAnchoredQuantityTextLocation = (
    chart: IChartingLibraryWidget,
    bufferX: number,
    orderText: string,
) => {
    const timeScale = chart.activeChart().getTimeScale();
    const chartWidth = Math.floor(timeScale.width());

    const wrapWidthPx = orderText.length > 13 ? 105 : 75;

    const offsetX = Number(wrapWidthPx / chartWidth);

    return bufferX + offsetX;
};

export const createAnchoredMainText = async (
    chart: IChartingLibraryWidget,
    xLoc: number,
    yLoc: number,
    text: string,
    borderColor: string,
) => {
    return createAnchoredText(
        chart,
        xLoc,
        yLoc,
        text,
        '#D1D1D1',
        text.toString().length > 13 ? 100 : 70,
        borderColor,
    );
};

export const createQuantityAnchoredText = async (
    chart: IChartingLibraryWidget,
    xLoc: number,
    yLoc: number,
    text: string,
) => {
    return createAnchoredText(
        chart,
        xLoc,
        yLoc,
        text,
        '#000000',
        text.toString().length > 8 ? 70 : 60,
        '#3C91FF',
        '#FFFFFF',
    );
};

export const createAnchoredText = async (
    chart: IChartingLibraryWidget,
    xLoc: number,
    yLoc: number,
    text: string,
    backgroundColor: string,
    wordWrapWidth: number,
    borderColor: string,
    color?: string,
) => {
    const shape = await chart.activeChart().createAnchoredShape(
        {
            x: xLoc,
            y: yLoc,
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
