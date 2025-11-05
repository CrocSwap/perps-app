import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router';
import { HorizontalScrollable } from '~/components/Wrappers/HorizontanScrollable/HorizontalScrollable';
import useNumFormatter from '~/hooks/useNumFormatter';
import { usePythPrice } from '~/hooks/usePythPrice';
import { useAppSettings } from '~/stores/AppSettingsStore';
import { useAppStateStore } from '~/stores/AppStateStore';
import { useDebugStore } from '~/stores/DebugStore';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { getTimeUntilNextHour } from '~/utils/orderbook/OrderBookUtils';
import styles from './symbolinfo.module.css';
import SymbolInfoField from './symbolinfofield/symbolinfofield';
import SymbolSearch from './symbolsearch/symbolsearch';
import { t } from 'i18next';

const SymbolInfo: React.FC = React.memo(() => {
    const { symbol, symbolInfo } = useTradeDataStore();
    const { formatNum, getDefaultPrecision } = useNumFormatter();
    const { orderBookMode } = useAppSettings();
    const { marketId } = useParams<{ marketId: string }>();
    const { titleOverride } = useAppStateStore();
    const { usePythOracle } = useDebugStore();

    // Get Pyth price for the current symbol
    const {
        price: pythPrice,
        isStale: isPythStale,
        isConnected: isPythConnected,
    } = usePythPrice(symbol);

    // State for funding countdown
    const [fundingCountdown, setFundingCountdown] = useState(
        getTimeUntilNextHour(),
    );

    // Update funding countdown every second
    useEffect(() => {
        const interval = setInterval(() => {
            setFundingCountdown(getTimeUntilNextHour());
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    // Memoize 24h change string and usdChange
    const changeData = useMemo(() => {
        if (symbolInfo) {
            const usdChange = symbolInfo.markPx - symbolInfo.prevDayPx;
            const percentChange = (usdChange / symbolInfo.prevDayPx) * 100;
            const precision = getDefaultPrecision(symbolInfo.markPx);
            return {
                str: `${usdChange > 0 ? '+' : ''}${formatNum(usdChange, precision + 1)}/${formatNum(percentChange, 2)}%`,
                usdChange,
            };
        }
        return { str: '+0.0/%0.0', usdChange: 0 };
    }, [symbolInfo, formatNum, getDefaultPrecision]);

    const marketIdWithFallback = useMemo(
        () => `${marketId || 'BTC'}`,
        [marketId],
    );

    const title = useMemo(() => {
        if (titleOverride && titleOverride.length > 0) {
            return titleOverride;
        } else {
            return `${symbolInfo?.markPx ? '$' + formatNum(symbolInfo?.markPx) + ' | ' : ''} ${marketId?.toUpperCase() ? marketId?.toUpperCase() + ' | ' : ''}Ambient`;
        }
    }, [symbolInfo?.markPx, marketId, titleOverride]);

    const ogImageRectangle = useMemo(() => {
        return `https://embindexer.net/ember/on-ambient/${marketIdWithFallback}`;
    }, [marketIdWithFallback]);

    const linkUrl = useMemo(() => {
        return `https://perps.ambient.finance/v2/trade/${marketIdWithFallback}`;
    }, [marketIdWithFallback]);

    const ogTitle = useMemo(() => {
        return `Trade ${marketIdWithFallback} Futures with Ambient on Fogo`;
    }, [marketIdWithFallback]);

    const ogDescription = useMemo(() => {
        return `${marketIdWithFallback} Perpetual Futures | Trade with Ambient on Fogo`;
    }, [marketIdWithFallback]);

    // const ogImageSquare = useMemo(() => {
    //     return `https://embindexer.net/ember/on-ambient-sq/${marketIdWithFallback}`;
    // }, [marketIdWithFallback]);

    return (
        <>
            <title>{title}</title>
            <meta property='og:type' content='website' />
            <meta property='og:title' content={ogTitle} />
            <meta property='og:description' content={ogDescription} />
            <meta property='og:image' content={ogImageRectangle} />
            <meta property='og:url' content={linkUrl} />
            <meta property='og:image:alt' content={ogDescription} />

            <meta name='twitter:card' content='summary_large_image' />
            <meta name='twitter:site' content='@ambient_finance' />
            <meta name='twitter:creator' content='@ambient_finance' />
            <meta name='twitter:title' content={ogTitle} />
            <meta name='twitter:description' content={ogDescription} />
            <meta name='twitter:image' content={ogImageRectangle} />
            <meta name='twitter:image:alt' content={ogDescription} />
            <meta name='twitter:url' content={linkUrl} />

            <div className={styles.symbolInfoContainer}>
                <div
                    className={styles.symbolSelector}
                    id='tutorial-pool-explorer'
                >
                    <SymbolSearch />
                </div>
                <div>
                    {symbolInfo && symbolInfo.coin === symbol ? (
                        <HorizontalScrollable
                            excludes={['tutorial-pool-explorer']}
                            wrapperId='trade-page-left-section'
                            autoScroll={true}
                            autoScrollSpeed={50} // 3px per frame = ~180px/sec
                            autoScrollDelay={1000}
                        >
                            <div
                                className={`${styles.symbolInfoFieldsWrapper} ${orderBookMode === 'large' ? styles.symbolInfoFieldsWrapperNarrow : ''}`}
                                id='tutorial-pool-info'
                            >
                                <SymbolInfoField
                                    tooltipContent={t('symbolInfo.markTooltip')}
                                    label={t('symbolInfo.mark')}
                                    valueClass={'w4'}
                                    value={formatNum(symbolInfo?.markPx)}
                                    lastWsChange={symbolInfo?.lastPriceChange}
                                />
                                <SymbolInfoField
                                    tooltipContent={
                                        usePythOracle &&
                                        pythPrice &&
                                        isPythConnected
                                            ? isPythStale
                                                ? t(
                                                      'symbolInfo.oracleTooltipPythStale',
                                                  )
                                                : t('symbolInfo.oracleTooltip')
                                            : t(
                                                  'symbolInfo.oracleTooltipNoPyth',
                                              )
                                    }
                                    label={`${t('symbolInfo.oracle')}${usePythOracle && isPythStale ? ' ⚠' : ''}`}
                                    valueClass={'w4'}
                                    value={formatNum(
                                        usePythOracle &&
                                            pythPrice &&
                                            isPythConnected
                                            ? pythPrice
                                            : symbolInfo?.oraclePx,
                                    )}
                                />
                                <SymbolInfoField
                                    tooltipContent={t(
                                        'symbolInfo.24hChangeTooltip',
                                    )}
                                    label={t('symbolInfo.24hChange')}
                                    valueClass={'w7'}
                                    value={changeData.str}
                                    type={
                                        changeData.usdChange > 0
                                            ? 'positive'
                                            : changeData.usdChange < 0
                                              ? 'negative'
                                              : undefined
                                    }
                                />
                                <SymbolInfoField
                                    tooltipContent={t(
                                        'symbolInfo.24hVolumeTooltip',
                                    )}
                                    label={t('symbolInfo.24hVolume')}
                                    valueClass={'w7'}
                                    value={
                                        '$' +
                                        formatNum(symbolInfo?.dayNtlVlm, 0)
                                    }
                                />
                                <SymbolInfoField
                                    tooltipContent={t(
                                        'symbolInfo.openInterestTooltip',
                                    )}
                                    label={t('symbolInfo.openInterest')}
                                    valueClass={'w7'}
                                    value={
                                        '$' +
                                        formatNum(
                                            symbolInfo?.openInterest *
                                                symbolInfo?.oraclePx,
                                            0,
                                        )
                                    }
                                />
                                <SymbolInfoField
                                    tooltipContent={
                                        <div
                                            className={
                                                styles.fundingTooltipContent
                                            }
                                        >
                                            {t('symbolInfo.fundingRateTooltip')}
                                        </div>
                                    }
                                    label={t('symbolInfo.fundingRate')}
                                    valueClass={'w7'}
                                    value={
                                        (symbolInfo?.funding * 100)
                                            .toString()
                                            .substring(0, 7) + '%'
                                    }
                                    type={'positive'}
                                />
                                <SymbolInfoField
                                    tooltipContent={t(
                                        'symbolInfo.fundingCountdownTooltip',
                                    )}
                                    label={t('symbolInfo.fundingCountdown')}
                                    valueClass={'w7'}
                                    value={fundingCountdown}
                                />
                            </div>
                        </HorizontalScrollable>
                    ) : (
                        <HorizontalScrollable
                            className={
                                orderBookMode === 'large'
                                    ? styles.symbolInfoLimitorNarrow
                                    : styles.symbolInfoLimitor
                            }
                        >
                            <div
                                className={`${styles.symbolInfoFieldsWrapper} ${orderBookMode === 'large' ? styles.symbolInfoFieldsWrapperNarrow : ''}`}
                            >
                                {[
                                    t('symbolInfo.mark'),
                                    t('symbolInfo.oracle'),
                                    t('symbolInfo.24hChange'),
                                    t('symbolInfo.24hVolume'),
                                    t('symbolInfo.openInterest'),
                                    t('symbolInfo.fundingRate'),
                                    t('symbolInfo.fundingCountdown'),
                                ].map((label) => (
                                    <SymbolInfoField
                                        key={label}
                                        label={label}
                                        valueClass={
                                            label === t('symbolInfo.mark') ||
                                            label === t('symbolInfo.oracle')
                                                ? 'w4'
                                                : 'w7'
                                        }
                                        value={''}
                                        skeleton={true}
                                    />
                                ))}
                            </div>
                        </HorizontalScrollable>
                    )}
                </div>
            </div>
        </>
    );
});

export default SymbolInfo;
