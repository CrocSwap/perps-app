import type { DetailedHTMLProps, HTMLAttributes } from 'react';
import { bsColorSets, type colorSetIF } from '~/stores/AppSettingsStore';
import type { ResolutionString } from '~/tv/charting_library';

import type {
    ColorGradient,
    CustomThemeColors,
    CustomThemes,
    LibrarySymbolInfo,
} from '~/tv/charting_library';

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace JSX {
        interface IntrinsicElements {
            'd3fc-group': DetailedHTMLProps<
                HTMLAttributes<HTMLDivElement>,
                HTMLDivElement
            >;
            'd3fc-svg': DetailedHTMLProps<
                HTMLAttributes<HTMLDivElement>,
                HTMLDivElement
            >;
            'd3fc-canvas': DetailedHTMLProps<
                HTMLAttributes<HTMLCanvasElement | HTMLDivElement>,
                HTMLCanvasElement | HTMLDivElement
            >;
        }
    }
}

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
    if (!resolution) return 60;

    if (resolution === '1D' || resolution === 'D') return 86400;
    if (resolution === '3D') return 3 * 86400;
    if (resolution === '1W' || resolution === 'W') return 604800;
    if (resolution === '1M' || resolution === 'M') return 2592000;

    const minutesVal = Number(resolution);

    if (!Number.isFinite(minutesVal) || minutesVal <= 0) {
        return 60;
    }

    return minutesVal * 60;
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

