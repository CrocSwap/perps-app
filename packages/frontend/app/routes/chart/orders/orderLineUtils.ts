export type LabelType = 'Main' | 'Quantity' | 'Cancel';

export const LIQ_PRICE_LINE_COLOR = '#DC5E1E';
export const LIQ_PRICE_WARNING_COLOR = '#FFC107';
export const WARNING_ICON_RADIUS = 10;

type LabelOptions = {
    text: string;
    type: LabelType;
    backgroundColor: string;
    textColor: string;
    borderColor: string;
};

type DrawSegmentedRectOptions = {
    x: number;
    y: number;
    color: string;
    labelOptions: LabelOptions[];
};

export type LabelLocation = {
    type: LabelType;
    x: number;
    y: number;
    width: number;
    height: number;
};

export function drawLabel(
    ctx: CanvasRenderingContext2D,
    { x, y, color, labelOptions }: DrawSegmentedRectOptions,
    isDragable: boolean,
) {
    const dpr = window.devicePixelRatio || 1;
    const height = 15 * dpr;

    const verticalLineWidth = 2 * dpr;
    const verticalLineHeight = height / 1.3;

    ctx.save();
    ctx.font = `bold ${10 * dpr}px sans-serif`;
    const padding = 4;
    const yPadding = (padding / 2) * dpr;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    let cursorX = x;
    const labelLocations: LabelLocation[] = [];

    for (let i = 0; i < labelOptions.length; i++) {
        const { text, backgroundColor, textColor, borderColor, type } =
            labelOptions[i];

        const isAddVerticalLine = isDragable && type === 'Main';
        const textMetrics = ctx.measureText(text);
        const textWidth = isAddVerticalLine
            ? textMetrics.width + padding * 2 * dpr
            : textMetrics.width;

        const lineX = x + padding * dpr;

        const top = y - yPadding;
        const bottom = top + height + yPadding;
        const labelCenterY = top + (bottom - top) / 2;

        const lineY = labelCenterY - verticalLineHeight / 2;

        const segmentWidth = textWidth + padding * 3;

        ctx.fillStyle = backgroundColor;
        ctx.fillRect(cursorX, y - yPadding, segmentWidth, height + yPadding);

        ctx.strokeStyle = borderColor;
        ctx.strokeRect(cursorX, y - yPadding, segmentWidth, height + yPadding);

        if (isAddVerticalLine) {
            ctx.fillStyle = color;
            ctx.fillRect(lineX, lineY, verticalLineWidth, verticalLineHeight);
        }

        ctx.fillStyle = textColor;
        ctx.fillText(text, cursorX + segmentWidth / 2, y + height / 2);

        labelLocations.push({
            type,
            x: cursorX,
            y,
            width: segmentWidth,
            height,
        });
        cursorX += segmentWidth;
    }

    ctx.restore();

    return labelLocations;
}

export function drawLiqLabel(
    ctx: CanvasRenderingContext2D,
    { x, y, color, labelOptions }: DrawSegmentedRectOptions,
    chartWidth: number,
) {
    const dpr = window.devicePixelRatio || 1;
    const height = 18 * dpr;

    const verticalLineWidth = 2 * dpr;
    const verticalLineHeight = height / 1.5;

    ctx.save();
    ctx.font = `bold ${11 * dpr}px sans-serif`;
    const padding = 4 * dpr;
    const yPadding = padding / 3;

    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';

    let cursorX = x;
    const labelLocations: LabelLocation[] = [];

    for (let i = 0; i < labelOptions.length; i++) {
        const { text, backgroundColor, type, textColor } = labelOptions[i];
        const isAddVerticalLine = type === 'Main';

        const textMetrics = ctx.measureText(text);
        const textWidth = textMetrics.width;
        const segmentWidth = textWidth + padding * 2 + 15;

        ctx.fillStyle = backgroundColor;
        ctx.fillRect(cursorX, y - yPadding, segmentWidth, height + yPadding);

        ctx.lineWidth = 2;
        ctx.strokeStyle = LIQ_PRICE_LINE_COLOR;
        ctx.strokeRect(cursorX, y - yPadding, segmentWidth, height + yPadding);

        if (type === 'Main') {
            if (isAddVerticalLine) {
                // dragable vertical line
                const lineX = x + padding;
                const top = y - yPadding;
                const bottom = top + height + yPadding;
                const labelCenterY = top + (bottom - top) / 2;

                const lineY = labelCenterY - verticalLineHeight / 2;
                ctx.fillStyle = color;
                ctx.fillRect(
                    lineX,
                    lineY,
                    verticalLineWidth,
                    verticalLineHeight,
                );
            }
            // Liq. Price
            ctx.fillStyle = LIQ_PRICE_LINE_COLOR;
            ctx.fillText(text, cursorX + segmentWidth / 2, y + height / 2);
        }

        if (type === 'Quantity') {
            // Liq Price Value
            ctx.fillStyle = textColor;
            ctx.fillText(text, cursorX + segmentWidth / 2, y + height / 2);
        }
        labelLocations.push({
            type,
            x: cursorX,
            y,
            width: segmentWidth,
            height,
        });
        cursorX += segmentWidth;
    }

    const warningIconTopBuffer = 1 * dpr;
    const warningIconRightBuffer = 15 * dpr;
    const iconY = y + warningIconTopBuffer;
    const iconX = chartWidth - warningIconRightBuffer;
    const radius = WARNING_ICON_RADIUS * dpr;
    const strokeCircleRADIUS = WARNING_ICON_RADIUS + 2 * dpr;

    // Warning Icon
    ctx.beginPath();
    ctx.arc(iconX, y + height / 2, strokeCircleRADIUS, 0, 2 * Math.PI);
    ctx.fillStyle = 'black';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(iconX, y + height / 2, radius, 0, 2 * Math.PI);
    ctx.fillStyle = LIQ_PRICE_WARNING_COLOR;
    ctx.fill();

    // !
    ctx.font = `bold ${15 * dpr}px sans-serif`;
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('!', iconX, iconY + height / 2);

    ctx.restore();

    return labelLocations;
}
