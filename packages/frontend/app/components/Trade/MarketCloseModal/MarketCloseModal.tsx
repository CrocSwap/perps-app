import React, { useEffect, useMemo, useRef, useState } from 'react';
import Modal from '~/components/Modal/Modal';
import SimpleButton from '~/components/SimpleButton/SimpleButton';
import { useMarketOrderService } from '~/hooks/useMarketOrderService';
import useNumFormatter from '~/hooks/useNumFormatter';
import {
    type NotificationStoreIF,
    useNotificationStore,
} from '~/stores/NotificationStore';
import { useOrderBookStore } from '~/stores/OrderBookStore';
import { usePythPrice } from '~/stores/PythPriceStore';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import {
    getTxLink,
    MAX_BTC_NOTIONAL,
    MIN_ORDER_VALUE,
} from '~/utils/Constants';
import { getDurationSegment } from '~/utils/functions/getSegment';
import type { OrderBookMode } from '~/utils/orderbook/OrderBookIFs';
import type { PositionIF } from '~/utils/UserDataIFs';
import PositionSize from '../OrderInput/PositionSIze/PositionSize';
import SizeInput from '../OrderInput/SizeInput/SizeInput';
import styles from './MarketCloseModal.module.css';
import { t } from 'i18next';

interface PropsIF {
    close: () => void;
    position: PositionIF;
}

