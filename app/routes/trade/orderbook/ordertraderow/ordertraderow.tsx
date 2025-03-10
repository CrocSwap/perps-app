import { LuSquareArrowOutUpRight } from 'react-icons/lu';
import type { OrderBookTradeIF } from '~/utils/orderbook/OrderBookIFs';
import { formatDateToTime} from '~/utils/orderbook/OrderBookUtils';
import styles from './ordertraderow.module.css';
import useNumFormatter from '~/hooks/useNumFormatter';
import { useAppSettings } from '~/stores/AppSettingsStore';
import { useMemo } from 'react';

interface OrderTradeRowProps {
  trade: OrderBookTradeIF;
}

const OrderTradeRow: React.FC<OrderTradeRowProps> = ({ trade }) => {

  const { formatNum } = useNumFormatter();
  const { buySellColor } = useAppSettings();

  const type = useMemo(() => {
    if (trade.side === 'buy' && buySellColor.type === 'normal') return styles.buy;
    if (trade.side === 'sell' && buySellColor.type === 'normal') return styles.sell;
    if (trade.side === 'buy' && buySellColor.type === 'inverse') return styles.sell;
    if (trade.side === 'sell' && buySellColor.type === 'inverse') return styles.buy;
  }, [trade.side, buySellColor.type]);

  return (
    <div className={`${styles.orderTradeRow} ${type}`} >
      <div className={styles.orderTradePrice}>{formatNum(trade.px)}</div>
      <div className={styles.orderTradeSize}>{formatNum(trade.sz)}</div>
      <div className={styles.orderTradeTime}>
        <span>
            {formatDateToTime(new Date(trade.time))}
        </span>
        <span>
            <LuSquareArrowOutUpRight />
        </span>
      </div>

    </div>
  );
}

export default OrderTradeRow;