export const CustomToolbarBtnIcons = {
    settings: `<svg xmlns="http://www.w3.org/2000/svg" fill="#cbcaca" x="0px" y="0px" width="50" height="50" viewBox="0 0 50 50"> <path d="M 22.205078 2 A 1.0001 1.0001 0 0 0 21.21875 2.8378906 L 20.246094 8.7929688 C 19.076509 9.1331971 17.961243 9.5922728 16.910156 10.164062 L 11.996094 6.6542969 A 1.0001 1.0001 0 0 0 10.708984 6.7597656 L 6.8183594 10.646484 A 1.0001 1.0001 0 0 0 6.7070312 11.927734 L 10.164062 16.873047 C 9.583454 17.930271 9.1142098 19.051824 8.765625 20.232422 L 2.8359375 21.21875 A 1.0001 1.0001 0 0 0 2.0019531 22.205078 L 2.0019531 27.705078 A 1.0001 1.0001 0 0 0 2.8261719 28.691406 L 8.7597656 29.742188 C 9.1064607 30.920739 9.5727226 32.043065 10.154297 33.101562 L 6.6542969 37.998047 A 1.0001 1.0001 0 0 0 6.7597656 39.285156 L 10.648438 43.175781 A 1.0001 1.0001 0 0 0 11.927734 43.289062 L 16.882812 39.820312 C 17.936999 40.39548 19.054994 40.857928 20.228516 41.201172 L 21.21875 47.164062 A 1.0001 1.0001 0 0 0 22.205078 48 L 27.705078 48 A 1.0001 1.0001 0 0 0 28.691406 47.173828 L 29.751953 41.1875 C 30.920633 40.838997 32.033372 40.369697 33.082031 39.791016 L 38.070312 43.291016 A 1.0001 1.0001 0 0 0 39.351562 43.179688 L 43.240234 39.287109 A 1.0001 1.0001 0 0 0 43.34375 37.996094 L 39.787109 33.058594 C 40.355783 32.014958 40.813915 30.908875 41.154297 29.748047 L 47.171875 28.693359 A 1.0001 1.0001 0 0 0 47.998047 27.707031 L 47.998047 22.207031 A 1.0001 1.0001 0 0 0 47.160156 21.220703 L 41.152344 20.238281 C 40.80968 19.078827 40.350281 17.974723 39.78125 16.931641 L 43.289062 11.933594 A 1.0001 1.0001 0 0 0 43.177734 10.652344 L 39.287109 6.7636719 A 1.0001 1.0001 0 0 0 37.996094 6.6601562 L 33.072266 10.201172 C 32.023186 9.6248101 30.909713 9.1579916 29.738281 8.8125 L 28.691406 2.828125 A 1.0001 1.0001 0 0 0 27.705078 2 L 22.205078 2 z M 23.056641 4 L 26.865234 4 L 27.861328 9.6855469 A 1.0001 1.0001 0 0 0 28.603516 10.484375 C 30.066026 10.848832 31.439607 11.426549 32.693359 12.185547 A 1.0001 1.0001 0 0 0 33.794922 12.142578 L 38.474609 8.7792969 L 41.167969 11.472656 L 37.835938 16.220703 A 1.0001 1.0001 0 0 0 37.796875 17.310547 C 38.548366 18.561471 39.118333 19.926379 39.482422 21.380859 A 1.0001 1.0001 0 0 0 40.291016 22.125 L 45.998047 23.058594 L 45.998047 26.867188 L 40.279297 27.871094 A 1.0001 1.0001 0 0 0 39.482422 28.617188 C 39.122545 30.069817 38.552234 31.434687 37.800781 32.685547 A 1.0001 1.0001 0 0 0 37.845703 33.785156 L 41.224609 38.474609 L 38.53125 41.169922 L 33.791016 37.84375 A 1.0001 1.0001 0 0 0 32.697266 37.808594 C 31.44975 38.567585 30.074755 39.148028 28.617188 39.517578 A 1.0001 1.0001 0 0 0 27.876953 40.3125 L 26.867188 46 L 23.052734 46 L 22.111328 40.337891 A 1.0001 1.0001 0 0 0 21.365234 39.53125 C 19.90185 39.170557 18.522094 38.59371 17.259766 37.835938 A 1.0001 1.0001 0 0 0 16.171875 37.875 L 11.46875 41.169922 L 8.7734375 38.470703 L 12.097656 33.824219 A 1.0001 1.0001 0 0 0 12.138672 32.724609 C 11.372652 31.458855 10.793319 30.079213 10.427734 28.609375 A 1.0001 1.0001 0 0 0 9.6328125 27.867188 L 4.0019531 26.867188 L 4.0019531 23.052734 L 9.6289062 22.117188 A 1.0001 1.0001 0 0 0 10.435547 21.373047 C 10.804273 19.898143 11.383325 18.518729 12.146484 17.255859 A 1.0001 1.0001 0 0 0 12.111328 16.164062 L 8.8261719 11.46875 L 11.523438 8.7734375 L 16.185547 12.105469 A 1.0001 1.0001 0 0 0 17.28125 12.148438 C 18.536908 11.394293 19.919867 10.822081 21.384766 10.462891 A 1.0001 1.0001 0 0 0 22.132812 9.6523438 L 23.056641 4 z M 25 17 C 20.593567 17 17 20.593567 17 25 C 17 29.406433 20.593567 33 25 33 C 29.406433 33 33 29.406433 33 25 C 33 20.593567 29.406433 17 25 17 z M 25 19 C 28.325553 19 31 21.674447 31 25 C 31 28.325553 28.325553 31 25 31 C 21.674447 31 19 28.325553 19 25 C 19 21.674447 21.674447 19 25 19 z"></path> </svg>`,
    liquidations: `<svg width="24px" height="24px" viewBox="-2.4 -2.4 28.80 28.80" fill="none" xmlns="http://www.w3.org/2000/svg" transform="rotate(0)" stroke="#cbcaca" stroke-width="0.00024000000000000003">
    <g id="SVGRepo_bgCarrier" stroke-width="0"/>
    <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round" stroke="#cbcaca" stroke-width="0.048"/>
    <g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M12 0.827576L12.8878 2.53967C14.1035 4.88434 15.5212 6.51667 16.8024 7.99192C16.9893 8.20708 17.1733 8.41891 17.3533 8.62911C18.7331 10.2403 20 11.8793 20 14.1696C20 18.5172 16.395 22 12 22C7.60499 22 4 18.5172 4 14.1696C4 11.8793 5.26687 10.2403 6.64671 8.62911C6.82673 8.41891 7.0107 8.20708 7.19757 7.99191C8.47882 6.51667 9.89649 4.88434 11.1122 2.53967L12 0.827576ZM8.16579 9.93003C6.7748 11.5543 6 12.6877 6 14.1696C6 17.3667 8.66302 20 12 20C15.337 20 18 17.3667 18 14.1696C18 12.6877 17.2252 11.5543 15.8342 9.93003C15.664 9.73133 15.4862 9.5269 15.3024 9.31552C14.2961 8.15864 13.1087 6.79342 12 5.0167C10.8913 6.79342 9.70387 8.15864 8.69763 9.31552C8.51377 9.5269 8.33596 9.73133 8.16579 9.93003Z" fill="#cbcaca"/> </g>
    </svg>`,
};

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

