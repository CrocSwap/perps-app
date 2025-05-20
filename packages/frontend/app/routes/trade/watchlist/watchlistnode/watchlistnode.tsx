import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import useNumFormatter from '~/hooks/useNumFormatter';
import { useAppSettings } from '~/stores/AppSettingsStore';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import type { SymbolInfoIF } from '~/utils/SymbolInfoIFs';
import styles from './watchlistnode.module.css';

interface WatchListNodeProps {
    symbol: SymbolInfoIF;
    showMode: 'dollar' | 'percent';
}

const WatchListNode: React.FC<WatchListNodeProps> = ({ symbol, showMode }) => {
    const navigate = useNavigate();

    const { formatNum } = useNumFormatter();

    const { symbol: storeSymbol, setSymbol: setStoreSymbol } =
        useTradeDataStore();

    const { getBsColor } = useAppSettings();

    const change = useMemo(() => {
        return symbol.markPx - symbol.prevDayPx;
    }, [symbol]);

    const nodeClickListener = () => {
        if (symbol.coin === storeSymbol) return;
        setStoreSymbol(symbol.coin);
        navigate(`/trade/${symbol.coin}`, { viewTransition: true });
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
                    className={`${styles.symbolValue}`}
                    style={{
                        color:
                            change > 0
                                ? getBsColor().buy
                                : change < 0
                                  ? getBsColor().sell
                                  : 'var(--text1)',
                        width: `${shownVal.length * 7}px`,
                    }}
                >
                    {shownVal}
                </div>
            </div>
        </div>
    );
};

export default WatchListNode;
