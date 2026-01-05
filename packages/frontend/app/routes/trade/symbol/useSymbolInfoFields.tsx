import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { t } from 'i18next';
import useNumFormatter from '~/hooks/useNumFormatter';
import { usePythPrice } from '~/hooks/usePythPrice';
import { useDebugStore } from '~/stores/DebugStore';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { getTimeUntilNextHour } from '~/utils/orderbook/OrderBookUtils';
import styles from './symbolinfo.module.css';

export type SymbolInfoFieldConfig = {
    key: string;
    label: string;
    labelMobile?: string;
    tooltipContent?: ReactNode;
    valueClass: 'w4' | 'w7';
    value: string; // what is shown in the bar (can be compact on mobile)
    fullValue: string; // always full desktop-style value (used in modal)
    type?: 'positive' | 'negative';
    lastWsChange?: number;
};

export type SymbolInfoSkeletonFieldConfig = Pick<
    SymbolInfoFieldConfig,
    'key' | 'label' | 'valueClass'
>;

export function useSymbolInfoFields(opts?: { isMobile?: boolean }) {
    const { isMobile = false } = opts || {};

    const { symbol, symbolInfo } = useTradeDataStore();
    const { formatNum, getDefaultPrecision } = useNumFormatter();
    const { usePythOracle } = useDebugStore();

    const {
        price: pythPrice,
        isStale: isPythStale,
        isConnected: isPythConnected,
    } = usePythPrice(symbol);

    const [fundingCountdown, setFundingCountdown] = useState(
        getTimeUntilNextHour(),
    );

    useEffect(() => {
        const interval = setInterval(() => {
            setFundingCountdown(getTimeUntilNextHour());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const changeData = useMemo(() => {
        if (!symbolInfo) return { str: '+0.0/%0.0', usdChange: 0 };

        const usdChange = symbolInfo.markPx - symbolInfo.prevDayPx;
        const percentChange = (usdChange / symbolInfo.prevDayPx) * 100;
        const precision = getDefaultPrecision(symbolInfo.markPx);

        return {
            str: `${usdChange > 0 ? '+' : ''}${formatNum(
                usdChange,
                precision + 1,
            )}/${formatNum(percentChange, 2)}%`,
            usdChange,
        };
    }, [symbolInfo, formatNum, getDefaultPrecision]);

    const fieldConfigs: SymbolInfoFieldConfig[] = useMemo(() => {
        if (!symbolInfo || symbolInfo.coin !== symbol) return [];

        const oracleTooltip =
            usePythOracle && pythPrice && isPythConnected
                ? isPythStale
                    ? t('symbolInfo.oracleTooltipPythStale')
                    : t('symbolInfo.oracleTooltip')
                : t('symbolInfo.oracleTooltipNoPyth');

        const oracleRaw =
            usePythOracle && pythPrice && isPythConnected
                ? pythPrice
                : symbolInfo.oraclePx;

        const fundingTooltip = (
            <div className={styles.fundingTooltipContent}>
                {t('symbolInfo.fundingRateTooltip')}
            </div>
        );

        const fundingRateFull = (symbolInfo.funding * 100).toFixed(6) + '%';
        const fundingType =
            symbolInfo.funding > 0
                ? 'positive'
                : symbolInfo.funding < 0
                  ? 'negative'
                  : undefined;

        const mobilePercent =
            symbolInfo.prevDayPx !== 0
                ? (changeData.usdChange / symbolInfo.prevDayPx) * 100
                : 0;

        // desktop-style full values
        const fullMark = formatNum(
            symbolInfo.markPx,
            getDefaultPrecision(symbolInfo.markPx),
        );
        const fullOracle = formatNum(oracleRaw, getDefaultPrecision(oracleRaw));
        const fullVolume =
            '$' +
            formatNum(
                symbolInfo.dayNtlVlm,
                0, // desktop uses integer 24h vol
                false,
                false,
                false,
                false,
            );
        const fullOpenInterest =
            '$' +
            formatNum(
                symbolInfo.openInterest * symbolInfo.oraclePx,
                0,
                false,
                false,
                false,
                false,
            );

        // inline (bar) values:
        //  - desktop: same as full
        //  - mobile: compact only for Vol / OI, percent-only for 24h Δ
        const inlineVolume =
            '$' +
            formatNum(
                symbolInfo.dayNtlVlm,
                isMobile ? 1 : 0,
                false,
                false,
                false,
                isMobile, // compact only on mobile
                10_000,
            );

        const inlineOpenInterest =
            '$' +
            formatNum(
                symbolInfo.openInterest * symbolInfo.oraclePx,
                isMobile ? 1 : 0,
                false,
                false,
                false,
                isMobile,
                10_000,
            );

        const inlineChange = isMobile
            ? `${changeData.usdChange > 0 ? '+' : ''}${formatNum(
                  mobilePercent,
                  2,
              )}%`
            : changeData.str;

        return [
            {
                key: 'mark',
                label: t('symbolInfo.mark'),
                labelMobile: 'Mark',
                tooltipContent: t('symbolInfo.markTooltip'),
                valueClass: 'w4',
                value: fullMark, // same on mobile/desktop
                fullValue: fullMark,
                lastWsChange: symbolInfo.lastPriceChange,
            },
            {
                key: 'oracle',
                label: `${t('symbolInfo.oracle')}${
                    usePythOracle && isPythStale ? ' ⚠' : ''
                }`,
                labelMobile: 'O',
                tooltipContent: oracleTooltip,
                valueClass: 'w4',
                value: fullOracle,
                fullValue: fullOracle,
            },
            {
                key: 'change24h',
                label: t('symbolInfo.24hChange'),
                labelMobile: '24h Δ',
                tooltipContent: t('symbolInfo.24hChangeTooltip'),
                valueClass: 'w7',
                value: inlineChange,
                fullValue: changeData.str, // always full desktop string
                type:
                    changeData.usdChange > 0
                        ? 'positive'
                        : changeData.usdChange < 0
                          ? 'negative'
                          : undefined,
            },
            {
                key: 'volume24h',
                label: t('symbolInfo.24hVolume'),
                labelMobile: '24h Vol',
                tooltipContent: t('symbolInfo.24hVolumeTooltip'),
                valueClass: 'w7',
                value: inlineVolume, // compact on mobile, full on desktop
                fullValue: fullVolume, // ALWAYS full number in modal
            },
            {
                key: 'openInterest',
                label: t('symbolInfo.openInterest'),
                labelMobile: 'OI',
                tooltipContent: t('symbolInfo.openInterestTooltip'),
                valueClass: 'w7',
                value: inlineOpenInterest,
                fullValue: fullOpenInterest,
            },
            {
                key: 'fundingCountdown',
                label: t('symbolInfo.fundingCountdown'),
                labelMobile: 'FC',
                tooltipContent: t('symbolInfo.fundingCountdownTooltip'),
                valueClass: 'w7',
                value: fundingCountdown,
                fullValue: fundingCountdown,
            },
            {
                key: 'fundingRate',
                label: t('symbolInfo.fundingRate'),
                labelMobile: 'FR',
                tooltipContent: fundingTooltip,
                valueClass: 'w7',
                value: fundingRateFull,
                fullValue: fundingRateFull,
                type: fundingType,
            },
        ];
    }, [
        symbolInfo,
        symbol,
        formatNum,
        getDefaultPrecision,
        changeData.usdChange,
        changeData.str,
        usePythOracle,
        pythPrice,
        isPythConnected,
        isPythStale,
        fundingCountdown,
        isMobile,
    ]);

    const skeletonFieldConfigs: SymbolInfoSkeletonFieldConfig[] = useMemo(
        () => [
            { key: 'mark', label: t('symbolInfo.mark'), valueClass: 'w4' },
            { key: 'oracle', label: t('symbolInfo.oracle'), valueClass: 'w4' },
            {
                key: 'change24h',
                label: t('symbolInfo.24hChange'),
                valueClass: 'w7',
            },
            {
                key: 'volume24h',
                label: t('symbolInfo.24hVolume'),
                valueClass: 'w7',
            },
            {
                key: 'openInterest',
                label: t('symbolInfo.openInterest'),
                valueClass: 'w7',
            },
            {
                key: 'fundingRate',
                label: t('symbolInfo.fundingRate'),
                valueClass: 'w7',
            },
            {
                key: 'fundingCountdown',
                label: t('symbolInfo.fundingCountdown'),
                valueClass: 'w7',
            },
        ],
        [],
    );

    return {
        symbol,
        symbolInfo,
        fieldConfigs,
        skeletonFieldConfigs,
        changeData,
    };
}
