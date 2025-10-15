import { bsColorSets, type colorSetIF } from '~/stores/AppSettingsStore';
import type { ResolutionString } from '~/tv/charting_library';

import type {
    ColorGradient,
    CustomThemeColors,
    CustomThemes,
    LibrarySymbolInfo,
} from '~/tv/charting_library';

export type ChartLayout = {
    chartLayout: object;
    interval: string;
};
export const mapResolutionToInterval = (resolution: string): string => {
    const mapping: Record<string, string> = {
        '1': '1m',
        '3': '3m',
        '5': '5m',
        '15': '15m',
        '30': '30m',
        '60': '1h',
        '120': '2h',
        '240': '4h',
        '360': '6h',
        '480': '8h',
        '720': '12h',
        D: '1d',
        W: '1w',
        M: '1M',
    };
    return mapping[resolution] || '1d';
};

export const convertResolutionToIntervalParam = (
    resolution: string,
): string => {
    if (!resolution || resolution.length === 0) return '1d';
    if (resolution === '1W') return '1w';
    if (resolution === '1M') return '1M';
    else if (resolution.indexOf('D') > -1) {
        return resolution.toLowerCase();
    }

    const minutesVal = Number(resolution.replace(/[^0-9]/g, ''));

    if (minutesVal >= 60) {
        return `${minutesVal / 60}h`;
    }

    if (minutesVal >= 1) {
        return `${minutesVal}m`;
    }

    return resolution;
};

export function resolutionToSeconds(resolution: string): number {
    if (resolution === '1D') return 86400;
    if (resolution === '3D') return 3 * 86400;
    if (resolution === 'W') return 604800;
    if (resolution === 'M') return 2592000;

    return Number(resolution);
}

export function resolutionToSecondsMiliSeconds(resolution: string): number {
    if (resolution === '1D') return 86400000;
    if (resolution === '3D') return 3 * 86400000;
    if (resolution === '1W') return 604800000;
    if (resolution === '1M') return 2629746000;

    return Number(resolution) * 60 * 1000;
}

const calculatePrecision = (price: number) => {
    return (
        Math.max(
            5 -
                Math.floor(
                    Math.log10(Math.abs(parseInt(price.toString())) + 1),
                ),
            0,
        ) - 1
    );
};

export const priceFormatterFactory = (
    symbolInfo: LibrarySymbolInfo | null,
    minTick: string,
) => {
    if (minTick === 'default') {
        return {
            format: (price: number) => {
                const precision = calculatePrecision(price);

                const precisionOver = price < 1 ? precision + 1 : precision;

                return price.toFixed(precision > 0 ? precisionOver : 0);
            },
        };
    } else {
        const userPrecision = minTick.split(',')[0];

        return {
            format: (price: number) =>
                price.toFixed(Math.log10(Number(userPrecision))),
        };
    }
};

export function getChartThemeColors(): colorSetIF | undefined {
    const visualSettings = localStorage.getItem('VISUAL_SETTINGS');

    const parsedVisualSettings = visualSettings
        ? JSON.parse(visualSettings)
        : null;

    if (parsedVisualSettings?.state?.bsColor) {
        return bsColorSets[parsedVisualSettings.state.bsColor];
    }

    return undefined;
}

export function getChartDefaultColors(): string[] | undefined {
    // object literal with all user-created candle customizations
    const mainSeriesProperties = JSON.parse(
        localStorage.getItem(
            'tradingview.chartproperties.mainSeriesProperties',
        ) || '{}',
    );
    const candleStyle = mainSeriesProperties?.candleStyle || {};
    // array of color codes from candle properties we care about
    const activeColors: string[] | undefined = candleStyle
        ? [
              candleStyle.upColor,
              candleStyle.downColor,
              candleStyle.borderUpColor,
              candleStyle.borderDownColor,
              candleStyle.wickUpColor,
              candleStyle.wickDownColor,
          ]
        : undefined;

    return activeColors;
}

export function checkDefaultColors(): boolean {
    const activeColors = getChartDefaultColors();

    // determine if any of the candles have a color chosen through
    // ... the trading view color customization workflow (custom
    // ...  colors are always formatted as `rgba`)
    const isCustomized: boolean = activeColors
        ? activeColors.some((c: string) => c?.startsWith('rgba'))
        : false;
    // apply color scheme to chart ONLY if no custom colors are
    // ... found in the active colors array

    return isCustomized;
}

