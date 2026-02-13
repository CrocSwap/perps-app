import React, { useEffect, useState } from 'react';
import { TradingViewProvider } from '~/contexts/TradingviewContext';
import TradingViewChart from '~/routes/chart/chart';
import { loadTradingViewLibrary } from '~/routes/chart/lazyLoading/useLazyTradingview';
import { useAppStateStore } from '~/stores/AppStateStore';
import styles from './chartLoading.module.css';
import YaxisOverlayCanvas from '~/routes/chart/overlayCanvas/yAxisOverlayCanvas';
import OrderLinesOverlayCanvas from '~/routes/chart/overlayCanvas/OrderLinesOverlayCanvas';
import LimitOrderPlacementCanvas from '~/routes/chart/overlayCanvas/LimitOrderPlacementCanvas';
import { useOrderPlacementStore } from '~/routes/chart/hooks/useOrderPlacement';
import { QuickModeConfirmModal } from '~/routes/chart/components/QuickModeConfirmModal';
import type { TabType } from '~/routes/trade';

interface TradingViewWrapperProps {
    switchTab?: (tab: TabType) => void;
}

const TradingViewWrapper: React.FC<TradingViewWrapperProps> = ({
    switchTab,
}) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [tvLib, setTvLib] = useState<any>(null);
    const [chartLoadingStatus, setChartLoadingStatus] = useState<
        'loading' | 'error' | 'ready'
    >('loading');

    // Use a key to force remount of TradingViewProvider when coming back online
    const { lastOnlineAt } = useAppStateStore();
    const [chartKey, setChartKey] = useState(0);
    const {
        showQuickModeConfirm,
        closeQuickModeConfirm,
        saveQuickModeSettings,
        saveAndEnableQuickMode,
    } = useOrderPlacementStore();

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
                    switchTab={switchTab}
                >
                    <TradingViewChart />
                    <OrderLinesOverlayCanvas />
                    <LimitOrderPlacementCanvas />
                    <YaxisOverlayCanvas />
                </TradingViewProvider>
            )}

            {showQuickModeConfirm && (
                <QuickModeConfirmModal
                    onClose={closeQuickModeConfirm}
                    onSave={saveQuickModeSettings}
                    onSaveAndEnable={saveAndEnableQuickMode}
                />
            )}
        </div>
    );
};

export default TradingViewWrapper;