export type ChartLineType = 'PNL' | 'LIMIT' | 'LIQ' | 'PREVIEW_ORDER';

export type CustomToolbarButtonSettings = {
    text: string;
    id?: string;
    iconHtml?: string;
    settingsButton?: boolean;
    settingsButtonId?: string;
};

export function createCustomToolbarButton(
    container: HTMLElement,
    settings: CustomToolbarButtonSettings,
): { button: HTMLElement; settingsButton: HTMLElement | null } {
    let settingsButton: HTMLElement | null = null;

    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.marginLeft = '8px';

    const button = document.createElement('button');
    button.style.padding = '8px 12px';
    button.style.backgroundColor = '#2a2e39';
    button.style.border = 'none';
    button.style.borderRadius = '4px 0px 0px 4px';
    button.style.color = '#cbcaca';
    button.style.fontSize = '13px';
    button.style.fontWeight = '500';
    button.style.cursor = 'pointer';
    button.style.height = '30px';
    button.style.display = 'flex';
    button.style.border = '1px solid transparent';
    button.style.borderRight = 'none';
    button.style.alignItems = 'center';
    button.style.gap = '6px';
    button.style.transition = 'all 0.15s';
    if (settings.id) {
        button.id = settings.id;
    }

    const text = document.createElement('span');
    text.textContent = settings.text;
    button.appendChild(text);

    if (settings.iconHtml) {
        const icon = document.createElement('span');
        icon.innerHTML = settings.iconHtml;
        icon.style.display = 'flex';
        icon.style.alignItems = 'center';
        icon.style.justifyContent = 'center';
        icon.style.color = 'inherit';
        button.appendChild(icon);
    }

    container.appendChild(button);

    if (settings.settingsButton) {
        settingsButton = document.createElement('button');
        settingsButton.style.display = 'flex';
        settingsButton.style.alignItems = 'center';
        settingsButton.style.justifyContent = 'center';
        settingsButton.style.width = '30px';
        settingsButton.style.height = '30px';
        settingsButton.style.backgroundColor = '#1e2029';
        settingsButton.style.border = 'none';
        settingsButton.style.borderRadius = '0px 4px 4px 0px';
        settingsButton.style.color = '#cbcaca';
        settingsButton.style.fontSize = '14px';
        settingsButton.style.cursor = 'pointer';
        settingsButton.style.border = '1px solid transparent';
        settingsButton.style.borderLeft = 'none';
        settingsButton.innerHTML = CustomToolbarBtnIcons.settings;

        if (settings.settingsButtonId) {
            settingsButton.id = settings.settingsButtonId;
        }

        settingsButton.addEventListener('mouseenter', () => {
            if (settingsButton)
                settingsButton.style.backgroundColor = '#4a5060';
        });

        settingsButton.addEventListener('mouseleave', () => {
            if (settingsButton)
                settingsButton.style.backgroundColor = '#1e2029';
        });

        container.appendChild(settingsButton);
    }

    return {
        button,
        settingsButton,
    };
}
