import React, { useEffect, useState } from 'react';
import { TradingViewProvider } from '~/contexts/TradingviewContext';
import TradingViewChart from '~/routes/chart/chart';
import { loadTradingViewLibrary } from '~/routes/chart/lazyLoading/useLazyTradingview';
import LiquidationOverlayCanvas from '~/routes/chart/overlayCanvas/LiqudationOverlayCanvas';
import OrderLinesOverlayCanvas from '~/routes/chart/overlayCanvas/OrderLinesOverlayCanvas';
import { useAppStateStore } from '~/stores/AppStateStore';
import styles from './chartLoading.module.css';

const TradingViewWrapper: React.FC = () => {
    const { liquidationsActive } = useAppStateStore();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [tvLib, setTvLib] = useState<any>(null);
    const [chartLoadingStatus, setChartLoadingStatus] = useState<
        'loading' | 'error' | 'ready'
    >('loading');

    useEffect(() => {
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
    }, []);

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
                    tradingviewLib={tvLib}
                    setChartLoadingStatus={setChartLoadingStatus}
                >
                    <TradingViewChart />
                    {liquidationsActive && <LiquidationOverlayCanvas />}
                    <OrderLinesOverlayCanvas />
                </TradingViewProvider>
            )}
        </div>
    );
};

export default TradingViewWrapper;
