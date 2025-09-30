import { useMemo, useState } from 'react';
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
    const updatePriceFromGain = (gainValue: string) => {
        if (!markPrice || !gainValue || !positionQuantity) return;

        const gain = parseFloat(gainValue);
        let newPrice: number;

        if (tpGainCurrency === '$') {
            newPrice = isLong
                ? markPrice + gain / positionQuantity
                : markPrice - gain / positionQuantity;
        } else {
            const multiplier = isLong ? 1 + gain / 100 : 1 - gain / 100;
            newPrice = markPrice * multiplier;
        }

        setTakeProfitPrice(newPrice.toFixed(2));
    };

    const updatePriceFromLoss = (lossValue: string) => {
        if (!markPrice || !lossValue || !positionQuantity) return;

        const loss = parseFloat(lossValue);
        let newPrice: number;

        if (slLossCurrency === '$') {
            newPrice = isLong
                ? markPrice - loss / positionQuantity
                : markPrice + loss / positionQuantity;
        } else {
            const multiplier = isLong ? 1 - loss / 100 : 1 + loss / 100;
            newPrice = markPrice * multiplier;
        }

        setStopLossPrice(newPrice.toFixed(2));
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
                    ? markPrice + gain / positionQuantity
                    : markPrice - gain / positionQuantity;
            } else {
                const multiplier = isLong ? 1 + gain / 100 : 1 - gain / 100;
                targetPrice = markPrice * multiplier;
            }
        } else {
            return null;
        }

        if (!markPrice || !positionQuantity) return null;

        const priceDiff = isLong
            ? targetPrice - markPrice
            : markPrice - targetPrice;

        return priceDiff * positionQuantity;
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
                    ? markPrice - loss / positionQuantity
                    : markPrice + loss / positionQuantity;
            } else {
                const multiplier = isLong ? 1 - loss / 100 : 1 + loss / 100;
                targetPrice = markPrice * multiplier;
            }
        } else {
            return null;
        }

        if (!markPrice || !positionQuantity) return null;

        const priceDiff = isLong
            ? markPrice - targetPrice
            : targetPrice - markPrice;

        return priceDiff * positionQuantity;
    };

    const updateGainFromPrice = (priceValue: string) => {
        if (!priceValue || !markPrice || !positionQuantity) {
            return;
        }

        const price = parseFloat(priceValue);
        if (!Number.isFinite(price)) {
            return;
        }

        const priceDiff = isLong ? price - markPrice : markPrice - price;

        const gainUSD = priceDiff * positionQuantity;
        const gainValue =
            tpGainCurrency === '$'
                ? gainUSD.toFixed(2)
                : ((gainUSD / (markPrice * positionQuantity)) * 100).toFixed(3);

        // Only update if user hasn't manually entered a gain value
        if (!hasTakeProfitGainBeenTouched) {
            setTakeProfitGain(gainValue.toString());
        }
    };

    const updateLossFromPrice = (priceValue: string) => {
        if (!priceValue || !markPrice || !positionQuantity) return;

        const price = parseFloat(priceValue);
        if (!Number.isFinite(price)) return;

        const priceDiff = isLong ? markPrice - price : price - markPrice;

        const lossUSD = priceDiff * positionQuantity;
        const lossValue =
            slLossCurrency === '$'
                ? lossUSD.toFixed(2)
                : ((lossUSD / (markPrice * positionQuantity)) * 100).toFixed(3);

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
        positionQuantity,
        isLong,
    ]);

    const expectedLoss = useMemo(() => {
        return calculateExpectedLoss();
    }, [
        stopLossPrice,
        stopLossLoss,
        slLossCurrency,
        markPrice,
        positionQuantity,
        isLong,
    ]);

    const isFormValid = useMemo(() => {
        const hasTp =
            takeProfitPrice.trim() !== '' || takeProfitGain.trim() !== '';
        const hasSl = stopLossPrice.trim() !== '' || stopLossLoss.trim() !== '';
        return (hasTp || hasSl) && positionQuantity > 0;
    }, [
        takeProfitPrice,
        takeProfitGain,
        stopLossPrice,
        stopLossLoss,
        positionQuantity,
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
                    takeProfitLimitInput: limitPrice.toFixed(6),
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
                    stopLossLimitInput: limitPrice.toFixed(6),
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
                                setTakeProfitPrice(e.target.value);
                                setHasTakeProfitGainBeenTouched(false); // Reset touch state so gain can update from price
                                updateGainFromPrice(e.target.value);
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
                                setTakeProfitGain(e.target.value);
                                setHasTakeProfitGainBeenTouched(true);
                                updatePriceFromGain(e.target.value);
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
                                    positionQuantity
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
                                                          positionQuantity)) /
                                                  100;

                                        // Convert USD to new currency
                                        const newGainValue =
                                            currency === '$'
                                                ? currentGainUSD.toFixed(2)
                                                : (
                                                      (currentGainUSD /
                                                          (markPrice *
                                                              positionQuantity)) *
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
                {takeProfitGain && (
                    <span className={styles.expectedProfitText}>
                        {expectedProfit && expectedProfit < 0
                            ? 'Expected Loss'
                            : 'Expected Profit'}
                        :{' '}
                        {expectedProfit == null ||
                        !markPrice ||
                        !positionQuantity
                            ? 'Calculating...'
                            : tpGainCurrency === '%'
                              ? `$${Math.abs(expectedProfit).toFixed(2)}`
                              : `${pctFromDollars(Math.abs(expectedProfit), markPrice, positionQuantity).toFixed(3)}%`}
                    </span>
                )}

                {/* Stop Loss Row */}
                <div className={styles.formRow}>
                    <div className={styles.inputWithoutDropdown}>
                        <label htmlFor='stopLossPriceInput'>SL Price</label>
                        <input
                            id='stopLossPriceInput'
                            type='number'
                            value={stopLossPrice}
                            onChange={(e) => {
                                setStopLossPrice(e.target.value);
                                setHasStopLossLossBeenTouched(false); // Reset touch state so loss can update from price
                                updateLossFromPrice(e.target.value);
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
                                setStopLossLoss(e.target.value);
                                setHasStopLossLossBeenTouched(true);
                                updatePriceFromLoss(e.target.value);
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
                                    positionQuantity
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
                                                          positionQuantity)) /
                                                  100;

                                        // Convert USD to new currency
                                        const newLossValue =
                                            currency === '$'
                                                ? currentLossUSD.toFixed(2)
                                                : (
                                                      (currentLossUSD /
                                                          (markPrice *
                                                              positionQuantity)) *
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
                {stopLossLoss && (
                    <span className={styles.expectedProfitText}>
                        {`${expectedLoss && expectedLoss < 0 ? 'Expected Profit' : 'Expected Loss'}: `}
                        {expectedLoss == null || !markPrice || !positionQuantity
                            ? 'Calculating...'
                            : slLossCurrency === '%'
                              ? `$${Math.abs(expectedLoss).toFixed(2)}`
                              : `${((Math.abs(expectedLoss) / (markPrice * positionQuantity)) * 100).toFixed(3)}%`}
                    </span>
                )}
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
                                onChange={(e) =>
                                    setUi((u) => ({
                                        ...u,
                                        takeProfitLimitInput: e.target.value,
                                    }))
                                }
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
                                onChange={(e) =>
                                    setUi((u) => ({
                                        ...u,
                                        stopLossLimitInput: e.target.value,
                                    }))
                                }
                                onBlur={onStopLossLimitBlur}
                            />
                        </label>
                    </div>
                )}
            </section>

            {/* Confirm */}
            <button
                className={`${styles.confirmButton} ${!isFormValid ? styles.disabled : ''}`}
                onClick={handleConfirm}
                disabled={!isFormValid}
            >
                Confirm
            </button>

            {/* Footer */}
            <section className={styles.textInfo}>
                <p>
                    By default take-profit and stop-loss orders apply to the
                    entire position. These orders automatically cancel after
                    closing the position. A market order is triggered when the
                    stop loss or take profit price is reached.
                </p>
            </section>
        </div>
    );
}
