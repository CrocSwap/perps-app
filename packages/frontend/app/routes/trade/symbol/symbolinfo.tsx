// SymbolInfo.tsx
import React, { useEffect, useMemo, useRef } from 'react';
import { useParams } from 'react-router';
import { HorizontalScrollable } from '~/components/Wrappers/HorizontanScrollable/HorizontalScrollable';
import useNumFormatter from '~/hooks/useNumFormatter';
import { useAppSettings } from '~/stores/AppSettingsStore';
import { useAppStateStore } from '~/stores/AppStateStore';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { POLLING_API_URL } from '~/utils/Constants';
import styles from './symbolinfo.module.css';
import SymbolInfoField from './symbolinfofield/symbolinfofield';
import SymbolSearch from './symbolsearch/symbolsearch';
import { useSymbolInfoFields } from './useSymbolInfoFields';

const SymbolInfo: React.FC = React.memo(() => {
    const { orderBookMode } = useAppSettings();
    const { marketId } = useParams<{ marketId: string }>();
    const { titleOverride } = useAppStateStore();
    const { formatNum } = useNumFormatter();
    const { symbolInfo } = useTradeDataStore();

    const { fieldConfigs, skeletonFieldConfigs } = useSymbolInfoFields({
        isMobile: false,
    });

    const marketIdWithFallback = useMemo(
        () => `${marketId || 'BTC'}`,
        [marketId],
    );

    const title = useMemo(() => {
        if (titleOverride && titleOverride.length > 0) {
            return titleOverride;
        } else {
            return `${symbolInfo?.markPx ? '$' + formatNum(symbolInfo?.markPx) + ' | ' : ''} ${
                marketId?.toUpperCase() ? marketId?.toUpperCase() + ' | ' : ''
            }Ambient`;
        }
    }, [symbolInfo?.markPx, marketId, titleOverride, formatNum]);

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

    const seoDescription = useMemo(() => {
        return `Trade ${marketIdWithFallback} perpetual futures on Fogo with Ambient Finance. Zero taker fees, up to 100x leverage. The premier Solana perps DEX experience.`;
    }, [marketIdWithFallback]);

    const seoKeywords = useMemo(() => {
        return `${marketIdWithFallback} perps, Solana perps, perpetual futures, Fogo, Ambient Finance, ${marketIdWithFallback} trading, crypto leverage trading, perps DEX`;
    }, [marketIdWithFallback]);

    const titleOverrideRef = useRef(titleOverride);
    titleOverrideRef.current = titleOverride;
    const formatNumRef = useRef(formatNum);
    formatNumRef.current = formatNum;

    useEffect(() => {
        const coin = marketId || 'BTC';
        const abortControllerRef = { current: null as AbortController | null };

        const fetchAndUpdateTitle = () => {
            if (titleOverrideRef.current && titleOverrideRef.current.length > 0)
                return;

            abortControllerRef.current?.abort();
            abortControllerRef.current = new AbortController();

            fetch(`${POLLING_API_URL}/info`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'metaAndAssetCtxs' }),
                signal: abortControllerRef.current.signal,
            })
                .then((res) => res.json())
                .then((data) => {
                    const universe = data?.[0]?.universe;
                    const assetCtxs = data?.[1];
                    if (!universe || !assetCtxs) return;

                    const idx = universe.findIndex((c: any) => c.name === coin);
                    if (idx < 0 || !assetCtxs[idx]) return;

                    const markPx = Number(assetCtxs[idx].markPx);
                    if (!markPx || !Number.isFinite(markPx)) return;

                    const fmt = formatNumRef.current;
                    document.title = `$${fmt(markPx)} | ${coin.toUpperCase()} | Ambient`;
                })
                .catch((err) => {
                    if (err.name !== 'AbortError') {
                        console.error(
                            'Error fetching background mark price:',
                            err,
                        );
                    }
                });
        };

        const interval = setInterval(fetchAndUpdateTitle, 30_000);

        return () => {
            clearInterval(interval);
            abortControllerRef.current?.abort();
        };
    }, [marketId]);

    const hasData =
        !!symbolInfo &&
        symbolInfo.coin &&
        fieldConfigs &&
        fieldConfigs.length > 0;

    const renderLoadedFields = () => (
        <div
            className={`${styles.symbolInfoFieldsWrapper} ${
                orderBookMode === 'large'
                    ? styles.symbolInfoFieldsWrapperNarrow
                    : ''
            }`}
            id='tutorial-pool-info'
        >
            {fieldConfigs.map((field) => (
                <SymbolInfoField
                    key={field.key}
                    tooltipContent={field.tooltipContent}
                    label={field.label}
                    valueClass={field.valueClass}
                    value={field.value}
                    type={field.type}
                    lastWsChange={field.lastWsChange}
                />
            ))}
        </div>
    );

    const renderSkeletonFields = () => (
        <div
            className={`${styles.symbolInfoFieldsWrapper} ${
                orderBookMode === 'large'
                    ? styles.symbolInfoFieldsWrapperNarrow
                    : ''
            }`}
        >
            {skeletonFieldConfigs.map((field) => (
                <SymbolInfoField
                    key={field.key}
                    label={field.label}
                    valueClass={field.valueClass}
                    value={''}
                    skeleton={true}
                />
            ))}
        </div>
    );

    return (
        <>
            <title>{title}</title>
            <meta name='description' content={seoDescription} />
            <meta name='keywords' content={seoKeywords} />
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
                    {hasData ? (
                        <HorizontalScrollable
                            excludes={['tutorial-pool-explorer']}
                            wrapperId='trade-page-left-section'
                            autoScroll={true}
                            autoScrollSpeed={50} // 3px per frame = ~180px/sec
                            autoScrollDelay={1000}
                        >
                            {renderLoadedFields()}
                        </HorizontalScrollable>
                    ) : (
                        <HorizontalScrollable
                            className={
                                orderBookMode === 'large'
                                    ? styles.symbolInfoLimitorNarrow
                                    : styles.symbolInfoLimitor
                            }
                        >
                            {renderSkeletonFields()}
                        </HorizontalScrollable>
                    )}
                </div>
            </div>
        </>
    );
});

export default SymbolInfo;
