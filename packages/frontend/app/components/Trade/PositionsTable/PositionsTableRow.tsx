import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { LuPen } from 'react-icons/lu';
import { RiExternalLinkLine } from 'react-icons/ri';
import { useNavigate } from 'react-router';
import Modal from '~/components/Modal/Modal';
import ShareModal from '~/components/ShareModal/ShareModal';
import Tooltip from '~/components/Tooltip/Tooltip';
import { useMarketOrderService } from '~/hooks/useMarketOrderService';
import { useModal } from '~/hooks/useModal';
import { useNumFormatter } from '~/hooks/useNumFormatter';
import { useAppSettings } from '~/stores/AppSettingsStore';
import { useLeverageStore } from '~/stores/LeverageStore';
import { useNotificationStore } from '~/stores/NotificationStore';
import { useOrderBookStore } from '~/stores/OrderBookStore';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { BTC_MAX_LEVERAGE, getTxLink } from '~/utils/Constants';
import { getDurationSegment } from '~/utils/functions/getSegment';
import type { PositionIF } from '~/utils/UserDataIFs';
import LeverageSliderModal from '../LeverageSliderModal/LeverageSliderModal';
import LimitCloseModal from '../LimitCloseModal/LimitCloseModal';
import MarketCloseModal from '../MarketCloseModal/MarketCloseModal';
import TakeProfitsModal from '../TakeProfitsModal/TakeProfitsModal';
import styles from './PositionsTable.module.css';
import { useTranslation } from 'react-i18next';
import useMediaQuery from '~/hooks/useMediaQuery';

interface PositionsTableRowProps {
    position: PositionIF;
    openTPModal: () => void;
    closeTPModal: () => void;
}

