import { AiOutlineQuestionCircle } from 'react-icons/ai';
import Tooltip from '~/components/Tooltip/Tooltip';
import useNumFormatter from '~/hooks/useNumFormatter';
import { useAppSettings } from '~/stores/AppSettingsStore';
import styles from './PlaceOrderButtons.module.css';

interface propsIF {
    orderMarketPrice: string;
    openModalWithContent: (
        content: 'margin' | 'scale' | 'confirm_buy' | 'confirm_sell',
    ) => void;
    leverage: number;
    orderValue?: number;
}
interface MarketInfoItem {
    label: string;
    tooltipLabel: string;
    value: string;
}

export default function PlaceOrderButtons(props: propsIF) {
    const { orderMarketPrice, openModalWithContent, orderValue, leverage } =
        props;

    // logic to change the active color pair
    const { getBsColor } = useAppSettings();
    const { formatNum } = useNumFormatter();

    const showLiquidationPrice: boolean = [
        'market',
        'limit',
        'stop_limit',
        'stop_market',
    ].includes(orderMarketPrice);

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
            value: `${orderValue ? formatNum(orderValue, null, true, true) : 'N/A'}`,
        },
        {
            label: 'Margin Required',
            tooltipLabel: 'margin required',
            value: orderValue
                ? `${formatNum(orderValue / leverage, null, true, true)}`
                : 'N/A',
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
    ];

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
    ];

    const infoDataMap: Record<string, MarketInfoItem[]> = {
        twap: twapInfoData,
        chase_limit: limitInfoData,
    };

    const dataToUse = infoDataMap[orderMarketPrice] || marketInfoData;

    return (
        <div className={styles.place_order_buttons}>
            <div className={styles.buttons_wrapper}>
                <button
                    style={{ backgroundColor: getBsColor().buy }}
                    onClick={() => openModalWithContent('confirm_buy')}
                >
                    Buy / Long
                </button>
                <button
                    style={{ backgroundColor: getBsColor().sell }}
                    onClick={() => openModalWithContent('confirm_sell')}
                >
                    Sell / Short
                </button>
            </div>
            <div className={styles.input_details}>
                {dataToUse.map((data: MarketInfoItem) => (
                    <div>
                        <div className={styles.detail_label}>
                            <span>{data.label}</span>
                            <Tooltip
                                content={data?.tooltipLabel}
                                position='right'
                            >
                                <AiOutlineQuestionCircle size={13} />
                            </Tooltip>
                        </div>
                        <span className={styles.detail_value}>
                            {data.value}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
