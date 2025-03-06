import { LuSquareArrowOutUpRight } from 'react-icons/lu';
import type { OrderBookTradeIF } from '~/utils/orderbook/OrderBookIFs';
import { formatDateToTime} from '~/utils/orderbook/OrderBookUtils';
import styles from './ordertraderow.module.css';
import useNumFormatter from '~/hooks/useNumFormatter';

interface OrderTradeRowProps {
  trade: OrderBookTradeIF;
}

const OrderTradeRow: React.FC<OrderTradeRowProps> = ({ trade }) => {

  const { formatNum } = useNumFormatter();

  return (
    <div className={`${styles.orderTradeRow} ${trade.side === 'buy' ? styles.buy : styles.sell}`} >
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

