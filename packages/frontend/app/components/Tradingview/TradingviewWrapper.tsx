import React, { useEffect, useState } from 'react';
import { TradingViewProvider } from '~/contexts/TradingviewContext';
import TradingViewChart from '~/routes/chart/chart';
import {
    getCachedTradingViewLibrary,
    loadTradingViewLibrary,
} from '~/routes/chart/lazyLoading/useLazyTradingview';
import OverlayCanvas from '~/routes/chart/overlayCanvas/overlayCanvas';
import { useAppStateStore } from '~/stores/AppStateStore';
import styles from './chartLoading.module.css';

const TradingViewWrapper: React.FC = () => {
    // Check if library is already cached to avoid showing spinner on remount
    const cachedLib = getCachedTradingViewLibrary();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [tvLib, setTvLib] = useState<any>(cachedLib);
    const [chartLoadingStatus, setChartLoadingStatus] = useState<
        'loading' | 'error' | 'ready'
    >(cachedLib ? 'ready' : 'loading');

    // Use a key to force remount of TradingViewProvider when coming back online
    const { lastOnlineAt } = useAppStateStore();
    const [chartKey, setChartKey] = useState(0);

    useEffect(() => {
        // Skip loading if we already have the library cached
        if (tvLib) return;

        let mounted = true;
        (async () => {
            const lib = await loadTradingViewLibrary();
            if (!mounted) return;

            if (!lib) setChartLoadingStatus('error');
            else {
                setTvLib(lib);
            }
        })();

        return () => {
            mounted = false;
        };
    }, [tvLib]);

    // When coming back online and chart is stuck loading, force a remount
    useEffect(() => {
        if (lastOnlineAt > 0 && chartLoadingStatus === 'loading' && tvLib) {
            console.log('>>> Forcing chart remount after coming back online');
            // Small delay to let network stabilize
            const timeoutId = setTimeout(() => {
                setChartKey((prev) => prev + 1);
            }, 1500);
            return () => clearTimeout(timeoutId);
        }
    }, [lastOnlineAt, chartLoadingStatus, tvLib]);

    if (chartLoadingStatus === 'error')
        return (
            <div className='tv-error'>
                TradingView library is currently unavailable
            </div>
        );

    return (
        <div
            style={{
                position: 'relative',
                width: '100%',
                height: '100%',
            }}
        >
            {chartLoadingStatus === 'loading' && (
                <div className={`${styles.spinner_container}`}>
                    <div className={`${styles.spinner}`}></div>
                </div>
            )}

            {tvLib && (
                <TradingViewProvider
                    key={chartKey}
                    tradingviewLib={tvLib}
                    setChartLoadingStatus={setChartLoadingStatus}
                >
                    <TradingViewChart />
                    <OverlayCanvas />
                </TradingViewProvider>
            )}
        </div>
    );
};

export default TradingViewWrapper;
