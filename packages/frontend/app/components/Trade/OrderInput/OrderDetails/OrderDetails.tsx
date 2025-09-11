import { motion } from 'framer-motion';
import React, { useMemo } from 'react';
import { HiOutlineChevronDoubleDown } from 'react-icons/hi2';
import { LuCircleHelp } from 'react-icons/lu';
import Tooltip from '~/components/Tooltip/Tooltip';
import useNumFormatter from '~/hooks/useNumFormatter';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import styles from './OrderDetails.module.css';
import { t } from 'i18next';

interface MarketInfoItem {
    label: string;
    tooltipLabel: string;
    value: string;
}

interface OrderDetailsProps {
    orderMarketPrice: string;
    usdOrderValue?: number;
    marginRequired: number;
    liquidationPrice?: number | null;
}

const OrderDetails: React.FC<OrderDetailsProps> = ({
    orderMarketPrice,
    usdOrderValue,
    marginRequired,
    liquidationPrice,
}) => {
    const { formatNum } = useNumFormatter();
    const { isTradeInfoExpanded, setIsTradeInfoExpanded } = useTradeDataStore();

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
                label: t('transactions.liquidationPrice'),
                tooltipLabel: t('transactions.liquidationPrice'),
                value: (() => {
                    if (
                        liquidationPrice === null ||
                        liquidationPrice === undefined
                    ) {
                        return '-';
                    }

                    const humanReadablePrice = liquidationPrice / 1e6; // Convert from 10^8 to human readable

                    // Display '-' if price is below 0 or above 100 million
                    if (
                        humanReadablePrice <= 0 ||
                        humanReadablePrice > 100_000_000
                    ) {
                        return '-';
                    }

                    return formatNum(
                        humanReadablePrice,
                        humanReadablePrice > 10_000 ? 0 : 2,
                        true,
                        true,
                    );
                })(),
            },
            orderMarketPrice === 'scale' && {
                label: t('transactions.avgEntryPrice'),
                tooltipLabel: t('transactions.avgEntryPrice'),
                value: '-',
            },
            {
                label: t('transactions.orderValue'),
                tooltipLabel: t('transactions.orderValue'),
                value: usdOrderValue
                    ? formatNum(usdOrderValue, null, true, true)
                    : '-',
            },
            {
                label: t('transactions.marginRequired'),
                tooltipLabel: t('transactions.marginRequired'),
                value: marginRequired
                    ? formatNum(marginRequired, null, true, true)
                    : '-',
            },
        ];
        return arr.filter(Boolean) as MarketInfoItem[];
    }, [
        showLiquidationPrice,
        orderMarketPrice,
        usdOrderValue,
        marginRequired,
        formatNum,
        liquidationPrice,
    ]);

    const twapInfoData: MarketInfoItem[] = useMemo(
        () => [
            {
                label: t('transactions.frequency'),
                tooltipLabel: t('transactions.frequency'),
                value: '30 seconds',
            },
            {
                label: t('transactions.runTime'),
                tooltipLabel: t('transactions.runTime'),
                value: '30 minutes',
            },
            {
                label: t('transactions.numberOfOrders'),
                tooltipLabel: t('transactions.numberOfOrders'),
                value: '61',
            },
        ],
        [],
    );

    const limitInfoData: MarketInfoItem[] = useMemo(
        () => [
            {
                label: t('transactions.chasingInterval'),
                tooltipLabel: t('transactions.chasingInterval'),
                value: 'Per 1s',
            },
            {
                label: t('transactions.sizePerSuborder'),
                tooltipLabel: t('transactions.sizePerSuborder'),
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

    return (
        <motion.div
            className={`${styles.order_details} ${
                isTradeInfoExpanded ? styles.expanded : ''
            }`}
            layout
            transition={{
                duration: 0.3,
                ease: [0.4, 0.0, 0.2, 1],
            }}
        >
            <div className={styles.details_viewport}>
                <motion.div className={styles.details_container} layout>
                    {dataToUse.map((data: MarketInfoItem, idx: number) => {
                        const isVisible = idx < 2 || isTradeInfoExpanded;

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
                                        <LuCircleHelp size={12} />
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
                    onClick={() => setIsTradeInfoExpanded(!isTradeInfoExpanded)}
                    aria-label={
                        isTradeInfoExpanded
                            ? t('transactions.collapseDetails')
                            : t('transactions.expandDetails')
                    }
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                >
                    <motion.div
                        animate={{ rotate: isTradeInfoExpanded ? 180 : 0 }}
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
    );
};

export default OrderDetails;
