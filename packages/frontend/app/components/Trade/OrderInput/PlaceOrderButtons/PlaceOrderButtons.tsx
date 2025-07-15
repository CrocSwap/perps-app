import React, { useCallback, useMemo, useState } from 'react';
import { AiOutlineQuestionCircle } from 'react-icons/ai';
import { motion } from 'framer-motion';
import Tooltip from '~/components/Tooltip/Tooltip';
import useNumFormatter from '~/hooks/useNumFormatter';
import { useAppSettings } from '~/stores/AppSettingsStore';
import styles from './PlaceOrderButtons.module.css';
import { HiOutlineChevronDoubleDown } from 'react-icons/hi2';

interface propsIF {
    buyFn: () => void;
    sellFn: () => void;
    orderMarketPrice: string;
    leverage: number;
    orderValue?: number;
}
interface MarketInfoItem {
    label: string;
    tooltipLabel: string;
    value: string;
}

// In case of any bugs or issues with this component, please reach out to Jr.
const PlaceOrderButtons: React.FC<propsIF> = React.memo((props) => {
    const { buyFn, sellFn, orderMarketPrice, orderValue, leverage } = props;

    const { getBsColor } = useAppSettings();
    const { formatNum } = useNumFormatter();

    const [isExpanded, setIsExpanded] = useState(false);

    const buyColor = useMemo(() => getBsColor().buy, [getBsColor]);
    const sellColor = useMemo(() => getBsColor().sell, [getBsColor]);

    const showLiquidationPrice = useMemo(
        () =>
            ['market', 'limit', 'stop_limit', 'stop_market'].includes(
                orderMarketPrice,
            ),
        [orderMarketPrice],
    );

    const marketInfoData: MarketInfoItem[] = useMemo(() => {
        const arr: (MarketInfoItem | false)[] = [
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
                value: orderValue
                    ? formatNum(orderValue, null, true, true)
                    : 'N/A',
            },
            {
                label: 'Margin Required',
                tooltipLabel: 'margin required',
                value: orderValue
                    ? formatNum(orderValue / leverage, null, true, true)
                    : 'N/A',
            },
        ];
        return arr.filter(Boolean) as MarketInfoItem[];
    }, [
        showLiquidationPrice,
        orderMarketPrice,
        orderValue,
        leverage,
        formatNum,
    ]);

    const twapInfoData: MarketInfoItem[] = useMemo(
        () => [
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
        ],
        [],
    );

    const limitInfoData: MarketInfoItem[] = useMemo(
        () => [
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
        ],
        [],
    );

    const infoDataMap: Record<string, MarketInfoItem[]> = useMemo(
        () => ({
            twap: twapInfoData,
            chase_limit: limitInfoData,
        }),
        [twapInfoData, limitInfoData],
    );

    const dataToUse = useMemo(
        () => infoDataMap[orderMarketPrice] || marketInfoData,
        [infoDataMap, orderMarketPrice, marketInfoData],
    );

    const hasMoreItems = useMemo(() => dataToUse.length > 2, [dataToUse]);

    const handleToggleExpand = useCallback(() => {
        setIsExpanded((prev) => !prev);
    }, []);

    return (
        <div className={styles.place_order_buttons}>
            <div className={styles.buttons_wrapper}>
                <button
                    style={{ backgroundColor: buyColor }}
                    className={styles.overlay_button}
                    onClick={buyFn}
                >
                    Buy / Long
                </button>
                <button
                    style={{ backgroundColor: sellColor }}
                    className={styles.overlay_button}
                    onClick={sellFn}
                >
                    Sell / Short
                </button>
            </div>
            <motion.div
                className={`${styles.input_details} ${isExpanded ? styles.expanded : ''}`}
                layout
                transition={{
                    duration: 0.3,
                    ease: [0.4, 0.0, 0.2, 1],
                }}
            >
                <div className={styles.details_viewport}>
                    <motion.div className={styles.details_container} layout>
                        {dataToUse.map((data: MarketInfoItem, idx: number) => {
                            const isVisible = idx < 2 || isExpanded;

                            if (!isVisible) return null;

                            return (
                                <motion.div
                                    key={data.label + idx}
                                    className={styles.detail_item}
                                    layout
                                    initial={
                                        idx >= 2 ? { opacity: 0, y: 10 } : false
                                    }
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{
                                        duration: 0.2,
                                        delay: idx >= 2 ? (idx - 2) * 0.05 : 0,
                                        ease: [0.4, 0.0, 0.2, 1],
                                    }}
                                >
                                    <div className={styles.detail_label}>
                                        <span>{data.label}</span>
                                        <Tooltip
                                            content={data.tooltipLabel}
                                            position='right'
                                        >
                                            <AiOutlineQuestionCircle
                                                size={13}
                                            />
                                        </Tooltip>
                                    </div>
                                    <span className={styles.detail_value}>
                                        {data.value}
                                    </span>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                </div>

                {hasMoreItems && (
                    <motion.button
                        className={styles.scroll_button}
                        onClick={handleToggleExpand}
                        aria-label={
                            isExpanded ? 'Collapse details' : 'Expand details'
                        }
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                    >
                        <motion.div
                            animate={{ rotate: isExpanded ? 180 : 0 }}
                            transition={{
                                duration: 0.2,
                                ease: [0.4, 0.0, 0.2, 1],
                            }}
                        >
                            <HiOutlineChevronDoubleDown
                                className={styles.scroll_icon}
                            />
                        </motion.div>
                    </motion.button>
                )}
            </motion.div>
        </div>
    );
});

export default PlaceOrderButtons;