export const supportedResolutions = [
    '1',
    '3',
    '5',
    '15',
    '30',
    '60',
    '120',
    '240',
    '480',
    '720',
    '1D',
    '3D',
    '1W',
    '1M',
] as ResolutionString[];

function rgbaFromHex(value: string) {
    const rgba = {
        r: parseInt(value.slice(1, 3), 16),
        g: parseInt(value.slice(3, 5), 16),
        b: parseInt(value.slice(5, 8), 16),
        a: 1,
    };

    return rgba;
}

export function interpolate(fromHexString: string, toHexString: string) {
    const fromRgba = rgbaFromHex(fromHexString);
    const toRgba = rgbaFromHex(toHexString);
    const numberOfSteps = 12;
    const results = [];
    const step = 1 / numberOfSteps;

    for (let t = step; t < 1 - step; t += step) {
        const r = Math.round(fromRgba.r + (toRgba.r - fromRgba.r) * t)
            .toString(16)
            .padStart(2, '0');
        const g = Math.round(fromRgba.g + (toRgba.g - fromRgba.g) * t)
            .toString(16)
            .padStart(2, '0');
        const b = Math.round(fromRgba.b + (toRgba.b - fromRgba.b) * t)
            .toString(16)
            .padStart(2, '0');

        results.push('#' + r + g + b);
    }

    return results;
}

const defaultChartColors = [
    '#7371FC',
    '#626060',
    '#F23645',
    '#089981',
    '#FF9800',
    '#9c27b0',
    '#ffeb3b',
];

export function customThemes() {
    const colorGradeArr: Array<ColorGradient> = [];

    defaultChartColors.forEach((color) => {
        const lighterColors = interpolate('#ffffff', color);
        const darkerColors = interpolate(color, '#000000');

        if (color === '#7371FC') {
            const perpColorGrades = ['rgba(115, 113, 252, 0.3)'];

            for (let i = 0; i < 18; i++) {
                perpColorGrades.push('#7371FC');
            }
            colorGradeArr.push(perpColorGrades as ColorGradient);
        } else {
            const colorGrades = [
                ...lighterColors,
                ...darkerColors.slice(0, -1),
            ] as ColorGradient;
            colorGradeArr.push(colorGrades);
        }
    });

    const lightTheme: CustomThemeColors = {
        color1: colorGradeArr[0],
        color2: colorGradeArr[1],
        color3: colorGradeArr[2],
        color4: colorGradeArr[3],
        color5: colorGradeArr[4],
        color6: colorGradeArr[5],
        color7: colorGradeArr[6],
        white: '#ffffff',
        black: '#000000',
    };

    const darkTheme: CustomThemeColors = {
        color1: colorGradeArr[0],
        color2: colorGradeArr[1],
        color3: colorGradeArr[2],
        color4: colorGradeArr[3],
        color5: colorGradeArr[4],
        color6: colorGradeArr[5],
        color7: colorGradeArr[6],
        white: '#ffffff',
        black: '#000000',
    };

    return {
        light: lightTheme,
        dark: darkTheme,
    } as CustomThemes;
}

