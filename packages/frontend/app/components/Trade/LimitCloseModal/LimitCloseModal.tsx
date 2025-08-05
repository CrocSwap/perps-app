import React, { useEffect, useRef, useState } from 'react';
import Modal from '~/components/Modal/Modal';
import SimpleButton from '~/components/SimpleButton/SimpleButton';
import { useLimitOrderService } from '~/hooks/useLimitOrderService';
import useNumFormatter from '~/hooks/useNumFormatter';
import { type useAppOptionsIF, useAppOptions } from '~/stores/AppOptionsStore';
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
import PriceInput from '../OrderInput/PriceInput/PriceInput';
import SizeInput from '../OrderInput/SizeInput/SizeInput';
import styles from './LimitCloseModal.module.css';

interface PropsIF {
    close: () => void;
    position: PositionIF;
}

export default function LimitCloseModal({ close, position }: PropsIF) {
    const { formatNumWithOnlyDecimals } = useNumFormatter();

    const { symbolInfo } = useTradeDataStore();

    const activeOptions: useAppOptionsIF = useAppOptions();

    const { executeLimitOrder } = useLimitOrderService();

    const [isProcessingOrder, setIsProcessingOrder] = useState(false);

    const {
        parseFormattedNum,
        formatNum,
        // parseFormattedWithOnlyDecimals
    } = useNumFormatter();

    const isPositionLong = position.szi > 0;

    const { buys, sells } = useOrderBookStore();

    const markPx = symbolInfo?.markPx;

    const getMidPrice = () => {
        if (!buys.length || !sells.length) return null;
        const midPrice = (buys[0].px + sells[0].px) / 2;
        return midPrice;
    };

    const [price, setPrice] = useState(String(getMidPrice()));
    const [selectedMode, setSelectedMode] = useState<OrderBookMode>('symbol');
    const [isMidModeActive, setIsMidModeActive] = useState(false);

    const originalSize = Math.abs(position.szi);

    const [positionSize, setPositionSize] = useState(100);
    const [notionalSymbolQtyNum, setNotionalSymbolQtyNum] =
        useState(originalSize);
    const [sizeDisplay, setSizeDisplay] = useState('');
    const [isOverLimit, setIsOverLimit] = useState(false);
    const [isEditingSizeInput, setIsEditingSizeInput] = useState(false);

    // the useeffect was updating and reformatting user input so I added this to track it to differentiate between the input and the slider
    const lastChangedBySlider = useRef(true);

    const estimatedPNL = isPositionLong
        ? sizeNum * (parseFormattedNum(price) - position.entryPx)
        : sizeNum * (position.entryPx - parseFormattedNum(price));

    useEffect(() => {
        if (isMidModeActive) {
            setMidPriceAsPriceInput();
        }
    }, [
        isMidModeActive,
        !buys.length,
        !sells.length,
        buys?.[0]?.px,
        sells?.[0]?.px,
        markPx,
    ]);

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

    useEffect(() => {
        console.log(
            'Mode switched to:',
            selectedMode,
            'sizeDisplay:',
            sizeDisplay,
            'markPx:',
            markPx,
        );
    }, [selectedMode]);

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

    function roundDownToTenth(value: number) {
        return Math.floor(value * 10) / 10;
    }

    const handlePositionSizeChange = (val: number) => {
        // for slider input
        lastChangedBySlider.current = true;
        setPositionSize(val);
        setIsOverLimit(val === 0);
    };

    const getWarningMessage = () => {
        if (Math.abs(notionalSymbolQtyNum) < 1e-8) return 'Size cannot be zero';
        if (notionalSymbolQtyNum > originalSize)
            return 'Size cannot exceed your position size';
        if (notionalSymbolQtyNum < 0) return 'Please enter a valid size';
        return '';
    };

    const setMidPriceAsPriceInput = () => {
        if (buys.length > 0 && sells.length > 0) {
            const resolution = buys[0].px - buys[1].px;
            const midOrMarkPrice = resolution <= 1 ? getMidPrice() : markPx;
            if (!midOrMarkPrice) return;
            const formattedMidPrice = formatNumWithOnlyDecimals(
                midOrMarkPrice,
                6,
                true,
            );
            setPrice(formattedMidPrice);
            setIsMidModeActive(true);
        }
    };
    const notifications: NotificationStoreIF = useNotificationStore();

    // fn to submit a 'Buy' limit order
    async function submitLimitBuy(): Promise<void> {
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

        // Validate price
        const limitPrice = parseFormattedNum(price);
        if (!limitPrice || limitPrice <= 0) {
            notifications.add({
                title: 'Invalid Price',
                message: 'Please enter a valid limit price',
                icon: 'error',
            });
            close();
            return;
        }

        setIsProcessingOrder(true);

        if (activeOptions.skipOpenOrderConfirm) {
            close();
            // Show pending notification
            notifications.add({
                title: 'Buy / Long Limit Order Pending',
                message: `Buying ${formatNum(notionalSymbolQtyNum)} ${symbolInfo?.coin} at ${formatNum(limitPrice)}`,
                icon: 'spinner',
            });
        }

        try {
            // Execute limit order
            const result = await executeLimitOrder({
                quantity: notionalSymbolQtyNum,
                price: roundDownToTenth(limitPrice),
                side: 'buy',
            });

            if (result.success) {
                notifications.add({
                    title: 'Limit Order Placed',
                    message: `Successfully placed buy order for ${formatNum(notionalSymbolQtyNum)} ${symbolInfo?.coin} at ${formatNum(limitPrice)}`,
                    icon: 'check',
                    txLink: `${blockExplorer}/tx/${result.signature}`,
                    removeAfter: 10000,
                });
            } else {
                notifications.add({
                    title: 'Limit Order Failed',
                    message: result.error || 'Failed to place limit order',
                    icon: 'error',
                    removeAfter: 15000,
                    txLink: result.signature
                        ? `${blockExplorer}/tx/${result.signature}`
                        : undefined,
                });
            }
        } catch (error) {
            console.error('❌ Error submitting limit buy order:', error);
            notifications.add({
                title: 'Limit Order Failed',
                message:
                    error instanceof Error
                        ? error.message
                        : 'Unknown error occurred',
                icon: 'error',
                removeAfter: 15000,
            });
        } finally {
            setIsProcessingOrder(false);
            close();
        }
    }

    // fn to submit a 'Sell' limit order
    async function submitLimitSell(): Promise<void> {
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

        // Validate price
        const limitPrice = parseFormattedNum(price);
        if (!limitPrice || limitPrice <= 0) {
            notifications.add({
                title: 'Invalid Price',
                message: 'Please enter a valid limit price',
                icon: 'error',
            });
            close();
            return;
        }

        setIsProcessingOrder(true);

        if (activeOptions.skipOpenOrderConfirm) {
            close();
            // Show pending notification
            notifications.add({
                title: 'Sell / Short Limit Order Pending',
                message: `Selling ${formatNum(notionalSymbolQtyNum)} ${symbolInfo?.coin} at ${formatNum(limitPrice)}`,
                icon: 'spinner',
            });
        }

        try {
            // Execute limit order
            const result = await executeLimitOrder({
                quantity: notionalSymbolQtyNum,
                price: roundDownToTenth(limitPrice),
                side: 'sell',
            });

            if (result.success) {
                notifications.add({
                    title: 'Limit Order Placed',
                    message: `Successfully placed sell order for ${formatNum(notionalSymbolQtyNum)} ${symbolInfo?.coin} at ${formatNum(limitPrice)}`,
                    icon: 'check',
                    txLink: `${blockExplorer}/tx/${result.signature}`,
                    removeAfter: 10000,
                });
            } else {
                notifications.add({
                    title: 'Limit Order Failed',
                    message: result.error || 'Failed to place limit order',
                    icon: 'error',
                    removeAfter: 15000,
                    txLink: result.signature
                        ? `${blockExplorer}/tx/${result.signature}`
                        : undefined,
                });
            }
        } catch (error) {
            console.error('❌ Error submitting limit sell order:', error);
            notifications.add({
                title: 'Limit Order Failed',
                message:
                    error instanceof Error
                        ? error.message
                        : 'Unknown error occurred',
                icon: 'error',
                removeAfter: 15000,
            });
        } finally {
            setIsProcessingOrder(false);
            close();
        }
    }
    const handleConfirm = () => {
        if (isProcessingOrder || isOverLimit) return;

        console.log('confirm');
        if (isPositionLong) {
            submitLimitSell();
        } else {
            submitLimitBuy();
        }
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
        <Modal title='Limit Close' close={close}>
            <div className={styles.container}>
                <p className={styles.description}>
                    This will send an order to close your position at the limit
                    price.
                </p>
                <div className={styles.content}>
                    <PriceInput
                        value={price}
                        onChange={(val) => {
                            setIsMidModeActive(false);
                            if (typeof val === 'string') {
                                setPrice(val);
                            } else if (val?.target?.value !== undefined) {
                                setPrice(val.target.value);
                            }
                        }}
                        onBlur={(e) => console.log('Price blur', e)}
                        onKeyDown={(e) => console.log('Price keydown', e.key)}
                        className=''
                        ariaLabel='price-input'
                        showMidButton={true}
                        setMidPriceAsPriceInput={setMidPriceAsPriceInput}
                        isMidModeActive={isMidModeActive}
                        setIsMidModeActive={setIsMidModeActive}
                        isModal
                    />

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
                    {price && (
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
                        disabled={isProcessingOrder || isOverLimit}
                    >
                        {isProcessingOrder ? 'Processing...' : 'Confirm'}
                    </SimpleButton>
                </div>
            </div>
        </Modal>
    );
}
