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
import { blockExplorer } from '~/utils/Constants';
import { getDurationSegment } from '~/utils/functions/getDurationSegment';
import type { PositionIF } from '~/utils/UserDataIFs';
import LeverageSliderModal from '../LeverageSliderModal/LeverageSliderModal';
import LimitCloseModal from '../LimitCloseModal/LimitCloseModal';
import MarketCloseModal from '../MarketCloseModal/MarketCloseModal';
import TakeProfitsModal from '../TakeProfitsModal/TakeProfitsModal';
import styles from './PositionsTable.module.css';
import { toast } from 'sonner';
import Notification from '~/components/Notifications/Notification';

interface PositionsTableRowProps {
    position: PositionIF;
    openTPModal: () => void;
    closeTPModal: () => void;
}

const PositionsTableRow: React.FC<PositionsTableRowProps> = React.memo(
    (props) => {
        const navigate = useNavigate();

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
                setLeverage(position.leverage.value);
            }
        }, [symbol]);

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

        // Memoize modal openers
        const openShareModal = useCallback(() => {
            setModalContent('share');
            modalCtrl.open();
        }, [modalCtrl]);

        const openTpSlModal = useCallback(() => {
            setModalContent('tpsl');
            modalCtrl.open();
        }, [modalCtrl]);

        const openLeverageModal = useCallback(() => {
            setModalContent('leverage');
            modalCtrl.open();
        }, [modalCtrl]);

        // Memoize modal content
        const renderModalContent = useCallback(() => {
            if (modalContent === 'share') {
                return (
                    <ShareModal close={modalCtrl.close} position={position} />
                );
            } else if (modalContent === 'leverage') {
                return (
                    <LeverageSliderModal
                        currentLeverage={position.leverage.value}
                        onClose={modalCtrl.close}
                        onConfirm={(value) => {
                            console.log({ value });
                        }}
                    />
                );
            } else if (modalContent === 'tpsl') {
                return (
                    <Modal close={modalCtrl.close} title='TP/SL for Position'>
                        <TakeProfitsModal
                            closeTPModal={modalCtrl.close}
                            position={position}
                        />
                    </Modal>
                );
            } else if (modalContent === 'limitChase') {
                return (
                    <LimitCloseModal
                        position={position}
                        close={modalCtrl.close}
                    />
                );
            } else if (modalContent === 'marketClose') {
                return (
                    <MarketCloseModal
                        position={position}
                        close={modalCtrl.close}
                    />
                );
            }
            return null;
        }, [modalContent, modalCtrl.close, position]);

        // Memoize navigation handler
        const handleCoinClick = useCallback(() => {
            navigate(`/v2/trade/${position.coin?.toLowerCase()}`);
        }, [navigate, position.coin]);

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
                                txBuildDuration: getDurationSegment(
                                    timeOfTxBuildStart,
                                    result.timeOfSubmission,
                                ),
                                txDuration: getDurationSegment(
                                    result.timeOfSubmission,
                                    Date.now(),
                                ),
                                txSignature: result.signature,
                                explorerLink: result.signature
                                    ? blockExplorer + '/tx/' + result.signature
                                    : undefined,
                            },
                        });
                    }
                    notifications.add({
                        title: 'Position Closed',
                        message: `Successfully closed ${Math.abs(position.szi)} ${position.coin} position`,
                        icon: 'check',
                        txLink: result.signature
                            ? blockExplorer + result.signature
                            : undefined,
                    });
                    toast.custom(() => (
                        <Notification
                            data={{
                                slug: 657687868761874,
                                title: 'Limit Order Failed',
                                message:
                                    error instanceof Error
                                        ? error.message
                                        : 'Unknown error occurred',
                                icon: 'error',
                                removeAfter: 10000,
                            }}
                            dismiss={(num: number) => console.log(num)}
                        />
                    ));
                } else {
                    if (typeof plausible === 'function') {
                        plausible('Onchain Action', {
                            props: {
                                actionType: 'Market Close Fail',
                                orderType: 'Market',
                                direction: closingSide,
                                txBuildDuration: getDurationSegment(
                                    timeOfTxBuildStart,
                                    result.timeOfSubmission,
                                ),
                                txDuration: getDurationSegment(
                                    result.timeOfSubmission,
                                    Date.now(),
                                ),
                                txSignature: result.signature,
                                explorerLink: result.signature
                                    ? blockExplorer + '/tx/' + result.signature
                                    : undefined,
                            },
                        });
                    }
                    notifications.add({
                        title: 'Close Failed',
                        message: String(
                            result.error || 'Failed to close position',
                        ),
                        txLink: result.signature
                            ? blockExplorer + result.signature
                            : undefined,
                        icon: 'error',
                    });
                }
            } catch (error) {
                console.error('❌ Error closing position:', error);
                notifications.add({
                    title: 'Close Failed',
                    message: String(
                        error instanceof Error
                            ? error.message
                            : 'Unknown error occurred',
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
                `All-time: ${formatNum(position.cumFunding.allTime * -1, 2, true, true, true)} Since change: ${formatNum(position.cumFunding.sinceChange * -1, 2, true, true, true)}`,
            [
                position.cumFunding.allTime,
                position.cumFunding.sinceChange,
                formatNum,
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
            >
                <div
                    className={`${styles.cell} ${styles.coinCell}`}
                    style={gradientStyle}
                >
                    <span
                        style={{
                            color: baseColor,
                            cursor: isLinkDisabled ? 'default' : 'pointer',
                        }}
                        onClick={isLinkDisabled ? undefined : handleCoinClick}
                    >
                        {position.coin}
                    </span>
                    {position.leverage.value &&
                        position.coin.toLowerCase() === 'btc' && (
                            <span
                                className={styles.badge}
                                onClick={openLeverageModal}
                                style={{
                                    color: baseColor,
                                    backgroundColor: hexToRgba(baseColor, 0.15),
                                }}
                            >
                                {Math.floor(position.leverage.value)}x
                            </span>
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
                <div
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
                    <RiExternalLinkLine color='var(--text2)' />
                </div>
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
                        <button onClick={openTpSlModal}>
                            <LuPen color='var(--text1)' size={10} />
                        </button>
                    </div>
                )}
                <div className={`${styles.cell} ${styles.closeCell}`}>
                    <div className={styles.actionContainer}>
                        {/* <button className={styles.actionButton}>Limit</button> */}
                        {/* <button
                            className={styles.actionButton}
                            onClick={handleMarketClose}
                            disabled={isClosing}
                        >
                            {isClosing ? 'Closing...' : 'Market'}
                        </button> */}
                        <button
                            className={styles.actionButton}
                            onClick={() => {
                                setModalContent('marketClose');
                                modalCtrl.open();
                            }}
                        >
                            Market
                        </button>
                        <button
                            className={styles.actionButton}
                            onClick={() => {
                                setModalContent('limitChase');
                                modalCtrl.open();
                            }}
                        >
                            Limit
                        </button>
                    </div>
                </div>
                {modalCtrl.isOpen && renderModalContent()}
            </div>
        );
    },
);

export default PositionsTableRow;
