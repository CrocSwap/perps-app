import React, { useMemo } from 'react';
import { useParams } from 'react-router';
import { HorizontalScrollable } from '~/components/Wrappers/HorizontanScrollable/HorizontalScrollable';
import useNumFormatter from '~/hooks/useNumFormatter';
import { useAppSettings } from '~/stores/AppSettingsStore';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { getTimeUntilNextHour } from '~/utils/orderbook/OrderBookUtils';
import styles from './symbolinfo.module.css';
import SymbolInfoField from './symbolinfofield/symbolinfofield';
import SymbolSearch from './symbolsearch/symbolsearch';
import { useAppStateStore } from '~/stores/AppStateStore';

const SymbolInfo: React.FC = React.memo(() => {
    const { symbol, symbolInfo } = useTradeDataStore();
    const { formatNum, getDefaultPrecision } = useNumFormatter();
    const { orderBookMode } = useAppSettings();
    const { marketId } = useParams<{ marketId: string }>();
    const { titleOverride } = useAppStateStore();

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
        () => `${marketId?.toUpperCase() || 'BTC'}`,
        [marketId],
    );

    const title = useMemo(() => {
        if (titleOverride && titleOverride.length > 0) {
            return titleOverride;
        } else {
            return `${symbolInfo?.markPx ? '$' + formatNum(symbolInfo?.markPx) + ' | ' : ''} ${marketId?.toUpperCase() ? marketId?.toUpperCase() + ' | ' : ''}Ambient`;
        }
    }, [symbolInfo?.markPx, marketId, titleOverride]);

    const ogImage = useMemo(
        () =>
            `https://ogcdn.net/da4a0656-0565-4e39-bf07-21693b0e75f4/v1/${marketIdWithFallback}%20%2F%20USD/%23000000/Trade%20${marketIdWithFallback}%20Futures%20on%20Ambient/Trade%20Now/rgba(78%2C%2059%2C%20193%2C%201)/https%3A%2F%2Fopengraph.b-cdn.net%2Fproduction%2Fimages%2Ff4b4ae96-8d00-4542-be9a-aa88baa20b71.png%3Ftoken%3Dr8QAtZP22dg8D9xO49yyukxsP6vMYppjw5a1t-5PE1M%26height%3D500%26width%3D500%26expires%3D33280645642/rgba(82%2C%2071%2C%20179%2C%201)/linear-gradient(120deg%2C%20rgba(255%2C255%2C255%2C1)%2027%25%2C%20RGBA(62%2C%2051%2C%20147%2C%201)%2086%25)/https%3A%2F%2Fopengraph.b-cdn.net%2Fproduction%2Fimages%2F97217047-4d16-43c6-82d9-00def7bf6631.png%3Ftoken%3DpnvvvLULvCnOD2vp4i4ifsuEqIzLf8Q-TyveG-a3eQw%26height%3D510%26width%3D684%26expires%3D33280645584/og.png`,
        [marketIdWithFallback],
    );

    return (
        <>
            <title>{title}</title>
            <meta property='og:image' content={ogImage} />
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
                            className={
                                orderBookMode === 'large'
                                    ? styles.symbolInfoLimitorNarrow
                                    : styles.symbolInfoLimitor
                            }
                        >
                            <div
                                className={`${styles.symbolInfoFieldsWrapper} ${orderBookMode === 'large' ? styles.symbolInfoFieldsWrapperNarrow : ''}`}
                                id='tutorial-pool-info'
                            >
                                <SymbolInfoField
                                    tooltipContent='tooltip content'
                                    label='Mark'
                                    valueClass={'w4'}
                                    value={formatNum(symbolInfo?.markPx)}
                                    lastWsChange={symbolInfo?.lastPriceChange}
                                />
                                <SymbolInfoField
                                    tooltipContent='tooltip content'
                                    label='Oracle'
                                    valueClass={'w4'}
                                    value={formatNum(symbolInfo?.oraclePx)}
                                />
                                <SymbolInfoField
                                    tooltipContent='tooltip content'
                                    label='24h Change'
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
                                    tooltipContent='tooltip content'
                                    label='24h Volume'
                                    valueClass={'w7'}
                                    value={
                                        '$' +
                                        formatNum(symbolInfo?.dayNtlVlm, 0)
                                    }
                                />
                                <SymbolInfoField
                                    tooltipContent='tooltip content'
                                    label='Open Interest'
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
                                    tooltipContent='tooltip content'
                                    label='Funding Rate'
                                    valueClass={'w7'}
                                    value={
                                        (symbolInfo?.funding * 100)
                                            .toString()
                                            .substring(0, 7) + '%'
                                    }
                                    type={'positive'}
                                />
                                <SymbolInfoField
                                    tooltipContent='tooltip content'
                                    label='Funding Countdown'
                                    valueClass={'w7'}
                                    value={getTimeUntilNextHour()}
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
                                    'Mark',
                                    'Oracle',
                                    '24h Change',
                                    '24h Volume',
                                    'Open Interest',
                                    'Funding Rate',
                                    'Funding Countdown',
                                ].map((label) => (
                                    <SymbolInfoField
                                        key={label}
                                        label={label}
                                        valueClass={
                                            label === 'Mark' ||
                                            label === 'Oracle'
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
