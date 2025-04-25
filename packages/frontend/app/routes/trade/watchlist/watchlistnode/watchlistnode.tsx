import { useMemo } from 'react';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import type { SymbolInfoIF } from '~/utils/SymbolInfoIFs';
import styles from './watchlistnode.module.css';
import useNumFormatter from '~/hooks/useNumFormatter';
import { useNavigate } from 'react-router';
import { useAppSettings } from '~/stores/AppSettingsStore';

interface WatchListNodeProps {
    symbol: SymbolInfoIF;
    showMode: 'dollar' | 'percent';
}

const WatchListNode: React.FC<WatchListNodeProps> = ({ symbol, showMode }) => {
    const navigate = useNavigate();

    const { formatNum } = useNumFormatter();
    const { selectedCurrency } = useTradeDataStore();

    const { symbol: storeSymbol, setSymbol: setStoreSymbol } =
        useTradeDataStore();

    const { getBsColor } = useAppSettings();

    const change = useMemo(() => {
        return symbol.markPx - symbol.prevDayPx;
    }, [symbol]);

    const nodeClickListener = () => {
        if (symbol.coin === storeSymbol) return;
        setStoreSymbol(symbol.coin);
        navigate(`/trade/${symbol.coin}`);
    };

    const shownVal = useMemo(() => {
        if (showMode === 'dollar') {
            return formatNum(symbol.markPx);
        } else {
            return (
                (change > 0 ? '+' : '') +
                formatNum(
                    ((symbol.markPx - symbol.prevDayPx) / symbol.prevDayPx) *
                        100,
                    2,
                ) +
                '%'
            );
        }
    }, [showMode, change, formatNum]);

    return (
        <div className={`${styles.watchListNodeContainer}`}>
            <div
                className={`${styles.watchListNodeContent} ${symbol.coin === storeSymbol ? styles.active : ''}`}
                onClick={nodeClickListener}
            >
                <div className={styles.symbolName}>{symbol.coin}-USD</div>
                <div
                    className={`w3 ${styles.symbolValue}`}
                    style={{
                        color:
                            change > 0
                                ? getBsColor().buy
                                : change < 0
                                  ? getBsColor().sell
                                  : 'var(--text1)',
                    }}
                >
                    {shownVal}
                </div>
            </div>
        </div>
    );
};

export default WatchListNode;
