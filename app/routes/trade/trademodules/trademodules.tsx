
import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './trademodules.module.css';
import { useWsObserver } from '~/hooks/useWsObserver';
import { useTradeModuleStore } from '~/stores/TradeModuleStore';
import { useTradeDataStore } from '~/stores/TradeDataStore';
interface TradeModulesProps {
}

const TradeModules: React.FC<TradeModulesProps> = () => {

    const { subscribe, unsubscribeAllByChannel} = useWsObserver();

    const { tradeSlot, setTradeSlot } = useTradeModuleStore();
    const { symbol } = useTradeDataStore();

    useEffect(() => {
        setTradeSlot(null);
    }, [symbol])

  return (
    <div className={styles.tradeModulesContainer}>

     {
        tradeSlot && (
            <div className={styles.tradeSlot}>
                <div className={styles.tradeSlotCoin}>{tradeSlot.coin}</div>
                <div className={styles.tradeSlotPrice}>Price: {tradeSlot.price}</div>
                <div className={styles.tradeSlotAmount}>Amount: {tradeSlot.amount}</div>
            </div>
        )
     }
    </div>
  );
}

export default TradeModules;
