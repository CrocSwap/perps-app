// SymbolInfo.tsx
import React, { useMemo } from 'react';
import { useParams } from 'react-router';
import { HorizontalScrollable } from '~/components/Wrappers/HorizontanScrollable/HorizontalScrollable';
import useNumFormatter from '~/hooks/useNumFormatter';
import { useAppSettings } from '~/stores/AppSettingsStore';
import { useAppStateStore } from '~/stores/AppStateStore';
import { useTradeDataStore } from '~/stores/TradeDataStore';
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
