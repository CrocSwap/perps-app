import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import useNumFormatter from '~/hooks/useNumFormatter';
import { useAppSettings } from '~/stores/AppSettingsStore';
import type { SymbolInfoIF } from '~/utils/SymbolInfoIFs';
import styles from './watchlistnode.module.css';

interface WatchListNodeProps {
    symbol: SymbolInfoIF;
    showMode: 'dollar' | 'percent';
}

const WatchListNode: React.FC<WatchListNodeProps> = ({ symbol, showMode }) => {
    const navigate = useNavigate();

    const { formatNum } = useNumFormatter();

    // const {symbol: storeSymbol, setSymbol: setStoreSymbol} = useTradeDataStore();

    const storeSymbol = 'BTC';

    const { isInverseColor } = useAppSettings();

    const change = useMemo(() => {
        return symbol.markPx - symbol.prevDayPx;
    }, [symbol]);

    const nodeClickListener = () => {
        if (symbol.coin === storeSymbol) return;
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
        <div
            className={`${styles.watchListNodeContainer} ${
                isInverseColor ? styles.inverseColor : ''
            }`}
            onClick={nodeClickListener}
        >
            <div className={styles.symbolName}>{symbol.coin}-USD</div>
            <div
                className={`${styles.symbolValue} ${
                    change > 0
                        ? styles.positive
                        : change < 0
                        ? styles.negative
                        : ''
                }`}
            >
                {shownVal}
            </div>
        </div>
    );
};

export default WatchListNode;
