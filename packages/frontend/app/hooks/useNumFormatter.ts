import { useCallback, useMemo, useRef } from 'react';
import { useAppSettings } from '~/stores/AppSettingsStore';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import type { OrderRowResolutionIF } from '~/utils/orderbook/OrderBookIFs';

export function useNumFormatter() {
    const { numFormat } = useAppSettings();
    const { coinPriceMap, selectedCurrency } = useTradeDataStore();
    const coinPriceMapRef = useRef(coinPriceMap);
    coinPriceMapRef.current = coinPriceMap;

    const parseNum = useCallback((val: string | number) => {
        return Number(val);
    }, []);

    const isAllZeroFormatted = useCallback((str: string): boolean => {
        return /^[\s,.\-0]*$/.test(str);
    }, []);

    const getExponent = useCallback((num: number): number => {
        const expStr = num.toExponential();
        const exponent = parseInt(expStr.split('e')[1], 10);
        return exponent;
    }, []);

    const getDefaultPrecision = useCallback(
        (num: number | string) => {
            const numVal = Math.abs(parseNum(num));
            if (numVal > 10000) {
                return 0;
            } else if (numVal > 100) {
                return 2;
            } else if (numVal < 10 && numVal >= 0.01) {
                return 4;
            } else if (numVal < 1 && numVal > 0) {
                const exponent = getExponent(numVal);
                return exponent < 0 ? exponent * -1 : exponent;
            }
            return 2;
        },
        [parseNum],
    );

    // return the group and decimal separators for a given locale
    function getSeparators(locale: string): { decimal: string; group: string } {
        const numberWithGroupAndDecimal = 1234567.89;

        const parts = new Intl.NumberFormat(locale).formatToParts(
            numberWithGroupAndDecimal,
        );

        const group = parts.find((p) => p.type === 'group')?.value || ',';
        const decimal = parts.find((p) => p.type === 'decimal')?.value || '.';

        return { group, decimal };
    }

    // returns the number of decimal places in a number
    const decimalPrecision = (precisionNumber: number) => {
        if (!precisionNumber.toString().includes('.')) return 0;
        return precisionNumber.toString().split('.')[1].length;
    };

    const fillWithCurrencyChar = useCallback(
        (currency: string, formattedNum: string, showDollarSign: boolean) => {
            let ret = '';
            const isNegative = formattedNum.startsWith('-');
            if (isNegative) {
                formattedNum = formattedNum.slice(1);
            }
            if (currency === 'USD') {
                ret = showDollarSign ? '$' + formattedNum : '' + formattedNum;
            } else if (currency === 'BTC') {
                ret = '₿' + formattedNum;
            } else if (currency === 'ETH') {
                ret = 'Ξ' + formattedNum;
            } else {
                ret = formattedNum + currency;
            }

            if (isNegative) {
                ret = '-' + ret;
            }

            return ret;
        },
        [],
    );

    const formatNum = useCallback(
        (
            num: number | string,
            precision?: number | OrderRowResolutionIF | null,
            currencyConversion: boolean = false,
            showDollarSign: boolean = false,
            addPlusSignIfPositive: boolean = false,
            compact: boolean = false,
            compactThreshold: number = 10000,
            removeTrailingZeros: boolean = false, // NEW PARAMETER
        ) => {
            const formatType = numFormat.value;
            let precisionVal = null;

            if (precision && typeof precision === 'object') {
                precisionVal = decimalPrecision(precision.val);
            } else if (precision !== null && precision !== undefined) {
                precisionVal = precision;
            }

            if (currencyConversion && selectedCurrency !== 'USD') {
                num = parseNum(num);
                num =
                    num / (coinPriceMapRef.current.get(selectedCurrency) || 1);
            }

            const numValue = parseNum(num);
            let formattedNum = '';

            if (compact && Math.abs(numValue) >= compactThreshold) {
                formattedNum = numValue.toLocaleString(formatType, {
                    notation: 'compact',
                    compactDisplay: 'short',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 1,
                });
            } else {
                formattedNum = numValue.toLocaleString(formatType, {
                    minimumFractionDigits:
                        precisionVal ?? getDefaultPrecision(num),
                    maximumFractionDigits:
                        precisionVal ?? getDefaultPrecision(num),
                });

                if (isAllZeroFormatted(formattedNum)) {
                    formattedNum = numValue.toLocaleString(formatType, {
                        minimumFractionDigits: getDefaultPrecision(num),
                        maximumFractionDigits: getDefaultPrecision(num),
                    });
                }
            }

            // 🔽 REMOVE TRAILING ZEROS IF FLAG IS SET
            if (removeTrailingZeros && !compact) {
                // Only apply to strings with decimal
                if (formattedNum.includes(activeDecimalSeparator)) {
                    formattedNum = formattedNum
                        .replace(
                            new RegExp(
                                `(${activeDecimalSeparator}\d*?[1-9])0+$`,
                                'g',
                            ),
                            '$1',
                        )
                        .replace(
                            new RegExp(`(${activeDecimalSeparator})0+$`, 'g'),
                            '',
                        );
                }
            }

            let result = '';
            if (currencyConversion) {
                result = fillWithCurrencyChar(
                    selectedCurrency,
                    formattedNum,
                    showDollarSign,
                );
            } else {
                result = formattedNum;
            }

            if (addPlusSignIfPositive && Number(num) > 0) {
                result = '+' + result;
            }

            return result;
        },
        [
            numFormat,
            parseNum,
            getDefaultPrecision,
            selectedCurrency,
            isAllZeroFormatted,
            fillWithCurrencyChar,
        ],
    );

    // Add a specific currency formatting function similar to your useNumberFormatter
    const currency = useCallback(
        (
            value: number,
            compact: boolean = false,
            currencyCode: string = 'USD',
            threshold: number = 10000,
        ): string => {
            const showDollarSign = currencyCode === 'USD';
            return formatNum(
                value,
                compact && Math.abs(value) >= threshold ? 1 : 2,
                false,
                showDollarSign,
                false,
                compact,
                threshold,
            );
        },
        [formatNum],
    );

    const formatNumWithOnlyDecimals = useCallback(
        (
            num: number,
            precision?: number,
            trimTrailingZeros: boolean = false,
        ): string => {
            const { group } = getSeparators(numFormat.value);
            precision = precision ?? getPrecisionFromNumber(num);

            let formattedNum = formatNum(num, precision);

            // Remove group separators
            formattedNum = formattedNum.replace(
                new RegExp(`\\${group}`, 'g'),
                '',
            );

            // Optionally remove trailing zeros in decimal part
            if (
                trimTrailingZeros &&
                formattedNum.includes(activeDecimalSeparator)
            ) {
                // Create a regex pattern that uses the active decimal separator
                const escapedSeparator = activeDecimalSeparator.replace(
                    /[.*+?^${}()|[\]\\]/g,
                    '\\$&',
                );
                // Remove trailing zeros after decimal point and optional trailing separator
                formattedNum = formattedNum
                    .replace(
                        new RegExp(`(${escapedSeparator}\\d*?[1-9])0+$`, 'g'),
                        '$1',
                    )
                    .replace(new RegExp(`${escapedSeparator}0+$`), '')
                    .replace(new RegExp(`${escapedSeparator}$`), '');
            }

            return formattedNum;
        },
        [formatNum, numFormat],
    );

    const parseFormattedWithOnlyDecimals = useCallback(
        (str: string) => {
            const { group, decimal } = getSeparators(numFormat.value);

            const cleaned = str
                .replace(/^\$/, '') // Remove leading $ if present
                .replace(new RegExp(`\\${group}`, 'g'), '')
                .replace(decimal, '.');

            return Number(cleaned);
        },
        [numFormat],
    );

    const parseFormattedNum = useCallback(
        (str: string) => {
            const { group, decimal } = getSeparators(numFormat.value);

            const cleaned = str
                .replace(new RegExp(`\\${group}`, 'g'), '')
                .replace(decimal, '.');

            return Number(cleaned);
        },
        [numFormat],
    );

    const formatPriceForChart = useCallback(
        (num: number | string) => {
            const precision =
                Math.max(
                    5 -
                        Math.floor(
                            Math.log10(Math.abs(parseInt(num.toString())) + 1),
                        ),
                    0,
                ) - 1;
            return formatNum(num, precision >= 0 ? precision : 0);
        },
        [formatNum],
    );

    const activeDecimalSeparator = useMemo(() => {
        return getSeparators(numFormat.value).decimal;
    }, [numFormat]);

    const activeGroupSeparator = useMemo(() => {
        return getSeparators(numFormat.value).group;
    }, [numFormat]);

    const inputRegex = useMemo(() => {
        return new RegExp(`^\\d*(?:\\${activeDecimalSeparator}\\d*)?$`);
    }, [activeDecimalSeparator]);

    const getPrecisionFromNumber = useCallback((value: number) => {
        const index = value.toString().indexOf('.');
        return index === -1 ? 0 : value.toString().length - index - 1;
    }, []);

    return {
        formatNum,
        currency, // New currency function with compact support
        formatPriceForChart,
        decimalPrecision,
        getDefaultPrecision,
        parseFormattedNum,
        formatNumWithOnlyDecimals,
        parseFormattedWithOnlyDecimals,
        activeDecimalSeparator,
        activeGroupSeparator,
        inputRegex,
        getPrecisionFromNumber,
    };
}

export default useNumFormatter;
