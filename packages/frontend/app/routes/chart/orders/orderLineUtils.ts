export type LabelType = 'Main' | 'Quantity' | 'Cancel' | 'Confirm';

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

export function drawLabelMobile(
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
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';

    const padding = 4 * dpr;
    const yPadding = padding / 2;

    const labelLocations: LabelLocation[] = [];

    const top = y - yPadding;

    const cancelOption = labelOptions.find((o) => o.type === 'Cancel');

    if (cancelOption) {
        const size = height + yPadding;

        drawTrashIcon(ctx, 0, top, size, cancelOption);

        labelLocations.push({
            type: cancelOption.type,
            x: 0,
            y: top,
            width: size,
            height: size,
        });
    }

    /**
     * LABELS
     */
    let cursorX = x;

    for (const option of labelOptions) {
        if (option.type === 'Cancel') continue;

        const isMain = option.type === 'Main';
        const isConfirm = option.type === 'Confirm';

        const text = isConfirm ? '✓' : option.text;
        const textMetrics = ctx.measureText(text);

        const segmentWidth = isConfirm
            ? height + padding
            : textMetrics.width + padding * 3;

        const labelCenterY = top + (height + yPadding) / 2;

        ctx.fillStyle = option.backgroundColor;
        ctx.fillRect(cursorX, top, segmentWidth, height + yPadding);

        ctx.strokeStyle = option.borderColor;
        ctx.strokeRect(cursorX, top, segmentWidth, height + yPadding);

        if (isMain && isDragable) {
            ctx.fillStyle = color;
            ctx.fillRect(
                cursorX + padding,
                labelCenterY - verticalLineHeight / 2,
                verticalLineWidth,
                verticalLineHeight,
            );
        }

        ctx.fillStyle = option.textColor;
        ctx.fillText(text, cursorX + segmentWidth / 2, labelCenterY);

        labelLocations.push({
            type: option.type,
            x: cursorX,
            y: top,
            width: segmentWidth,
            height: height + yPadding,
        });

        cursorX += segmentWidth;
    }

    ctx.restore();
    return labelLocations;
}

function drawTrashIcon(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    cancelOption: LabelOptions,
) {
    const TRASH_ICON_PATH = new Path2D(
        'M4 7h16M9 7V5h6v2m-1 4v7m-4-7v7M6 7l1 13h10l1-13',
    );

    const padding = size * 0.1;
    const iconSize = size - padding * 2;

    ctx.save();

    ctx.fillStyle = cancelOption.backgroundColor;
    ctx.fillRect(x, y, size, size);

    ctx.strokeStyle = cancelOption.borderColor;
    ctx.strokeRect(x, y, size, size);

    // 🗑 icon
    ctx.translate(x + padding, y + padding);
    ctx.scale(iconSize / 24, iconSize / 24);

    ctx.strokeStyle = cancelOption.textColor;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.stroke(TRASH_ICON_PATH);

    ctx.restore();
}

export function drawLiqLabel(
    ctx: CanvasRenderingContext2D,
    { x, y, color, labelOptions }: DrawSegmentedRectOptions,
    chartWidth: number,
    isLiqPriceLineDraggable: boolean,
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
        const isAddVerticalLine = type === 'Main' && isLiqPriceLineDraggable;

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