function hexToRgba(hex: string, alpha = 1) {
    hex = hex.replace(/^#/, '');

    if (hex.length === 3) {
        hex = hex
            .split('')
            .map((c) => c + c)
            .join('');
    }

    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function defaultDrawingToolColors() {
    const accentColor = getComputedStyle(
        document.documentElement,
    ).getPropertyValue('--accent1');

    const accentColorHover = hexToRgba(accentColor, 0.3);

    return {
        'scalesProperties.axisHighlightColor': accentColorHover,
        'linetoolarrowmarker.backgroundColor': accentColorHover,
        'scalesProperties.axisLineToolLabelBackgroundColorActive': accentColor,
        'scalesProperties.axisLineToolLabelBackgroundColorCommon': accentColor,
        'linetooltrendline.linecolor': accentColor,
        'linetoolray.linecolor': accentColor,
        'linetoolray.textcolor': accentColor,
        'linetoolextended.linecolor': accentColor,
        'linetool5pointspattern.color': accentColor,
        'linetoolabcd.color': accentColor,
        'linetoolarc.color': accentColor,
        'linetoolarrow.linecolor': accentColor,
        'linetoolarrowmarkdown.color': accentColor,
        'linetoolcomment.backgroundColor': accentColor,
        'linetoolcomment.borderColor': accentColor,
        'linetoolcrossline.linecolor': accentColor,
        'linetoolcypherpattern.backgroundColor': accentColor,
        'linetoolcypherpattern.color': accentColor,
        'linetoolextended.textcolor': accentColor,
        'linetool5pointspattern.backgroundColor': accentColor,
        'linetoolhorzline.linecolor': accentColor,
        'linetoolhorzline.textcolor': accentColor,
        'linetoolhorzray.linecolor': accentColor,
        'linetoolhorzray.textcolor': accentColor,
        'linetoolicon.color': accentColor,
        'linetoolinfoline.linecolor': accentColor,
        'linetoolinfoline.textcolor': accentColor,
        'linetoolpath.lineColor': accentColor,
        'linetoolprediction.linecolor': accentColor,
        'linetoolprediction.linewidth': accentColor,
        'linetoolprediction.sourceBackColor': accentColor,
        'linetoolprediction.sourceStrokeColor': accentColor,
        'linetoolprediction.targetBackColor': accentColor,
        'linetoolprediction.targetStrokeColor': accentColor,
        'linetoolpricelabel.backgroundColor': accentColor,
        'linetoolpricelabel.borderColor': accentColor,
        'linetoolsignpost.plateColor': accentColor,
        'linetooltext.color': accentColor,
        'linetooltextabsolute.color': accentColor,
        'linetooltrendangle.linecolor': accentColor,
        'linetooltrendline.textcolor': accentColor,
        'linetoolvertline.linecolor': accentColor,
        'linetoolvertline.textcolor': accentColor,
        'controlPoint.color': accentColor,
        'controlPoint.hoverColor': accentColorHover,
    };
}

export const getLiquidationsSvgIcon = (color: string) => `
    <svg width="24px" height="24px" viewBox="-2.4 -2.4 28.80 28.80" fill="none" xmlns="http://www.w3.org/2000/svg" transform="rotate(0)" stroke="${color}" stroke-width="0.00024000000000000003">
    <g id="SVGRepo_bgCarrier" stroke-width="0"/>
    <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round" stroke="${color}" stroke-width="0.048"/>
    <g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M12 0.827576L12.8878 2.53967C14.1035 4.88434 15.5212 6.51667 16.8024 7.99192C16.9893 8.20708 17.1733 8.41891 17.3533 8.62911C18.7331 10.2403 20 11.8793 20 14.1696C20 18.5172 16.395 22 12 22C7.60499 22 4 18.5172 4 14.1696C4 11.8793 5.26687 10.2403 6.64671 8.62911C6.82673 8.41891 7.0107 8.20708 7.19757 7.99191C8.47882 6.51667 9.89649 4.88434 11.1122 2.53967L12 0.827576ZM8.16579 9.93003C6.7748 11.5543 6 12.6877 6 14.1696C6 17.3667 8.66302 20 12 20C15.337 20 18 17.3667 18 14.1696C18 12.6877 17.2252 11.5543 15.8342 9.93003C15.664 9.73133 15.4862 9.5269 15.3024 9.31552C14.2961 8.15864 13.1087 6.79342 12 5.0167C10.8913 6.79342 9.70387 8.15864 8.69763 9.31552C8.51377 9.5269 8.33596 9.73133 8.16579 9.93003Z" fill="${color}"/> </g>
    </svg>
`;

export function mapI18nToTvLocale(lang: string): string {
    const short = lang.split('-')[0];
    const supported = [
        'en',
        'tr',
        'de',
        'fr',
        'es',
        'it',
        'ru',
        'zh',
        'ja',
        'ko',
        'pt',
        'pl',
        'vi',
        'th',
        'ar',
        'he',
        'id',
        'ms',
        'fa',
        'hi',
    ];
    return supported.includes(short) ? short : 'en';
}
