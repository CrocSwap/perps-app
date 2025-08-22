import React, { useEffect, useMemo, useRef, useState } from 'react';
import Modal from '~/components/Modal/Modal';
import SimpleButton from '~/components/SimpleButton/SimpleButton';
import { useLimitOrderService } from '~/hooks/useLimitOrderService';
import useNumFormatter from '~/hooks/useNumFormatter';
import {
    type NotificationStoreIF,
    useNotificationStore,
} from '~/stores/NotificationStore';
import { useOrderBookStore } from '~/stores/OrderBookStore';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { blockExplorer } from '~/utils/Constants';
import { getDurationSegment } from '~/utils/functions/getDurationSegment';
import packageJson from '../../../../package.json';
import type { OrderBookMode } from '~/utils/orderbook/OrderBookIFs';
import type { PositionIF } from '~/utils/UserDataIFs';
import PositionSize from '../OrderInput/PositionSIze/PositionSize';
import PriceInput from '../OrderInput/PriceInput/PriceInput';
import SizeInput from '../OrderInput/SizeInput/SizeInput';
import styles from './LimitCloseModal.module.css';
import { toast } from 'sonner';
import Notification from '~/components/Notifications/Notification';

interface PropsIF {
    close: () => void;
    position: PositionIF;
}

export default function LimitCloseModal({ close, position }: PropsIF) {
    const { parseFormattedNum, formatNumWithOnlyDecimals, formatNum } =
        useNumFormatter();

    const { symbolInfo } = useTradeDataStore();

    const markPx = symbolInfo?.markPx || 1;

    const MIN_ORDER_VALUE = 1;

    const { executeLimitOrder } = useLimitOrderService();

    const [isProcessingOrder, setIsProcessingOrder] = useState(false);

    const isPositionLong = position.szi > 0;

    const { buys, sells } = useOrderBookStore();

    const getMidPrice = () => {
        if (!buys.length || !sells.length) return null;
        const midPrice = (buys[0].px + sells[0].px) / 2;
        return midPrice;
    };

    const [price, setPrice] = useState(String(getMidPrice()));
    const [selectedMode, setSelectedMode] = useState<OrderBookMode>('usd');
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
        ? notionalSymbolQtyNum * (parseFormattedNum(price) - position.entryPx)
        : notionalSymbolQtyNum * (position.entryPx - parseFormattedNum(price));

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
        setIsEditingSizeInput(false);
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

    const limitPrice = parseFormattedNum(price);

    const isLessThanMinValue = useMemo(() => {
        return notionalSymbolQtyNum * limitPrice < MIN_ORDER_VALUE;
    }, [limitPrice, notionalSymbolQtyNum]);

    async function submitLimitOrder(side: 'buy' | 'sell'): Promise<void> {
        // Validate position size
        if (!notionalSymbolQtyNum || notionalSymbolQtyNum <= 0) {
            notifications.add({
                title: 'Invalid Order Size',
                message: 'Please enter a valid order size',
                icon: 'error',
            });
            toast.custom(() => (
                <Notification
                    data={{
                        slug: 514351358,
                        title: 'Deposit Failed',
                        message: 'Please enter a valid order size',
                        icon: 'error',
                        removeAfter: 10000,
                    }}
                    dismiss={(num: number) => console.log(num)}
                />
            ));
            close();
            return;
        }

        // Validate price
        if (!limitPrice || limitPrice <= 0) {
            notifications.add({
                title: 'Invalid Price',
                message: 'Please enter a valid limit price',
                icon: 'error',
            });
            toast.custom(() => (
                <Notification
                    data={{
                        slug: 6764167,
                        title: 'Invalid Price',
                        message: 'Please enter a valid limit price',
                        icon: 'error',
                        removeAfter: 10000,
                    }}
                    dismiss={(num: number) => console.log(num)}
                />
            ));
            close();
            return;
        }

        setIsProcessingOrder(true);

        const usdValueOfOrderStr = formatNum(
            notionalSymbolQtyNum * markPx,
            2,
            true,
            true,
        );

        const timeOfSubmission = Date.now();
        try {
            // Execute limit order
            const result = await executeLimitOrder({
                quantity: notionalSymbolQtyNum,
                price: roundDownToTenth(limitPrice),
                side,
            });

            if (result.success) {
                if (typeof plausible === 'function') {
                    plausible('Onchain Action', {
                        props: {
                            version: packageJson.version,
                            actionType: 'Limit Close Success',
                            orderType: 'Limit',
                            direction: side === 'buy' ? 'Buy' : 'Sell',
                            txDuration: getDurationSegment(
                                timeOfSubmission,
                                Date.now(),
                            ),
                            txSignature: result.signature,
                        },
                    });
                }
                notifications.add({
                    title: `${side === 'buy' ? 'Buy / Long' : 'Sell / Short'} Limit Order Placed`,
                    message: `Successfully placed ${side} order for ${usdValueOfOrderStr} of ${symbolInfo?.coin} at ${formatNum(limitPrice, limitPrice > 10_000 ? 0 : 2, true, true)}`,
                    icon: 'check',
                    txLink: result.signature
                        ? `${blockExplorer}/tx/${result.signature}`
                        : undefined,
                    removeAfter: 5000,
                });
                toast.custom(() => (
                    <Notification
                        data={{
                            slug: 6764167,
                            title: 'Limit Order Placed',
                            message: `Successfully placed ${side} order for ${usdValueOfOrderStr} of ${symbolInfo?.coin} at ${formatNum(limitPrice)}`,
                            icon: 'error',
                            txLink: result.signature
                                ? `${blockExplorer}/tx/${result.signature}`
                                : undefined,
                            removeAfter: 5000,
                        }}
                        dismiss={(num: number) => console.log(num)}
                    />
                ));
            } else {
                if (typeof plausible === 'function') {
                    plausible('Onchain Action', {
                        props: {
                            version: packageJson.version,
                            actionType: 'Limit Close Fail',
                            orderType: 'Limit',
                            direction: side === 'buy' ? 'Buy' : 'Sell',
                            errorMessage: result.error || 'Transaction failed',
                            txDuration: getDurationSegment(
                                timeOfSubmission,
                                Date.now(),
                            ),
                            txSignature: result.signature,
                        },
                    });
                }
                notifications.add({
                    title: 'Limit Order Failed',
                    message: result.error || 'Failed to place limit order',
                    icon: 'error',
                    removeAfter: 10000,
                    txLink: result.signature
                        ? `${blockExplorer}/tx/${result.signature}`
                        : undefined,
                });
                toast.custom(() => (
                    <Notification
                        data={{
                            slug: 65462446467,
                            title: 'Limit Order Failed',
                            message:
                                result.error || 'Failed to place limit order',
                            icon: 'error',
                            removeAfter: 10000,
                            txLink: result.signature
                                ? `${blockExplorer}/tx/${result.signature}`
                                : undefined,
                        }}
                        dismiss={(num: number) => console.log(num)}
                    />
                ));
            }
        } catch (error) {
            console.error(`❌ Error submitting limit ${side} order:`, error);
            if (typeof plausible === 'function') {
                plausible('Offchain Failure', {
                    props: {
                        version: packageJson.version,
                        actionType: 'Limit Close Fail',
                        orderType: 'Limit',
                        direction: side === 'buy' ? 'Buy' : 'Sell',
                        errorMessage:
                            error instanceof Error
                                ? error.message
                                : 'Unknown error occurred',
                    },
                });
            }
            notifications.add({
                title: 'Limit Order Failed',
                message:
                    error instanceof Error
                        ? error.message
                        : 'Unknown error occurred',
                icon: 'error',
                removeAfter: 10000,
            });
            toast.custom(() => (
                <Notification
                    data={{
                        slug: 6764167,
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
        } finally {
            setIsProcessingOrder(false);
            close();
        }
    }

    const handleConfirm = () => {
        if (isProcessingOrder || isOverLimit) return;

        console.log('confirm');
        if (isPositionLong) {
            submitLimitOrder('sell');
        } else {
            submitLimitOrder('buy');
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
