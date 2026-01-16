import { useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useAppStateStore } from '~/stores/AppStateStore';
import { useDebugStore } from '~/stores/DebugStore';
import NoConnectionIndicator from '../NoConnectionIndicator/NoConnectionIndicator';
import WsReconnectingIndicator from '../WsReconnectingIndicator/WsReconnectingIndicator';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { useInfoApi } from '~/hooks/useInfoApi';
import { useNumFormatter } from '~/hooks/useNumFormatter';
import { WS_SLEEP_MODE, WS_SLEEP_MODE_PRICE_CHECK } from '~/utils/Constants';
import { Pages, usePage } from '~/hooks/usePage';

export default function WsConnectionChecker() {
    // Use memoized value to prevent unnecessary re-renders
    const { setIsWsSleepMode, isWsSleepMode } = useDebugStore();
    const sleepModeTimeout = useRef<NodeJS.Timeout | null>(null);
    const { setInternetConnected, internetConnected, wsReconnecting } =
        useAppStateStore();

    const titleSetterIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const [tokenId, setTokenId] = useState<string>('');

    const { fetchTokenId, fetchTokenDetails } = useInfoApi();

    const { symbol, updateSymbolInfo } = useTradeDataStore();
    const { setTitleOverride, setIsTabActiveDelayed, setIsTabActive } =
        useAppStateStore();
    const { formatNum } = useNumFormatter();
    const isTabPassive = useRef(false);
    const [hideReconnectIndicator, setHideReconnectIndicator] = useState(false);

    const sleepModeBlackList = new Set([Pages.HOME]);

    const { page } = usePage();

    useEffect(() => {
        if (page && sleepModeBlackList.has(page)) {
            setHideReconnectIndicator(true);
        } else {
            setHideReconnectIndicator(false);
        }
    }, [page]);

    useEffect(() => {
        const onlineListener = () => {
            setInternetConnected(true);
        };
        const offlineListener = () => {
            setInternetConnected(false);
        };
        const visibilityListener = () => {
            if (document.visibilityState === 'hidden') {
                isTabPassive.current = true;
                setIsTabActive(false);
                if (sleepModeTimeout.current) {
                    clearTimeout(sleepModeTimeout.current);
                }
                sleepModeTimeout.current = setTimeout(() => {
                    if (isTabPassive.current) {
                        console.log('>>> sleep mode', new Date().toISOString());
                        setIsWsSleepMode(true);
                        setIsTabActiveDelayed(false);
                    }
                }, WS_SLEEP_MODE);
            } else {
                console.log('>>> resume mode', new Date().toISOString());
                setIsTabActive(true);
                isTabPassive.current = false;
                if (sleepModeTimeout.current) {
                    clearTimeout(sleepModeTimeout.current);
                }
                setIsWsSleepMode(false);
                setIsTabActiveDelayed(true);
            }
        };

        window.addEventListener('online', onlineListener);
        window.addEventListener('offline', offlineListener);
        window.addEventListener('visibilitychange', visibilityListener);

        return () => {
            window.removeEventListener('online', onlineListener);
            window.removeEventListener('offline', offlineListener);
            window.removeEventListener('visibilitychange', visibilityListener);
            if (sleepModeTimeout.current) {
                clearTimeout(sleepModeTimeout.current);
            }
        };
    }, []);

    useEffect(() => {
        if (symbol && isWsSleepMode) {
            const fetcher = async () => {
                console.log('>>> fetch token id', new Date().toISOString());
                const tokenId = await fetchTokenId(symbol);
                setTokenId(tokenId);
            };
            fetcher();

            titleSetterIntervalRef.current = setInterval(async () => {
                if (tokenId) {
                    const tokenDetails = await fetchTokenDetails(tokenId);
                    // update page title
                    setTitleOverride(
                        `${tokenDetails.markPx ? '$' + formatNum(tokenDetails.markPx) + ' | ' : ''} ${symbol?.toUpperCase() ? symbol?.toUpperCase() + ' | ' : ''}Ambient`,
                    );
                    updateSymbolInfo(tokenDetails); // update symbol price in store also
                }
            }, WS_SLEEP_MODE_PRICE_CHECK);
        } else {
            if (titleSetterIntervalRef.current) {
                clearInterval(titleSetterIntervalRef.current);
            }
            setTitleOverride('');
        }

        return () => {
            if (titleSetterIntervalRef.current) {
                clearInterval(titleSetterIntervalRef.current);
            }
        };
    }, [isWsSleepMode, symbol, tokenId]);

    return (
        <>
            <AnimatePresence>
                {!internetConnected && <NoConnectionIndicator />}
            </AnimatePresence>
            {wsReconnecting && !hideReconnectIndicator && (
                <WsReconnectingIndicator />
            )}
        </>
    );
}
