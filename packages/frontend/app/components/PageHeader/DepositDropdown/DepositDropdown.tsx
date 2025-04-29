import {
    useNotificationStore,
    type notificationSlugs,
} from '~/stores/NotificationStore';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import styles from './DepositDropdown.module.css';
import Tooltip from '~/components/Tooltip/Tooltip';
import { useMemo } from 'react';
import useNumFormatter from '~/hooks/useNumFormatter';
import { useAppSettings } from '~/stores/AppSettingsStore';
import { motion } from 'framer-motion';
interface propsIF {
    isUserConnected: boolean;
    setIsUserConnected: React.Dispatch<React.SetStateAction<boolean>>;
    isDropdown?: boolean;
}
export default function DepositDropdown(props: propsIF) {
    const { isUserConnected, isDropdown } = props;

    // hook to populate a new notification in the notification center on user click
    const populateNotification: (s: notificationSlugs) => void =
        useNotificationStore().add;

    const { accountOverview, selectedCurrency } = useTradeDataStore();

    const { getBsColor } = useAppSettings();

    const { formatNum } = useNumFormatter();

    const overviewData = useMemo(
        () => [
            {
                label: 'Balance',
                tooltipContent: 'this is tooltip data',
                value: formatNum(accountOverview.balance, 2, true, true),
                change: accountOverview.balanceChange,
            },
            {
                label: 'Unrealized PNL',
                tooltipContent: 'this is tooltip data',
                value: formatNum(accountOverview.unrealizedPnl, 2, true, true),
                color:
                    accountOverview.unrealizedPnl > 0
                        ? getBsColor().buy
                        : accountOverview.unrealizedPnl < 0
                          ? getBsColor().sell
                          : 'var(--text-)',
            },
            {
                label: 'Cross Margin Ratio',
                tooltipContent: 'this is tooltip data',
                value: formatNum(accountOverview.crossMarginRatio, 2) + '%',
                color:
                    accountOverview.crossMarginRatio > 0
                        ? getBsColor().buy
                        : accountOverview.crossMarginRatio < 0
                          ? getBsColor().sell
                          : 'var(--text-)',
            },
            {
                label: 'Maintenance Margin',
                tooltipContent: 'this is tooltip data',
                value: formatNum(
                    accountOverview.maintainanceMargin,
                    2,
                    true,
                    true,
                ),
                change: accountOverview.maintainanceMarginChange,
            },
            {
                label: 'Cross Account Leverage',
                tooltipContent: 'this is tooltip data',
                value: formatNum(accountOverview.crossAccountLeverage, 2) + 'x',
            },
        ],
        [accountOverview, selectedCurrency],
    );

    return (
        <div
            className={`${styles.container} ${isDropdown ? styles.dropdownContainer : ''}`}
        >
            {isUserConnected ? (
                <div className={styles.actionButtons}>
                    <button
                        onClick={() => populateNotification('depositPending')}
                    >
                        Deposit
                    </button>
                    <button
                        onClick={() => populateNotification('withdrawPending')}
                    >
                        Withdraw
                    </button>
                </div>
            ) : (
                <div className={styles.notConnectedContainer}>
                    <p className={styles.notConnectedText}>
                        Connect your wallet to start trading with zero gas.
                    </p>
                    <button className={styles.connectButton}>
                        Connect Wallet
                    </button>
                </div>
            )}
            <div className={styles.overviewContainer}>
                <h3>Account Overview</h3>
                {overviewData.map((data, idx) => (
                    <div key={idx} className={styles.overviewItem}>
                        <div className={styles.tooltipContainer}>
                            <p className={styles.overviewLabel}>{data.label}</p>
                            <Tooltip
                                content={data?.tooltipContent}
                                position='right'
                            >
                                {tooltipSvg}
                            </Tooltip>
                        </div>
                        {data.change ? (
                            <motion.p
                                key={data.change}
                                className={styles.value}
                                initial={{
                                    color:
                                        data.change > 0
                                            ? getBsColor().buy
                                            : getBsColor().sell,
                                }}
                                animate={{
                                    color: 'var(--text1)',
                                }}
                                transition={{
                                    duration: 0.3,
                                    ease: 'easeInOut',
                                }}
                            >
                                {data.value}
                            </motion.p>
                        ) : (
                            <p
                                className={styles.value}
                                style={{ color: data.color }}
                            >
                                {data.value}
                            </p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

const tooltipSvg = (
    <svg
        xmlns='http://www.w3.org/2000/svg'
        width='16'
        height='16'
        viewBox='0 0 16 16'
        fill='none'
    >
        <g clipPath='url(#clip0_4025_6958)'>
            <path
                d='M6.06001 6C6.21675 5.55445 6.52611 5.17874 6.93331 4.93942C7.34052 4.70011 7.81927 4.61263 8.28479 4.69248C8.75032 4.77232 9.17255 5.01435 9.47673 5.37569C9.7809 5.73702 9.94738 6.19435 9.94668 6.66667C9.94668 8 7.94668 8.66667 7.94668 8.66667M8.00001 11.3333H8.00668M14.6667 8C14.6667 11.6819 11.6819 14.6667 8.00001 14.6667C4.31811 14.6667 1.33334 11.6819 1.33334 8C1.33334 4.3181 4.31811 1.33333 8.00001 1.33333C11.6819 1.33333 14.6667 4.3181 14.6667 8Z'
                stroke='#6A6A6D'
                strokeLinecap='round'
                strokeLinejoin='round'
            />
        </g>
        <defs>
            <clipPath id='clip0_4025_6958'>
                <rect width='16' height='16' fill='white' />
            </clipPath>
        </defs>
    </svg>
);
