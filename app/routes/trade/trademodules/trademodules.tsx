import { useEffect } from 'react';
import { useTradeModuleStore } from '~/stores/TradeModuleStore';
import styles from './trademodules.module.css';
interface TradeModulesProps {}

const TradeModules: React.FC<TradeModulesProps> = () => {
    const { tradeSlot, setTradeSlot } = useTradeModuleStore();
    // const { symbol } = useTradeDataStore();
    const symbol = 'BTC';

    useEffect(() => {
        setTradeSlot(null);
    }, [symbol]);

    return (
        <div className={styles.tradeModulesContainer}>
            {/* {
        tradeSlot && (
            <div className={styles.tradeSlot}>
                <div className={styles.tradeSlotCoin}>{tradeSlot.coin}</div>
                <div className={styles.tradeSlotPrice}>Price: {tradeSlot.price}</div>
                <div className={styles.tradeSlotAmount}>Amount: {tradeSlot.amount}</div>
            </div>
        )
     } */}
        </div>
    );
};

export default TradeModules;