export default function MarketCloseModal({ close, position }: PropsIF) {
    const { formatNumWithOnlyDecimals } = useNumFormatter();

    const { symbolInfo, symbol } = useTradeDataStore();

    const { executeMarketOrder } = useMarketOrderService();
    const { buys, sells } = useOrderBookStore();

    const [isProcessingOrder, setIsProcessingOrder] = useState(false);

    const { parseFormattedNum, formatNum } = useNumFormatter();

    const isPositionLong = position.szi > 0;
    const pythPriceData = usePythPrice(symbol);

    const markPx = symbolInfo?.markPx || pythPriceData?.price;

    const [selectedDenom, setSelectedDenom] = useState<OrderBookMode>('usd');

    const originalSize = Math.abs(position.szi);

    const [sizePercentageValue, setSizePercentageValue] = useState(100);
    const [notionalSymbolQtyNum, setNotionalSymbolQtyNum] =
        useState(originalSize);
    const [sizeDisplay, setSizeDisplay] = useState('');
    const [isOverLimit, setIsOverLimit] = useState(false);
    const [isEditingSizeInput, setIsEditingSizeInput] = useState(false);

    // Track if the last change was from the slider
    const lastChangedBySlider = useRef(true);

    const estimatedPNL = !markPx
        ? 0
        : isPositionLong
          ? notionalSymbolQtyNum * (markPx - position.entryPx)
          : notionalSymbolQtyNum * (position.entryPx - markPx);

    const isQtyLessThanMinValue = useMemo(() => {
        return notionalSymbolQtyNum * (markPx || 1) < MIN_ORDER_VALUE * 0.99;
    }, [markPx, notionalSymbolQtyNum]);

    // Initialize sizeDisplay based on selectedMode
    useEffect(() => {
        if (!isEditingSizeInput) {
            if (selectedDenom === 'symbol') {
                setSizeDisplay(
                    notionalSymbolQtyNum
                        ? formatNumWithOnlyDecimals(
                              notionalSymbolQtyNum,
                              6,
                              true,
                          )
                        : '',
                );
            } else if (markPx) {
                setSizeDisplay(
                    notionalSymbolQtyNum
                        ? formatNumWithOnlyDecimals(
                              notionalSymbolQtyNum * markPx,
                              2,
                              false,
                          )
                        : '',
                );
            }
        }
    }, [notionalSymbolQtyNum, selectedDenom, isEditingSizeInput, markPx]);

    // Update sizeDisplay when markPx changes
    useEffect(() => {
        if (
            !isEditingSizeInput &&
            selectedDenom !== 'symbol' &&
            sizeDisplay &&
            markPx
        ) {
            const parsedQty = parseFormattedNum(sizeDisplay);
            if (!isNaN(parsedQty) && markPx !== 0) {
                setNotionalSymbolQtyNum(parsedQty / markPx);
            }
        }
    }, [markPx]);

    // Update sizeDisplay format when selectedMode changes
    useEffect(() => {
        if (
            !isEditingSizeInput &&
            selectedDenom === 'usd' &&
            sizeDisplay &&
            markPx
        ) {
            const parsedQty = parseFormattedNum(sizeDisplay);
            if (!isNaN(parsedQty) && markPx !== 0) {
                setSizeDisplay(
                    formatNumWithOnlyDecimals(parsedQty * markPx, 2),
                );
            }
        }
    }, [selectedDenom]);

    useEffect(() => {
        if (!lastChangedBySlider.current) return;

        const calculatedSize = (originalSize * sizePercentageValue) / 100;
        setNotionalSymbolQtyNum(calculatedSize);

        if (Math.abs(calculatedSize) < 1e-8) {
            setIsOverLimit(true);
        } else if (sizePercentageValue > 0) {
            if (calculatedSize <= originalSize && calculatedSize > 0) {
                setIsOverLimit(false);
            }
        }
    }, [sizePercentageValue, originalSize]);

    const handleSizeChange = (
        val: string | React.ChangeEvent<HTMLInputElement>,
    ) => {
        let inputValue: string;

        if (typeof val === 'string') {
            inputValue = val;
        } else if (val?.target?.value !== undefined) {
            inputValue = val.target.value;
        } else return;

        lastChangedBySlider.current = false;
        setSizeDisplay(inputValue);
    };

    const handleSizeInputUpdate = () => {
        const parsed = parseFormattedNum(sizeDisplay.trim());
        if (!isNaN(parsed)) {
            const adjusted =
                selectedDenom === 'symbol' ? parsed : parsed / (markPx || 1);
            setNotionalSymbolQtyNum(adjusted);

            if (adjusted > originalSize) {
                setSizePercentageValue(100);
                setIsOverLimit(true);
            } else if (Math.abs(adjusted) < 1e-8) {
                setSizePercentageValue(0);
                setIsOverLimit(true);
            } else {
                const percentage = (adjusted / originalSize) * 100;
                setSizePercentageValue(Math.round(Math.max(0, percentage)));
                setIsOverLimit(false);
            }
        } else if (sizeDisplay.trim() === '') {
            setNotionalSymbolQtyNum(0);
            setSizePercentageValue(0);
            setIsOverLimit(true);
        } else {
            setIsOverLimit(true);
        }
    };

    const handleSizeInputBlur = () => {
        setIsEditingSizeInput(false);
        handleSizeInputUpdate();
    };

    const handleOnFocus = () => {
        setIsEditingSizeInput(true);
    };

    // Update sizeDisplay on debounce after user has paused typing
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (isEditingSizeInput) {
                handleSizeInputUpdate();
            }
        }, 500);
        return () => clearTimeout(timeout);
    }, [sizeDisplay, isEditingSizeInput]);

    const handlePositionSizeChange = (val: number) => {
        lastChangedBySlider.current = true;
        setSizePercentageValue(val);
        setIsOverLimit(val === 0);
        setIsEditingSizeInput(false);
    };

    const getWarningMessage = () => {
        if (Math.abs(notionalSymbolQtyNum) < 1e-8)
            return t('marketClose.noZeroSize');
        if (notionalSymbolQtyNum > originalSize)
            return t('marketClose.sizeExceedsPosition');
        if (notionalSymbolQtyNum < 0) return t('marketClose.invalidSize');
        return '';
    };

    const notifications: NotificationStoreIF = useNotificationStore();

    const isCompleteClose = useMemo(
        () => sizePercentageValue === 100,
        [sizePercentageValue],
    );

    const isSubminimumClose = useMemo(
        () => isQtyLessThanMinValue && isCompleteClose,
        [isQtyLessThanMinValue, isCompleteClose],
    );

    const subminimumCloseQty = useMemo(
        () => MIN_ORDER_VALUE / (markPx || 1),
        [markPx],
    );

    const maxNotional = MAX_BTC_NOTIONAL;

    // fn to execute market close
    async function executeMarketClose(): Promise<void> {
        // Validate position size
        if (!notionalSymbolQtyNum || notionalSymbolQtyNum <= 0) {
            notifications.add({
                title: t('marketLimitClose.invalidOrderSizeTitle'),
                message: t('marketLimitClose.invalidSize'),
                icon: 'error',
            });
            close();
            return;
        }

        setIsProcessingOrder(true);

        try {
            // Get order book prices for the closing order
            const closingSide = isPositionLong ? 'sell' : 'buy';
            const bestBidPrice = buys.length > 0 ? buys[0].px : markPx;
            const bestAskPrice = sells.length > 0 ? sells[0].px : markPx;

            const timeOfTxBuildStart = Date.now();
            // Execute market order in opposite direction to close position
            const result = await executeMarketOrder({
                quantity: isCompleteClose
                    ? isSubminimumClose
                        ? subminimumCloseQty
                        : Math.min(notionalSymbolQtyNum * 1.01, maxNotional) // add 1% buffer to prevent dust remaining after close, but do not exceed max size
                    : notionalSymbolQtyNum,
                side: closingSide,
                leverage: position.leverage?.value,
                bestBidPrice: closingSide === 'sell' ? bestBidPrice : undefined,
                bestAskPrice: closingSide === 'buy' ? bestAskPrice : undefined,
                reduceOnly: isCompleteClose,
            });

            const usdValueOfOrderStr = formatNum(
                notionalSymbolQtyNum * (markPx || 0),
                2,
                true,
                true,
            );

            if (result.success) {
                if (typeof plausible === 'function') {
                    plausible('Onchain Action', {
                        props: {
                            actionType: 'Market Close Success',
                            orderType: 'Market',
                            success: true,
                            direction: closingSide === 'buy' ? 'Buy' : 'Sell',
                            txBuildDuration: getDurationSegment(
                                timeOfTxBuildStart,
                                result.timeOfSubmission,
                            ),
                            txDuration: getDurationSegment(
                                result.timeOfSubmission,
                                Date.now(),
                            ),
                            txSignature: result.signature,
                        },
                    });
                }
                notifications.add({
                    title:
                        sizePercentageValue < 100
                            ? t('marketLimitClose.percentOfPositionClosed', {
                                  sizePercentageValue,
                              })
                            : t('marketLimitClose.positionClosed'),
                    message: `${t('transactions.successfullyClosedPosition', { usdValueOfOrderStr, symbol: symbolInfo?.coin })}`,
                    icon: 'check',
                    txLink: getTxLink(result.signature),
                    removeAfter: 5000,
                });
            } else {
                if (typeof plausible === 'function') {
                    plausible('Onchain Action', {
                        props: {
                            actionType: 'Market Close Fail',
                            orderType: 'Market',
                            success: false,
                            errorMessage: result.error || 'Transaction failed',
                            direction: closingSide === 'buy' ? 'Buy' : 'Sell',
                            txBuildDuration: getDurationSegment(
                                timeOfTxBuildStart,
                                result.timeOfSubmission,
                            ),
                            txDuration: getDurationSegment(
                                result.timeOfSubmission,
                                Date.now(),
                            ),
                            txSignature: result.signature,
                        },
                    });
                }
                notifications.add({
                    title: t('transactions.closeFailedTitle'),
                    message: result.error || t('transactions.closeFailed'),
                    icon: 'error',
                    removeAfter: 10000,
                    txLink: getTxLink(result.signature),
                });
            }
        } catch (error) {
            console.error('❌ Error closing position:', error);
            notifications.add({
                title: t('transactions.closeFailedTitle'),
                message:
                    error instanceof Error
                        ? error.message
                        : t('transactions.unknownErrorOccurred'),
                icon: 'error',
                removeAfter: 10000,
            });
            if (typeof plausible === 'function') {
                plausible('Offchain Failure', {
                    props: {
                        actionType: 'Market Close Fail',
                        orderType: 'Market',
                        success: false,
                        errorMessage:
                            error instanceof Error
                                ? error.message
                                : 'Unknown error occurred',
                    },
                });
            }
        } finally {
            setIsProcessingOrder(false);
            close();
        }
    }

    const handleConfirm = () => {
        if (isProcessingOrder || isOverLimit) return;

        console.log('confirm market close');
        executeMarketClose();
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const activeElement = document.activeElement;
            const isInputActive =
                activeElement?.tagName === 'INPUT' ||
                activeElement?.tagName === 'TEXTAREA';

            if (e.key === 'Enter') {
                e.preventDefault();
                handleConfirm();
                return;
            }

            if (isInputActive) return;

            if (e.key === 'Escape') {
                e.preventDefault();
                close();
                return;
            }

            // Left and right arrow keys
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                e.preventDefault();
                const step = 5;
                const newValue =
                    e.key === 'ArrowRight'
                        ? Math.min(100, sizePercentageValue + step)
                        : Math.max(0, sizePercentageValue - step);

                handlePositionSizeChange(newValue);
                return;
            }

            if (e.key === 'Home') {
                e.preventDefault();
                handlePositionSizeChange(0);
                return;
            }

            if (e.key === 'End') {
                e.preventDefault();
                handlePositionSizeChange(100);
                return;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [sizePercentageValue, isProcessingOrder, isOverLimit, close]);

    return (
        <Modal title={t('marketLimitClose.marketHeading')} close={close}>
            <div className={styles.container}>
                <p className={styles.description}>
                    {t('marketLimitClose.marketDescription')}
                </p>
                <div className={styles.content}>
                    <SizeInput
                        inputId='market-close-size-input'
                        value={sizeDisplay}
                        onChange={handleSizeChange}
                        onFocus={handleOnFocus}
                        onBlur={handleSizeInputBlur}
                        onKeyDown={(e) => console.log('Size keydown', e.key)}
                        className=''
                        ariaLabel='size-input'
                        useTotalSize={false}
                        symbol={position.coin}
                        selectedDenom={selectedDenom}
                        setSelectedDenom={setSelectedDenom}
                        isModal
                    />
                    <div className={styles.position_size_container}>
                        <PositionSize
                            value={sizePercentageValue}
                            onChange={handlePositionSizeChange}
                            isModal
                        />
                        {isOverLimit && (
                            <div className={styles.warning_message}>
                                {getWarningMessage()}
                            </div>
                        )}
                    </div>
                    {markPx && (
                        <p
                            className={
                                estimatedPNL >= 0
                                    ? styles.estimatedPnlPositive
                                    : styles.estimatedPnlNegative
                            }
                        >
                            {t('marketLimitClose.estimatedClosedPnl', {
                                estimatedPNL: formatNum(
                                    estimatedPNL,
                                    2,
                                    true,
                                    true,
                                ),
                            })}
                        </p>
                    )}

                    <SimpleButton
                        onClick={handleConfirm}
                        bg='accent1'
                        disabled={
                            isProcessingOrder ||
                            isOverLimit ||
                            (isQtyLessThanMinValue && !isCompleteClose)
                        }
                    >
                        {isQtyLessThanMinValue && !isCompleteClose
                            ? t('marketLimitClose.minimumOr100Percent', {
                                  min: formatNum(
                                      MIN_ORDER_VALUE,
                                      2,
                                      true,
                                      true,
                                  ),
                              })
                            : isProcessingOrder
                              ? t('transactions.processing')
                              : t('common.confirm')}
                    </SimpleButton>
                </div>
            </div>
        </Modal>
    );
}
