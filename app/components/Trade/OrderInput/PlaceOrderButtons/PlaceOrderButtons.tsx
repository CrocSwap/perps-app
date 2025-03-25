import Tooltip from '~/components/Tooltip/Tooltip';
import styles from './PlaceOrderButtons.module.css'
import { AiOutlineQuestionCircle } from 'react-icons/ai';

interface PropsIF {
    orderMarketPrice: string;
}
interface MarketInfoItem {
    label: string;
    tooltipLabel: string;
    value: string;
  }
  
export default function PlaceOrderButtons(props: PropsIF) {
    const { orderMarketPrice } = props

    const showLiquidationPrice = ['market', 'limit', 'stop_limit', 'stop_market'].includes(
        orderMarketPrice,
    );

    const marketInfoData: MarketInfoItem[] = [
        showLiquidationPrice && {
          label: 'Liquidation Price',
          tooltipLabel: 'liquidation price',
          value: '-',
        },
        orderMarketPrice === 'scale' && {
          label: 'Avg. Entry Price',
          tooltipLabel: 'average entry price',
          value: '-',
        },
        {
          label: 'Order Value',
          tooltipLabel: 'order value',
          value: 'N/A',
        },
    ].filter(Boolean) as MarketInfoItem[];
    
    const twapInfoData: MarketInfoItem[] = [
        {
            label: 'Frequency',
            tooltipLabel: 'frequency',
            value: '30 seconds',
          },
        {
            label: 'Run Time',
            tooltipLabel: 'run time',
            value: '30 minutes',
          },
        {
            label: 'Number of Orders',
            tooltipLabel: 'number of orders',
            value: '61',
          },
    ]
    const limitInfoData: MarketInfoItem[] = [
        {
            label: 'Chasing Interval',
            tooltipLabel: 'chasing interval',
            value: 'Per 1s',
          },
        {
            label: 'Size per suborder',
            tooltipLabel: 'size per suborder',
            value: '0.000 ETH',
          },
    
    ]
    const infoDataMap: Record<string, MarketInfoItem[]> = {
        twap: twapInfoData,
        chase_limit: limitInfoData,
      };
      
      const dataToUse = infoDataMap[orderMarketPrice] || marketInfoData;
      
      
    
    
    return (
        <div className={styles.container}>
            <div className={styles.buttonsContainer}>
                <button className={styles.greenButton}>Buy / Long</button>
                <button className={styles.redButton}>Sell / Short</button>

            </div>
            <div className={styles.inputDetailsDataContainer}>
                {dataToUse.map((data, idx) => (
                    <div className={styles.inputDetailsDataContent}>
                        <div className={styles.inputDetailsLabel}>
                            <span>{data.label}</span>
                            <Tooltip
                                content={data?.tooltipLabel}
                                position='right'
                            >
                                <AiOutlineQuestionCircle size={13} />
                            </Tooltip>
                        </div>
                        <span className={styles.inputDetailValue}>
                            {data.value}
                        </span>
                    </div>
                ))}
            </div>

        </div>
    )
}