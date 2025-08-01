import type { MarginBucketAvail } from '@crocswap-libs/ambient-ember';
import {
    isEstablished,
    SessionButton,
    useSession,
} from '@fogo/sessions-sdk-react';
import { motion } from 'framer-motion';
import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import SimpleButton from '~/components/SimpleButton/SimpleButton';
import Tooltip from '~/components/Tooltip/Tooltip';
import useNumFormatter from '~/hooks/useNumFormatter';
import { usePortfolioModals } from '~/routes/portfolio/usePortfolioModals';
import { useAppSettings } from '~/stores/AppSettingsStore';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import styles from './DepositDropdown.module.css';

interface propsIF {
    marginBucket: MarginBucketAvail | null;
    isDropdown?: boolean;
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

function DepositDropdown(props: propsIF) {
    const { isDropdown, marginBucket } = props;

    const [balanceNum, setBalanceNum] = useState<number>(0);
    const [unrealizedPnlNum, setUnrealizedPnlNum] = useState<number>(0);

    useEffect(() => {
        if (marginBucket) {
            const equityBigNum = marginBucket.equity;
            const normalizedEquity = Number(equityBigNum) / 1e6;
            setBalanceNum(normalizedEquity);
            const unrealizedPnlBigNum = marginBucket.unrealizedPnl;
            const normalizedUnrealizedPnl = Number(unrealizedPnlBigNum) / 1e6;
            setUnrealizedPnlNum(normalizedUnrealizedPnl);
        }
    }, [marginBucket]);

    const sessionState = useSession();
    const isUserConnected = isEstablished(sessionState);

    const { openDepositModal, openWithdrawModal, PortfolioModalsRenderer } =
        usePortfolioModals();
    const {
        //   accountOverview,
        selectedCurrency,
    } = useTradeDataStore();
    const { getBsColor } = useAppSettings();
    const { formatNum } = useNumFormatter();

    // Scroll fade logic
    const scrollRef = useRef<HTMLDivElement>(null);
    const [, setIsScrolledToBottom] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (scrollRef.current) {
                const { scrollTop, scrollHeight, clientHeight } =
                    scrollRef.current;
                const isAtBottom = scrollTop + clientHeight >= scrollHeight - 5;
                setIsScrolledToBottom(isAtBottom);
            }
        };
        const scrollElement = scrollRef.current;
        if (scrollElement) {
            scrollElement.addEventListener('scroll', handleScroll);
            handleScroll();
        }
        return () => {
            if (scrollElement) {
                scrollElement.removeEventListener('scroll', handleScroll);
            }
        };
    }, []);

    // Memoize color values
    const bsColor = useMemo(() => getBsColor(), [getBsColor]);

    // Memoize overview data
    const overviewData = useMemo(
        () => [
            {
                label: 'Balance',
                tooltipContent: 'total account equity',
                value: formatNum(balanceNum, 2, true, true),
                change: 0,
            },
            {
                label: 'Unrealized PNL',
                tooltipContent: 'Unrealized profits and losses',
                value: formatNum(unrealizedPnlNum, 2, true, true),
                color:
                    unrealizedPnlNum > 0
                        ? bsColor.buy
                        : unrealizedPnlNum < 0
                          ? bsColor.sell
                          : 'var(--text-)',
            },
            // {
            //     label: 'Cross Margin Ratio',
            //     tooltipContent: 'this is tooltip data',
            //     value: formatNum(accountOverview.crossMarginRatio, 2) + '%',
            //     color:
            //         accountOverview.crossMarginRatio > 0
            //             ? bsColor.buy
            //             : accountOverview.crossMarginRatio < 0
            //               ? bsColor.sell
            //               : 'var(--text-)',
            // },
            // {
            //     label: 'Maintenance Margin',
            //     tooltipContent: 'this is tooltip data',
            //     value: formatNum(
            //         accountOverview.maintainanceMargin,
            //         2,
            //         true,
            //         true,
            //     ),
            //     change: accountOverview.maintainanceMarginChange,
            // },
            // {
            //     label: 'Cross Account Leverage',
            //     tooltipContent: 'this is tooltip data',
            //     value: formatNum(accountOverview.crossAccountLeverage, 2) + 'x',
            // },
        ],
        [balanceNum, unrealizedPnlNum, selectedCurrency, bsColor, formatNum],
    );

    // Memoize wallet connect handler
    // const handleConnectWallet = useCallback(() => {
    //     console.log('connect wallet');
    // }, []);

    // Memoize deposit/withdraw handlers
    const handleDeposit = useCallback(() => {
        openDepositModal();
    }, [openDepositModal]);

    const handleWithdraw = useCallback(() => {
        openWithdrawModal();
    }, [openWithdrawModal]);

    return (
        <>
            <div
                className={`${styles.container} ${isDropdown ? styles.dropdownContainer : ''}`}
            >
                {isUserConnected ? (
                    <div
                        className={`${styles.actionButtons} ${!isDropdown ? styles.dropdownActionButtons : ''}`}
                    >
                        <SimpleButton
                            bg='accent1'
                            onClick={handleDeposit}
                            className={styles.depositButton}
                        >
                            Deposit
                        </SimpleButton>
                        <SimpleButton
                            bg={isDropdown ? 'dark4' : 'dark3'}
                            hoverBg='accent1'
                            onClick={handleWithdraw}
                        >
                            Withdraw
                        </SimpleButton>
                    </div>
                ) : (
                    <div className={styles.notConnectedContainer}>
                        <p className={styles.notConnectedText}>
                            Connect your wallet to start trading with zero gas.
                        </p>
                        <SessionButton />
                    </div>
                )}
                {isUserConnected && (
                    <div className={styles.overviewContainer}>
                        <h3>Account Overview</h3>
                        {overviewData.map((data) => (
                            <div
                                key={data.label}
                                className={styles.overviewItem}
                            >
                                <div className={styles.tooltipContainer}>
                                    <p className={styles.overviewLabel}>
                                        {data.label}
                                    </p>
                                    <Tooltip
                                        content={data.tooltipContent}
                                        position='right'
                                    >
                                        {tooltipSvg}
                                    </Tooltip>
                                </div>
                                {data.change !== undefined ? (
                                    <motion.p
                                        key={data.change}
                                        className={styles.value}
                                        initial={{
                                            color:
                                                data.change > 0
                                                    ? bsColor.buy
                                                    : bsColor.sell,
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
                )}
            </div>
            {PortfolioModalsRenderer}
        </>
    );
}

export default React.memo(DepositDropdown);
