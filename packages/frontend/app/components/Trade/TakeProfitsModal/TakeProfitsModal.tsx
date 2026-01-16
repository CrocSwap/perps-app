import { useEffect, useMemo, useState } from 'react';
import styles from './TakeProfitsModal.module.css';
import ToggleSwitch from '../ToggleSwitch/ToggleSwitch';
import type { PositionIF } from '~/utils/UserDataIFs';
import ComboBox from '~/components/Inputs/ComboBox/ComboBox';
import PositionSize from '~/components/Trade/OrderInput/PositionSIze/PositionSize';
import {
    pctFromDollars,
    dollarsFromPct,
} from '~/utils/functions/profitLossConversions';
import { t } from 'i18next';
import getAbbreviatedPrice from '~/utils/functions/getAbbreviatedPrice';
import limitDecimalPlaces from '~/utils/functions/limitDecimalPlaces';

type Currency = '$' | '%';

interface PropIF {
    closeTPModal: () => void;
    position: PositionIF;
    markPrice?: number;
    baseSymbol?: string;
    qtyStep?: number;
}

export default function TakeProfitsModal(props: PropIF) {
    const { closeTPModal, position, markPrice, qtyStep } = props;

    const totalBaseQuantity = Math.abs(position.szi ?? 0);
    const entryPrice = position.entryPx;
    const markOrEntryPrice = markPrice || position.entryPx;
    const positionQuantity = Math.abs(position.szi ?? 0);
    const isLong = position.szi > 0;

    const [hasTakeProfitGainBeenTouched, setHasTakeProfitGainBeenTouched] =
        useState(false);
    const [hasStopLossLossBeenTouched, setHasStopLossLossBeenTouched] =
        useState(false);
    const [takeProfitPrice, setTakeProfitPrice] = useState(
        position.tp ? position.tp.toString() : '',
    );
    const [stopLossPrice, setStopLossPrice] = useState(
        position.sl ? position.sl.toString() : '',
    );
    const [takeProfitGain, setTakeProfitGain] = useState('');
    const [stopLossLoss, setStopLossLoss] = useState('');
    const [tpGainCurrency, setTpGainCurrency] = useState<Currency>('$');
    const [slLossCurrency, setSlLossCurrency] = useState<Currency>('$');

    // Form state for toggles
    const [form, setForm] = useState({
        isCustomAllocationEnabled: false,
        isLimitOrderEnabled: false,
    });

    // UI state for toggles
    const [ui, setUi] = useState({
        allocationPercentage: 100,
        takeProfitLimitInput: '',
        stopLossLimitInput: '',
    });

    const currencyOptions: Currency[] = ['$', '%'];

    const formatCrypto = (value: number) =>
        value.toFixed(8).replace(/\.?0+$/, '');

    // Calculate effective position quantity based on allocation percentage
    const effectivePositionQuantity = useMemo(() => {
        return form.isCustomAllocationEnabled
            ? positionQuantity * (ui.allocationPercentage / 100)
            : positionQuantity;
    }, [
        positionQuantity,
        form.isCustomAllocationEnabled,
        ui.allocationPercentage,
    ]);

    // Re-run calculations when position size or allocation changes
    useEffect(() => {
        // If we have a take profit price set, recalculate the gain
        if (takeProfitPrice && !hasTakeProfitGainBeenTouched) {
            updateGainFromPrice(takeProfitPrice);
        }
        // If we have a take profit gain set, recalculate the price
        if (takeProfitGain && hasTakeProfitGainBeenTouched) {
            updatePriceFromGain(takeProfitGain);
        }
        // If we have a stop loss price set, recalculate the loss
        if (stopLossPrice && !hasStopLossLossBeenTouched) {
            updateLossFromPrice(stopLossPrice);
        }
        // If we have a stop loss loss set, recalculate the price
        if (stopLossLoss && hasStopLossLossBeenTouched) {
            updatePriceFromLoss(stopLossLoss);
        }
    }, [
        effectivePositionQuantity,
        markPrice,
        takeProfitPrice,
        takeProfitGain,
        stopLossPrice,
        stopLossLoss,
        hasTakeProfitGainBeenTouched,
        hasStopLossLossBeenTouched,
    ]);

    const updatePriceFromGain = (gainValue: string) => {
        if (!markPrice || !gainValue || !effectivePositionQuantity) return;

        const gain = parseFloat(gainValue);
        let newPrice: number;

        if (tpGainCurrency === '$') {
            newPrice = isLong
                ? markPrice + gain / effectivePositionQuantity
                : markPrice - gain / effectivePositionQuantity;
        } else {
            const multiplier = isLong ? 1 + gain / 100 : 1 - gain / 100;
            newPrice = markPrice * multiplier;
        }

        setTakeProfitPrice(getAbbreviatedPrice(newPrice));
    };

    const updatePriceFromLoss = (lossValue: string) => {
        if (!markPrice || !lossValue || !effectivePositionQuantity) return;

        const loss = parseFloat(lossValue);
        let newPrice: number;

        if (slLossCurrency === '$') {
            newPrice = isLong
                ? markPrice - loss / effectivePositionQuantity
                : markPrice + loss / effectivePositionQuantity;
        } else {
            const multiplier = isLong ? 1 - loss / 100 : 1 + loss / 100;
            newPrice = markPrice * multiplier;
        }

        setStopLossPrice(getAbbreviatedPrice(newPrice));
    };

    const calculateExpectedProfit = (): number | null => {
        if (!takeProfitPrice && !takeProfitGain) return null;

        let targetPrice: number;

        if (takeProfitPrice) {
            targetPrice = parseFloat(takeProfitPrice);
        } else if (takeProfitGain && markPrice) {
            const gain = parseFloat(takeProfitGain);
            if (tpGainCurrency === '$') {
                targetPrice = isLong
                    ? markPrice + gain / effectivePositionQuantity
                    : markPrice - gain / effectivePositionQuantity;
            } else {
                const multiplier = isLong ? 1 + gain / 100 : 1 - gain / 100;
                targetPrice = markPrice * multiplier;
            }
        } else {
            return null;
        }

        if (!markPrice || !effectivePositionQuantity) return null;

        const priceDiff = isLong
            ? targetPrice - markPrice
            : markPrice - targetPrice;

        return priceDiff * effectivePositionQuantity;
    };

    const calculateExpectedLoss = (): number | null => {
        if (!stopLossPrice && !stopLossLoss) return null;

        let targetPrice: number;

        if (stopLossPrice) {
            targetPrice = parseFloat(stopLossPrice);
        } else if (stopLossLoss && markPrice) {
            const loss = parseFloat(stopLossLoss);
            if (slLossCurrency === '$') {
                targetPrice = isLong
                    ? markPrice - loss / effectivePositionQuantity
                    : markPrice + loss / effectivePositionQuantity;
            } else {
                const multiplier = isLong ? 1 - loss / 100 : 1 + loss / 100;
                targetPrice = markPrice * multiplier;
            }
        } else {
            return null;
        }

        if (!markPrice || !effectivePositionQuantity) return null;

        const priceDiff = isLong
            ? markPrice - targetPrice
            : targetPrice - markPrice;

        return priceDiff * effectivePositionQuantity;
    };

    const updateGainFromPrice = (priceValue: string) => {
        if (!priceValue || !markPrice || !effectivePositionQuantity) {
            return;
        }

        const price = parseFloat(priceValue);
        if (!Number.isFinite(price)) {
            return;
        }

        const priceDiff = isLong ? price - markPrice : markPrice - price;

        const gainUSD = priceDiff * effectivePositionQuantity;
        const gainValue =
            tpGainCurrency === '$'
                ? gainUSD.toFixed(2)
                : (
                      (gainUSD / (markPrice * effectivePositionQuantity)) *
                      100
                  ).toFixed(3);

        // Only update if user hasn't manually entered a gain value
        if (!hasTakeProfitGainBeenTouched) {
            setTakeProfitGain(gainValue.toString());
        }
    };

    const updateLossFromPrice = (priceValue: string) => {
        if (!priceValue || !markPrice || !effectivePositionQuantity) return;

        const price = parseFloat(priceValue);
        if (!Number.isFinite(price)) return;

        const priceDiff = isLong ? markPrice - price : price - markPrice;

        const lossUSD = priceDiff * effectivePositionQuantity;
        const lossValue =
            slLossCurrency === '$'
                ? lossUSD.toFixed(2)
                : (
                      (lossUSD / (markPrice * effectivePositionQuantity)) *
                      100
                  ).toFixed(3);

        // Only update if user hasn't manually entered a loss value
        if (!hasStopLossLossBeenTouched) {
            setStopLossLoss(lossValue.toString());
        }
    };

    const expectedProfit = useMemo(() => {
        return calculateExpectedProfit();
    }, [
        takeProfitPrice,
        takeProfitGain,
        tpGainCurrency,
        markPrice,
        effectivePositionQuantity,
        isLong,
    ]);

    const expectedLoss = useMemo(() => {
        return calculateExpectedLoss();
    }, [
        stopLossPrice,
        stopLossLoss,
        slLossCurrency,
        markPrice,
        effectivePositionQuantity,
        isLong,
    ]);

    const isFormValid = useMemo(() => {
        const hasTp =
            takeProfitPrice.trim() !== '' || takeProfitGain.trim() !== '';
        const hasSl = stopLossPrice.trim() !== '' || stopLossLoss.trim() !== '';
        return (hasTp || hasSl) && effectivePositionQuantity > 0;
    }, [
        takeProfitPrice,
        takeProfitGain,
        stopLossPrice,
        stopLossLoss,
        effectivePositionQuantity,
    ]);

    // Calculate allocated quantity based on percentage
    const allocatedQuantity = useMemo(() => {
        return (totalBaseQuantity * ui.allocationPercentage) / 100;
    }, [totalBaseQuantity, ui.allocationPercentage]);

    // Limit price handlers
    const onTakeProfitLimitBlur = () => {
        if (ui.takeProfitLimitInput.trim() !== '') {
            const limitPrice = parseFloat(ui.takeProfitLimitInput);
            if (Number.isFinite(limitPrice)) {
                setUi((u) => ({
                    ...u,
                    takeProfitLimitInput: limitPrice.toString(),
                }));
            }
        }
    };

    const onStopLossLimitBlur = () => {
        if (ui.stopLossLimitInput.trim() !== '') {
            const limitPrice = parseFloat(ui.stopLossLimitInput);
            if (Number.isFinite(limitPrice)) {
                setUi((u) => ({
                    ...u,
                    stopLossLimitInput: limitPrice.toString(),
                }));
            }
        }
    };

    const handleConfirm = () => {
        if (!isFormValid) return;

        const finalOrderSize = allocatedQuantity;

        const takeProfitTriggerPrice =
            takeProfitPrice !== '' ? parseFloat(takeProfitPrice) : undefined;
        const stopLossTriggerPrice =
            stopLossPrice !== '' ? parseFloat(stopLossPrice) : undefined;

        if (
            takeProfitTriggerPrice !== undefined &&
            !Number.isFinite(takeProfitTriggerPrice)
        )
            return;
        if (
            stopLossTriggerPrice !== undefined &&
            !Number.isFinite(stopLossTriggerPrice)
        )
            return;

        const orderSide = position.szi > 0 ? 'sell' : 'buy';
        const orderType = 'STOP_MARKET';

        if (takeProfitTriggerPrice !== undefined) {
            console.log('Placing Take Profit Order:', {
                symbol: position.coin,
                triggerPrice: takeProfitTriggerPrice,
                size: finalOrderSize,
                side: orderSide,
                reduceOnly: true,
                type: orderType,
                ocoGroupId: 'tp-sl-group',
            });
        }

        if (stopLossTriggerPrice !== undefined) {
            console.log('Placing Stop Loss Order:', {
                symbol: position.coin,
                triggerPrice: stopLossTriggerPrice,
                size: finalOrderSize,
                side: orderSide,
                reduceOnly: true,
                type: orderType,
                ocoGroupId: 'tp-sl-group',
            });
        }

        closeTPModal();
    };

    const headerInfo = [
        { label: 'Market', value: position.coin },
        {
            label: 'Position',
            value: `${formatCrypto(Math.abs(position.szi))} ${position.coin}`,
        },
        { label: 'Entry Price', value: formatCrypto(entryPrice) },
        { label: 'Mark Price', value: formatCrypto(markOrEntryPrice) },
    ];

    return (
        <div className={styles.container}>
            {/* --- INFO HEADER --- */}
            <section className={styles.infoContainer}>
                {headerInfo.map((item) => (
                    <div key={item.label} className={styles.infoItem}>
                        <p>{item.label}</p>
                        <p>{item.value}</p>
                    </div>
                ))}
            </section>

            {/* --- FORM --- */}
            <section className={styles.formContainer}>
                {/* Take Profit Row */}
                <div className={styles.formRow}>
                    <div className={styles.inputWithoutDropdown}>
                        <label htmlFor='takeProfitPriceInput'>TP Price</label>
                        <input
                            id='takeProfitPriceInput'
                            type='number'
                            value={takeProfitPrice}
                            onChange={(e) => {
                                const value = e.target.value;
                                setTakeProfitPrice(value);
                                setHasTakeProfitGainBeenTouched(false); // Reset touch state so gain can update from price
                                updateGainFromPrice(value);

                                // Clear gain if price is cleared
                                if (value === '') {
                                    setTakeProfitGain('');
                                }
                            }}
                        />
                    </div>

                    <div className={styles.inputWithDropdown}>
                        <label htmlFor='takeProfitGainInput'>Gain</label>
                        <input
                            id='takeProfitGainInput'
                            type='number'
                            value={takeProfitGain}
                            onChange={(e) => {
                                const value = e.target.value;
                                setTakeProfitGain(value);
                                setHasTakeProfitGainBeenTouched(true);
                                updatePriceFromGain(value);

                                // Clear price if gain is cleared
                                if (value === '') {
                                    setTakeProfitPrice('');
                                }
                            }}
                        />
                        <ComboBox
                            value={tpGainCurrency}
                            options={currencyOptions}
                            noMinWidth
                            onChange={(val) => {
                                const currency = val as '$' | '%';
                                if (currency === tpGainCurrency) return;

                                // Convert current gain value to USD first, then to new currency
                                if (
                                    takeProfitGain &&
                                    markPrice &&
                                    effectivePositionQuantity
                                ) {
                                    const currentGain =
                                        parseFloat(takeProfitGain);
                                    if (Number.isFinite(currentGain)) {
                                        // Convert current gain to USD
                                        const currentGainUSD =
                                            tpGainCurrency === '$'
                                                ? currentGain
                                                : (currentGain *
                                                      (markPrice *
                                                          effectivePositionQuantity)) /
                                                  100;

                                        // Convert USD to new currency
                                        const newGainValue =
                                            currency === '$'
                                                ? currentGainUSD.toFixed(2)
                                                : (
                                                      (currentGainUSD /
                                                          (markPrice *
                                                              effectivePositionQuantity)) *
                                                      100
                                                  ).toFixed(3);

                                        setTakeProfitGain(
                                            newGainValue.toString(),
                                        );
                                    }
                                }

                                setTpGainCurrency(currency);
                            }}
                            cssPositioning='fixed'
                        />
                    </div>
                </div>

                <span className={styles.expectedProfitText}>
                    {takeProfitGain ? (
                        <>
                            {expectedProfit && expectedProfit < 0
                                ? 'Expected Loss'
                                : 'Expected Profit'}
                            :{' '}
                            {expectedProfit == null ||
                            !markPrice ||
                            !effectivePositionQuantity
                                ? '...'
                                : tpGainCurrency === '%'
                                  ? `$${Math.abs(expectedProfit).toFixed(2)}`
                                  : `${pctFromDollars(
                                        Math.abs(expectedProfit),
                                        markPrice,
                                        effectivePositionQuantity,
                                    ).toFixed(3)}%`}
                        </>
                    ) : (
                        ''
                    )}
                </span>

                {/* Stop Loss Row */}
                <div className={styles.formRow}>
                    <div className={styles.inputWithoutDropdown}>
                        <label htmlFor='stopLossPriceInput'>SL Price</label>
                        <input
                            id='stopLossPriceInput'
                            type='number'
                            value={stopLossPrice}
                            onChange={(e) => {
                                const value = e.target.value;
                                setStopLossPrice(value);
                                setHasStopLossLossBeenTouched(false); // Reset touch state so loss can update from price
                                updateLossFromPrice(value);

                                // Clear loss if price is cleared
                                if (value === '') {
                                    setStopLossLoss('');
                                }
                            }}
                        />
                    </div>
                    <div className={styles.inputWithDropdown}>
                        <label htmlFor='stopLossLossInput'>Loss</label>
                        <input
                            id='stopLossLossInput'
                            type='number'
                            value={stopLossLoss}
                            onChange={(e) => {
                                const value = e.target.value;
                                setStopLossLoss(value);
                                setHasStopLossLossBeenTouched(true);
                                updatePriceFromLoss(value);

                                // Clear price if loss is cleared
                                if (value === '') {
                                    setStopLossPrice('');
                                }
                            }}
                        />
                        <ComboBox
                            value={slLossCurrency}
                            options={currencyOptions}
                            noMinWidth
                            onChange={(val) => {
                                const currency = val as '$' | '%';
                                if (currency === slLossCurrency) return;

                                // Convert current loss value to USD first, then to new currency
                                if (
                                    stopLossLoss &&
                                    markPrice &&
                                    effectivePositionQuantity
                                ) {
                                    const currentLoss =
                                        parseFloat(stopLossLoss);
                                    if (Number.isFinite(currentLoss)) {
                                        // Convert current loss to USD
                                        const currentLossUSD =
                                            slLossCurrency === '$'
                                                ? currentLoss
                                                : (currentLoss *
                                                      (markPrice *
                                                          effectivePositionQuantity)) /
                                                  100;

                                        // Convert USD to new currency
                                        const newLossValue =
                                            currency === '$'
                                                ? currentLossUSD.toFixed(2)
                                                : (
                                                      (currentLossUSD /
                                                          (markPrice *
                                                              effectivePositionQuantity)) *
                                                      100
                                                  ).toFixed(3);

                                        setStopLossLoss(
                                            newLossValue.toString(),
                                        );
                                    }
                                }

                                setSlLossCurrency(currency);
                            }}
                            cssPositioning='fixed'
                        />
                    </div>
                </div>

                <span className={styles.expectedProfitText}>
                    {stopLossLoss ? (
                        <>
                            {`${
                                expectedLoss && expectedLoss < 0
                                    ? 'Expected Profit'
                                    : 'Expected Loss'
                            }: `}
                            {expectedLoss == null ||
                            !markPrice ||
                            !effectivePositionQuantity
                                ? '...'
                                : slLossCurrency === '%'
                                  ? `$${Math.abs(expectedLoss).toFixed(2)}`
                                  : `${(
                                        (Math.abs(expectedLoss) /
                                            (markPrice *
                                                effectivePositionQuantity)) *
                                        100
                                    ).toFixed(3)}%`}
                        </>
                    ) : (
                        ''
                    )}
                </span>
            </section>

            {/* Toggles */}
            <section className={styles.toggleContainer}>
                <ToggleSwitch
                    isOn={form.isCustomAllocationEnabled}
                    onToggle={(v) =>
                        setForm((p) => ({
                            ...p,
                            isCustomAllocationEnabled:
                                v ?? !p.isCustomAllocationEnabled,
                        }))
                    }
                    label='Configure Amount'
                    reverse
                    aria-label={t('aria.toggleConfigureAmount')}
                />

                {form.isCustomAllocationEnabled && (
                    <>
                        <PositionSize
                            value={ui.allocationPercentage}
                            onChange={(v) =>
                                setUi((u) => ({
                                    ...u,
                                    allocationPercentage: v,
                                }))
                            }
                            isModal
                            className={styles.positionSizeRow}
                        />
                        <div className={styles.amountReadout}>
                            {formatCrypto(allocatedQuantity)} BTC (
                            {ui.allocationPercentage}% of{' '}
                            {formatCrypto(totalBaseQuantity)} BTC)
                        </div>
                    </>
                )}

                <ToggleSwitch
                    isOn={form.isLimitOrderEnabled}
                    onToggle={(v) =>
                        setForm((p) => ({
                            ...p,
                            isLimitOrderEnabled: v ?? !p.isLimitOrderEnabled,
                        }))
                    }
                    label='Limit Price'
                    reverse
                    aria-label={t('aria.toggleLimitPrice')}
                />

                {form.isLimitOrderEnabled && (
                    <div className={styles.formRow}>
                        <label
                            className={styles.inputWithoutDropdown}
                            htmlFor='takeProfitLimitPrice'
                        >
                            <span>TP Limit Price</span>
                            <input
                                id='takeProfitLimitPrice'
                                type='text'
                                inputMode='decimal'
                                value={ui.takeProfitLimitInput}
                                onChange={(e) => {
                                    const limitedValue = limitDecimalPlaces(
                                        e.target.value,
                                        8,
                                    );
                                    setUi((u) => ({
                                        ...u,
                                        takeProfitLimitInput: limitedValue,
                                    }));
                                }}
                                onBlur={onTakeProfitLimitBlur}
                            />
                        </label>

                        <label
                            className={styles.inputWithoutDropdown}
                            htmlFor='stopLossLimitPrice'
                        >
                            <span>SL Limit Price</span>
                            <input
                                id='stopLossLimitPrice'
                                type='text'
                                inputMode='decimal'
                                value={ui.stopLossLimitInput}
                                onChange={(e) => {
                                    const limitedValue = limitDecimalPlaces(
                                        e.target.value,
                                        8,
                                    );
                                    setUi((u) => ({
                                        ...u,
                                        stopLossLimitInput: limitedValue,
                                    }));
                                }}
                                onBlur={onStopLossLimitBlur}
                            />
                        </label>
                    </div>
                )}
            </section>

            {/* Confirm */}
            <button
                className={`${styles.confirmButton} ${
                    !isFormValid ? styles.disabled : ''
                }`}
                onClick={handleConfirm}
                disabled={!isFormValid}
            >
                Confirm
            </button>

            {/* Footer */}
            <section className={styles.textInfo}>
                <p>
                    By default, take-profit and stop-loss orders apply to the
                    entire position. These orders are automatically canceled
                    when the position is closed. When the stop-loss or
                    take-profit price is reached, a market order is triggered.
                </p>
                <p>
                    If an order size is set above, the take-profit or stop-loss
                    order will remain fixed for that amount, regardless of any
                    changes to the position in the future.
                </p>
            </section>
        </div>
    );
}
