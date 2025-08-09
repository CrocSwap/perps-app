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
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { blockExplorer } from '~/utils/Constants';
import type { OrderBookMode } from '~/utils/orderbook/OrderBookIFs';
import type { PositionIF } from '~/utils/UserDataIFs';
import PositionSize from '../OrderInput/PositionSIze/PositionSize';
import SizeInput from '../OrderInput/SizeInput/SizeInput';
import styles from './MarketCloseModal.module.css';

interface PropsIF {
    close: () => void;
    position: PositionIF;
}

export default function MarketCloseModal({ close, position }: PropsIF) {
    const { formatNumWithOnlyDecimals } = useNumFormatter();

    const { symbolInfo } = useTradeDataStore();

    const { executeMarketOrder } = useMarketOrderService();
    const { buys, sells } = useOrderBookStore();

    const [isProcessingOrder, setIsProcessingOrder] = useState(false);

    const { parseFormattedNum, formatNum } = useNumFormatter();

    const MIN_ORDER_VALUE = 1;

    const isPositionLong = position.szi > 0;

    const markPx = symbolInfo?.markPx;

    const [selectedMode, setSelectedMode] = useState<OrderBookMode>('usd');

    const originalSize = Math.abs(position.szi);

    const [positionSize, setPositionSize] = useState(100);
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

    const isLessThanMinValue = useMemo(() => {
        return notionalSymbolQtyNum * (markPx || 1) < MIN_ORDER_VALUE;
    }, [markPx, notionalSymbolQtyNum]);

    // Initialize sizeDisplay based on selectedMode
    useEffect(() => {
        if (!isEditingSizeInput) {
            if (selectedMode === 'symbol') {
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
    }, [notionalSymbolQtyNum, selectedMode, isEditingSizeInput, markPx]);

    // Update sizeDisplay when markPx changes
    useEffect(() => {
        if (
            !isEditingSizeInput &&
            selectedMode !== 'symbol' &&
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
            selectedMode === 'usd' &&
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
    }, [selectedMode]);

    useEffect(() => {
        if (!lastChangedBySlider.current) return;

        const calculatedSize = (originalSize * positionSize) / 100;
        setNotionalSymbolQtyNum(calculatedSize);

        if (Math.abs(calculatedSize) < 1e-8) {
            setIsOverLimit(true);
        } else if (positionSize > 0) {
            if (calculatedSize <= originalSize && calculatedSize > 0) {
                setIsOverLimit(false);
            }
        }
    }, [positionSize, originalSize]);

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
                selectedMode === 'symbol' ? parsed : parsed / (markPx || 1);
            setNotionalSymbolQtyNum(adjusted);

            if (adjusted > originalSize) {
                setPositionSize(100);
                setIsOverLimit(true);
            } else if (Math.abs(adjusted) < 1e-8) {
                setPositionSize(0);
                setIsOverLimit(true);
            } else {
                const percentage = (adjusted / originalSize) * 100;
                setPositionSize(Math.round(Math.max(0, percentage)));
                setIsOverLimit(false);
            }
        } else if (sizeDisplay.trim() === '') {
            setNotionalSymbolQtyNum(0);
            setPositionSize(0);
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
        setPositionSize(val);
        setIsOverLimit(val === 0);
        setIsEditingSizeInput(false);
    };

    const getWarningMessage = () => {
        if (Math.abs(notionalSymbolQtyNum) < 1e-8) return 'Size cannot be zero';
        if (notionalSymbolQtyNum > originalSize)
            return 'Size cannot exceed your position size';
        if (notionalSymbolQtyNum < 0) return 'Please enter a valid size';
        return '';
    };

    const notifications: NotificationStoreIF = useNotificationStore();

    // fn to execute market close
    async function executeMarketClose(): Promise<void> {
        // Validate position size
        if (!notionalSymbolQtyNum || notionalSymbolQtyNum <= 0) {
            notifications.add({
                title: 'Invalid Order Size',
                message: 'Please enter a valid order size',
                icon: 'error',
            });
            close();
            return;
        }

        setIsProcessingOrder(true);

        try {
            // Get order book prices for the closing order
            const closingSide = isPositionLong ? 'sell' : 'buy';
            const bestBidPrice = buys.length > 0 ? buys[0].px : undefined;
            const bestAskPrice = sells.length > 0 ? sells[0].px : undefined;

            // Execute market order in opposite direction to close position
            const result = await executeMarketOrder({
                quantity: notionalSymbolQtyNum,
                side: closingSide,
                leverage: position.leverage?.value,
                bestBidPrice: closingSide === 'sell' ? bestBidPrice : undefined,
                bestAskPrice: closingSide === 'buy' ? bestAskPrice : undefined,
            });

            const usdValueOfOrderStr = formatNum(
                notionalSymbolQtyNum * (markPx || 0),
                2,
                true,
                true,
            );

            if (result.success) {
                notifications.add({
                    title: 'Position Closed',
                    message: `Successfully closed ${usdValueOfOrderStr} of ${symbolInfo?.coin} position`,
                    icon: 'check',
                    txLink: result.signature
                        ? `${blockExplorer}/tx/${result.signature}`
                        : undefined,
                    removeAfter: 5000,
                });
            } else {
                notifications.add({
                    title: 'Close Failed',
                    message: result.error || 'Failed to close position',
                    icon: 'error',
                    removeAfter: 10000,
                    txLink: result.signature
                        ? `${blockExplorer}/tx/${result.signature}`
                        : undefined,
                });
            }
        } catch (error) {
            console.error('❌ Error closing position:', error);
            notifications.add({
                title: 'Close Failed',
                message:
                    error instanceof Error
                        ? error.message
                        : 'Unknown error occurred',
                icon: 'error',
                removeAfter: 10000,
            });
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
                        ? Math.min(100, positionSize + step)
                        : Math.max(0, positionSize - step);

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
    }, [positionSize, isProcessingOrder, isOverLimit, close]);

    return (
        <Modal title='Market Close' close={close}>
            <div className={styles.container}>
                <p className={styles.description}>
                    This will send an order to close your position at the
                    current market price.
                </p>
                <div className={styles.content}>
                    <SizeInput
                        value={sizeDisplay}
                        onChange={handleSizeChange}
                        onFocus={handleOnFocus}
                        onBlur={handleSizeInputBlur}
                        onKeyDown={(e) => console.log('Size keydown', e.key)}
                        className=''
                        ariaLabel='size-input'
                        useTotalSize={false}
                        symbol={position.coin}
                        selectedMode={selectedMode}
                        setSelectedMode={setSelectedMode}
                        isModal
                    />
                    <div className={styles.position_size_container}>
                        <PositionSize
                            value={positionSize}
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
                            Estimated closed PNL (without fees):{' '}
                            <span>
                                {formatNum(estimatedPNL, 2, true, true)}
                            </span>
                        </p>
                    )}

                    <SimpleButton
                        onClick={handleConfirm}
                        bg='accent1'
                        disabled={
                            isProcessingOrder ||
                            isOverLimit ||
                            isLessThanMinValue
                        }
                    >
                        {isLessThanMinValue
                            ? `${formatNum(MIN_ORDER_VALUE, 2, true, true)} Minimum`
                            : isProcessingOrder
                              ? 'Processing...'
                              : 'Confirm'}
                    </SimpleButton>
                </div>
            </div>
        </Modal>
    );
}