const PositionsTableRow: React.FC<PositionsTableRowProps> = React.memo(
    (props) => {
        const navigate = useNavigate();
        const isMobile = useMediaQuery('(max-width: 768px)');

        const { t, i18n } = useTranslation();

        const { position } = props;
        const { coinPriceMap } = useTradeDataStore();
        const { buys, sells } = useOrderBookStore();
        const { formatNum } = useNumFormatter();
        const { getBsColor } = useAppSettings();
        const notifications = useNotificationStore();
        const { executeMarketOrder } = useMarketOrderService();
        const [isClosing, setIsClosing] = useState(false);

        const showTpSl = false;

        const modalCtrl = useModal('closed');
        const [modalContent, setModalContent] = useState<string>('share');

        const baseColor =
            position.szi >= 0 ? getBsColor().buy : getBsColor().sell;

        // Memoize TP/SL string
        const getTpSl = useCallback(() => {
            let ret = '';
            if (position.tp && position.tp > 0) {
                ret = `${formatNum(position.tp)}`;
            } else {
                ret = '--';
            }

            if (position.sl && position.sl > 0) {
                ret = `${ret} / ${formatNum(position.sl)}`;
            } else {
                ret = `${ret} / --`;
            }
            return ret;
        }, [position.tp, position.sl, formatNum]);

        const setLeverage = useLeverageStore(
            (state) => state.setPreferredLeverage,
        );

        const { symbol } = useTradeDataStore();
        useEffect(() => {
            if (symbol.toLowerCase() === position.coin.toLowerCase()) {
                setLeverage(
                    Math.min(position.leverage.value, BTC_MAX_LEVERAGE),
                );
            }
        }, [symbol, position.coin, position.leverage.value, setLeverage]);

        // Memoize hexToRgba
        const hexToRgba = useCallback((hex: string, alpha: number): string => {
            const [r, g, b] = hex
                .replace('#', '')
                .match(/.{2}/g)!
                .map((x) => parseInt(x, 16));
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }, []);

        // Memoize gradient style
        const gradientStyle = useMemo(
            () => ({
                background: `linear-gradient(
          to right,
          ${hexToRgba(baseColor, 0.8)} 0%,
          ${hexToRgba(baseColor, 0.5)} 1%,
          ${hexToRgba(baseColor, 0.2)} 2%,
          ${hexToRgba(baseColor, 0)} 4%,
          transparent 100%
        )`,
                paddingLeft: '8px',
                borderLeft: `1px solid ${baseColor}`,
            }),
            [baseColor, hexToRgba],
        );

        // Handler for row click - opens the share modal on details tab
        const openShareModalFromRow = useCallback(() => {
            setModalContent('shareDetails');
            modalCtrl.open();
        }, [modalCtrl]);

        // Handle row keyboard navigation
        const handleRowKeyDown = useCallback(
            (e: React.KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openShareModalFromRow();
                }
            },
            [openShareModalFromRow],
        );

        // Memoize modal openers (with stopPropagation)
        const openShareModal = useCallback(
            (e: React.MouseEvent) => {
                e.stopPropagation();
                setModalContent('share');
                modalCtrl.open();
            },
            [modalCtrl],
        );

        const openTpSlModal = useCallback(
            (e: React.MouseEvent) => {
                e.stopPropagation();
                setModalContent('tpsl');
                modalCtrl.open();
            },
            [modalCtrl],
        );

        const openLeverageModal = useCallback(
            (e: React.MouseEvent) => {
                e.stopPropagation();
                setModalContent('leverage');
                modalCtrl.open();
            },
            [modalCtrl],
        );

        // Memoize modal content
        const renderModalContent = useCallback(() => {
            if (modalContent === 'share') {
                return (
                    <ShareModal close={modalCtrl.close} position={position} />
                );
            }

            if (modalContent === 'shareDetails') {
                return (
                    <ShareModal
                        close={modalCtrl.close}
                        position={position}
                        initialTab='details'
                    />
                );
            }

            if (modalContent === 'leverage') {
                return (
                    <LeverageSliderModal
                        currentLeverage={position.leverage.value}
                        onClose={modalCtrl.close}
                        onConfirm={(value) => {
                            console.log({ value });
                        }}
                    />
                );
            }

            if (modalContent === 'tpsl') {
                return (
                    <Modal
                        close={modalCtrl.close}
                        title={t('transactions.tpSlForPosition')}
                    >
                        <TakeProfitsModal
                            closeTPModal={modalCtrl.close}
                            position={position}
                        />
                    </Modal>
                );
            }

            //  MOBILE ONLY: Close options selector
            if (modalContent === 'closeOptions' && isMobile) {
                return (
                    <Modal
                        title={t('transactions.closePosition')}
                        close={modalCtrl.close}
                    >
                        <div className={styles.closeOptionsContainer}>
                            <div className={styles.positionInfo}>
                                {t('transactions.currentPosition')}:{' '}
                                {Math.abs(position.szi)} {position.coin}
                            </div>

                            <div className={styles.closeOptions}>
                                <button
                                    className={styles.closeOption}
                                    onClick={() =>
                                        setModalContent('marketClose')
                                    }
                                >
                                    <div className={styles.optionTitle}>
                                        {t('transactions.market')}
                                    </div>
                                    <div className={styles.optionDescription}>
                                        {t('transactions.closeAtCurrentPrice')}
                                    </div>
                                </button>

                                <button
                                    className={styles.closeOption}
                                    onClick={() =>
                                        setModalContent('limitChase')
                                    }
                                >
                                    <div className={styles.optionTitle}>
                                        {t('transactions.limit')}
                                    </div>
                                    <div className={styles.optionDescription}>
                                        {t('transactions.closeAtAPriceYouSet')}
                                    </div>
                                </button>
                            </div>
                        </div>
                    </Modal>
                );
            }

            if (modalContent === 'limitChase') {
                return (
                    <LimitCloseModal
                        position={position}
                        close={modalCtrl.close}
                    />
                );
            }

            if (modalContent === 'marketClose') {
                return (
                    <MarketCloseModal
                        position={position}
                        close={modalCtrl.close}
                    />
                );
            }

            return null;
        }, [modalContent, modalCtrl.close, position, isMobile, t]);

        // Memoize navigation handler (with stopPropagation)
        const handleCoinClick = useCallback(
            (e: React.MouseEvent) => {
                e.stopPropagation();
                navigate(`/v2/trade/${position.coin?.toLowerCase()}`);
            },
            [navigate, position.coin],
        );

        // Handle market close
        const handleMarketClose = useCallback(async () => {
            if (isClosing || !position.szi) return;

            setIsClosing(true);

            try {
                // Show pending notification
                // notifications.add({
                //     title: 'Closing Position',
                //     message: `Market closing ${Math.abs(position.szi)} ${position.coin}`,
                //     icon: 'spinner',
                // });

                // Get order book prices for the closing order
                const closingSide = position.szi > 0 ? 'sell' : 'buy';
                const bestBidPrice = buys.length > 0 ? buys[0].px : undefined;
                const bestAskPrice = sells.length > 0 ? sells[0].px : undefined;

                const timeOfTxBuildStart = Date.now();
                // Execute market order in opposite direction
                const result = await executeMarketOrder({
                    quantity: Math.abs(position.szi), // Use absolute value of position size
                    side: closingSide, // Opposite side to close
                    leverage: position.leverage?.value,
                    bestBidPrice:
                        closingSide === 'sell' ? bestBidPrice : undefined,
                    bestAskPrice:
                        closingSide === 'buy' ? bestAskPrice : undefined,
                });

                if (result.success) {
                    if (typeof plausible === 'function') {
                        plausible('Onchain Action', {
                            props: {
                                actionType: 'Market Close Success',
                                orderType: 'Market',
                                direction: closingSide,
                                success: true,
                                txBuildDuration: getDurationSegment(
                                    timeOfTxBuildStart,
                                    result.timeOfSubmission,
                                ),
                                txDuration: getDurationSegment(
                                    result.timeOfSubmission,
                                    Date.now(),
                                ),
                                txSignature: result.signature,
                                explorerLink: getTxLink(result.signature),
                            },
                        });
                    }
                    notifications.add({
                        title: t('transactions.positionClosed'),
                        message: t('transactions.successfullyClosedPosition', {
                            usdValueOfOrderStr: formatNum(
                                position.szi,
                                2,
                                true,
                                true,
                                true,
                            ),
                            symbol: position.coin,
                        }),
                        icon: 'check',
                        txLink: getTxLink(result.signature),
                    });
                } else {
                    if (typeof plausible === 'function') {
                        plausible('Onchain Action', {
                            props: {
                                actionType: 'Market Close Fail',
                                orderType: 'Market',
                                direction: closingSide,
                                success: false,
                                txBuildDuration: getDurationSegment(
                                    timeOfTxBuildStart,
                                    result.timeOfSubmission,
                                ),
                                txDuration: getDurationSegment(
                                    result.timeOfSubmission,
                                    Date.now(),
                                ),
                                txSignature: result.signature,
                                explorerLink: getTxLink(result.signature),
                            },
                        });
                    }
                    notifications.add({
                        title: t('transactions.closeFailedTitle'),
                        message: String(
                            result.error ||
                                t('transactions.failedToClosePosition'),
                        ),
                        txLink: getTxLink(result.signature),
                        icon: 'error',
                    });
                }
            } catch (error) {
                console.error('❌ Error closing position:', error);
                notifications.add({
                    title: t('transactions.closeFailed'),
                    message: String(
                        error instanceof Error
                            ? error.message
                            : t('transactions.unknownErrorOccurred'),
                    ),
                    icon: 'error',
                });
            } finally {
                setIsClosing(false);
            }
        }, [
            position,
            executeMarketOrder,
            notifications,
            isClosing,
            buys,
            sells,
        ]);

        // Memoize funding values and tooltip
        const fundingToShow = useMemo(
            () => position.cumFunding.sinceOpen * -1,
            [position.cumFunding.sinceOpen],
        );
        const fundingTooltipMsg = useMemo(
            () =>
                t('tradeTable.fundingHistory', {
                    allTime: formatNum(
                        position.cumFunding.allTime * -1,
                        2,
                        true,
                        true,
                        true,
                    ),
                    sinceChange: formatNum(
                        position.cumFunding.sinceChange * -1,
                        2,
                        true,
                        true,
                        true,
                    ),
                }),
            [
                position.cumFunding.allTime,
                position.cumFunding.sinceChange,
                formatNum,
                i18n.language,
            ],
        );

        const isLinkDisabled = position.coin.toLowerCase() !== 'btc';

        const liquidationDisp = useMemo(() => {
            if (position.liquidationPx === null) return '-';
            if (position.liquidationPx <= 0) {
                return '0';
            }
            if (position.liquidationPx > 1_000_000) {
                return '>' + formatNum(1_000_000);
            }
            return formatNum(position.liquidationPx);
        }, [position.liquidationPx, formatNum]);

        return (
            <div
                className={`${styles.rowContainer} ${!showTpSl ? styles.noTpSl : ''}`}
                onClick={openShareModalFromRow}
                onKeyDown={handleRowKeyDown}
                role='button'
                tabIndex={0}
                style={{ cursor: 'pointer' }}
                aria-label={t('share.sharePosition', {
                    coin: position.coin,
                })}
            >
                <div
                    className={`${styles.cell} ${styles.coinCell}`}
                    style={gradientStyle}
                >
                    {isLinkDisabled ? (
                        <span style={{ color: baseColor }}>
                            {position.coin}
                        </span>
                    ) : (
                        <button
                            type='button'
                            className={styles.coinButton}
                            style={{ color: baseColor }}
                            onClick={handleCoinClick}
                            aria-label={t('tradeTable.goToMarket', {
                                coin: position.coin,
                            })}
                        >
                            {position.coin}
                        </button>
                    )}
                    {position.leverage.value &&
                        position.coin.toLowerCase() === 'btc' && (
                            <button
                                type='button'
                                className={styles.badge}
                                onClick={openLeverageModal}
                                style={{
                                    color: baseColor,
                                    backgroundColor: hexToRgba(baseColor, 0.15),
                                }}
                                aria-label={t('leverage.adjustLeverage', {
                                    value: Math.floor(position.leverage.value),
                                })}
                            >
                                {Math.floor(position.leverage.value)}x
                            </button>
                        )}
                </div>
                <div
                    className={`${styles.cell} ${styles.sizeCell}`}
                    style={{
                        color: baseColor,
                    }}
                >
                    {Math.abs(position.szi)} {position.coin}
                </div>
                <div className={`${styles.cell} ${styles.positionValueCell}`}>
                    {formatNum(position.positionValue, null, true, true)}
                </div>
                <div className={`${styles.cell} ${styles.entryPriceCell}`}>
                    {formatNum(position.entryPx)}
                </div>
                <div className={`${styles.cell} ${styles.markPriceCell}`}>
                    {formatNum(coinPriceMap.get(position.coin) ?? 0)}
                </div>
                <button
                    type='button'
                    onClick={openShareModal}
                    className={`${styles.cell} ${styles.pnlCell}`}
                    style={{
                        color:
                            position.unrealizedPnl > 0
                                ? getBsColor().buy
                                : position.unrealizedPnl < 0
                                  ? getBsColor().sell
                                  : 'var(--text2)',
                    }}
                    aria-label={t('share.sharePosition', {
                        pnl: formatNum(
                            position.unrealizedPnl,
                            2,
                            true,
                            true,
                            true,
                        ),
                    })}
                >
                    {formatNum(position.unrealizedPnl, 2, true, true, true)} (
                    {formatNum(
                        position.returnOnEquity * 100,
                        1,
                        false,
                        false,
                        true,
                    )}
                    %)
                    <RiExternalLinkLine
                        color='var(--text2)'
                        aria-hidden='true'
                    />
                </button>
                <div className={`${styles.cell} ${styles.liqPriceCell}`}>
                    {liquidationDisp}
                </div>
                <div className={`${styles.cell} ${styles.marginCell}`}>
                    {formatNum(position.marginUsed, 2)}
                </div>
                <div
                    className={`${styles.cell} ${styles.fundingCell}`}
                    style={{
                        color:
                            fundingToShow > 0
                                ? getBsColor().buy
                                : fundingToShow < 0
                                  ? getBsColor().sell
                                  : 'var(--text2)',
                    }}
                >
                    <Tooltip content={fundingTooltipMsg}>
                        {formatNum(fundingToShow, 2, true, true, true)}
                    </Tooltip>
                </div>
                {showTpSl && (
                    <div className={`${styles.cell} ${styles.tpslCell}`}>
                        {getTpSl()}
                        <button
                            onClick={openTpSlModal}
                            aria-label={t('editTPSL')}
                        >
                            <LuPen
                                color='var(--text1)'
                                size={10}
                                aria-hidden='true'
                            />
                        </button>
                    </div>
                )}
                <div className={`${styles.cell} ${styles.closeCell}`}>
                    <div className={styles.actionContainer}>
                        {isMobile ? (
                            <button
                                className={styles.primaryCloseButton}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setModalContent('closeOptions');
                                    modalCtrl.open();
                                }}
                            >
                                {t('common.close')}
                            </button>
                        ) : (
                            <>
                                <button
                                    className={styles.actionButton}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setModalContent('marketClose');
                                        modalCtrl.open();
                                    }}
                                >
                                    {t('transactions.market')}
                                </button>
                                <button
                                    className={styles.actionButton}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setModalContent('limitChase');
                                        modalCtrl.open();
                                    }}
                                >
                                    {t('transactions.limit')}
                                </button>
                            </>
                        )}
                    </div>
                </div>
                {modalCtrl.isOpen && renderModalContent()}
            </div>
        );
    },
);

export default PositionsTableRow;
