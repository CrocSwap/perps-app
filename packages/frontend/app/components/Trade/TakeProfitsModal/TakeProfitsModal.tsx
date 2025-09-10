import { useMemo, useState } from 'react';
import styles from './TakeProfitsModal.module.css';
import ToggleSwitch from '../ToggleSwitch/ToggleSwitch';
import type { PositionIF } from '~/utils/UserDataIFs';
import ComboBox from '~/components/Inputs/ComboBox/ComboBox';

interface TPSLFormData {
    tpPrice: string;
    slPrice: string;
    gain: string;
    loss: string;
    gainCurrency: '$' | '%';
    lossCurrency: '$' | '%';
    configureAmount: boolean;
    limitPrice: boolean;
}

interface PropIF {
    closeTPModal: () => void;
    position: PositionIF;
    markPrice?: number;
}

export default function TakeProfitsModal(props: PropIF) {
    const { closeTPModal, position, markPrice } = props;

    const [formData, setFormData] = useState<TPSLFormData>({
        tpPrice: position.tp ? position.tp.toString() : '',
        slPrice: position.sl ? position.sl.toString() : '',
        gain: '',
        loss: '',
        gainCurrency: '$',
        lossCurrency: '$',
        configureAmount: false,
        limitPrice: false,
    });
    const [tpSource, setTpSource] = useState<'price' | 'gain' | null>(null);
    const [slSource, setSlSource] = useState<'price' | 'loss' | null>(null);

    // THIS IS JUST FOR WARNING VALIDATIONS-------------------------------------------
    const [tpPriceFocused, setTpPriceFocused] = useState(false);
    const [tpPriceTouched, setTpPriceTouched] = useState(false);
    const [gainFocused, setGainFocused] = useState(false);
    const [gainTouched, setGainTouched] = useState(false);

    const [slPriceFocused, setSlPriceFocused] = useState(false);
    const [slPriceTouched, setSlPriceTouched] = useState(false);
    const [lossFocused, setLossFocused] = useState(false);
    const [lossTouched, setLossTouched] = useState(false);

    // Show validation when the field driving the target has been blurred at least once
    const showTpValidation = useMemo(() => {
        if (tpSource === 'price') {
            return !!formData.tpPrice && tpPriceTouched && !tpPriceFocused;
        }
        if (tpSource === 'gain') {
            return !!formData.gain && gainTouched && !gainFocused;
        }
        // If no explicit source yet, only show after either candidate is blurred with a value
        return (
            (!!formData.tpPrice && tpPriceTouched && !tpPriceFocused) ||
            (!!formData.gain && gainTouched && !gainFocused)
        );
    }, [
        tpSource,
        formData.tpPrice,
        formData.gain,
        tpPriceTouched,
        tpPriceFocused,
        gainTouched,
        gainFocused,
    ]);

    const showSlValidation = useMemo(() => {
        if (slSource === 'price') {
            return !!formData.slPrice && slPriceTouched && !slPriceFocused;
        }
        if (slSource === 'loss') {
            return !!formData.loss && lossTouched && !lossFocused;
        }
        return (
            (!!formData.slPrice && slPriceTouched && !slPriceFocused) ||
            (!!formData.loss && lossTouched && !lossFocused)
        );
    }, [
        slSource,
        formData.slPrice,
        formData.loss,
        slPriceTouched,
        slPriceFocused,
        lossTouched,
        lossFocused,
    ]);

    // END OF VALIDATION---------------------------------------------------------------
    const currencyOptions: Array<'$' | '%'> = ['$', '%'];

    const baseForPnL = position.entryPx;
    const displayPrice = markPrice || position.entryPx;

    const qty = Math.abs(position.szi);
    const isLong = position.szi > 0;

    const tpFromGain = useMemo(() => {
        if (!formData.gain) return undefined;
        const gain = parseFloat(formData.gain);
        if (!Number.isFinite(gain) || !qty) return undefined;
        if (formData.gainCurrency === '$') {
            const priceChange = gain / qty;
            return isLong ? baseForPnL + priceChange : baseForPnL - priceChange;
        } else {
            const pct = gain / 100;
            return baseForPnL * (isLong ? 1 + pct : 1 - pct);
        }
    }, [formData.gain, formData.gainCurrency, qty, isLong, baseForPnL]);

    const slFromLoss = useMemo(() => {
        if (!formData.loss) return undefined;
        const loss = parseFloat(formData.loss);
        if (!Number.isFinite(loss) || !qty) return undefined;
        if (formData.lossCurrency === '$') {
            const priceChange = loss / qty;
            return isLong ? baseForPnL - priceChange : baseForPnL + priceChange;
        } else {
            const pct = loss / 100;
            return baseForPnL * (isLong ? 1 - pct : 1 + pct);
        }
    }, [formData.loss, formData.lossCurrency, qty, isLong, baseForPnL]);

    const tpTarget = useMemo(() => {
        const priceVal = formData.tpPrice
            ? parseFloat(formData.tpPrice)
            : undefined;
        if (tpSource === 'gain') return tpFromGain;
        if (tpSource === 'price') return priceVal;
        // fallback: prefer gain if present
        return tpFromGain ?? priceVal;
    }, [tpSource, formData.tpPrice, tpFromGain]);

    const slTarget = useMemo(() => {
        const priceVal = formData.slPrice
            ? parseFloat(formData.slPrice)
            : undefined;
        if (slSource === 'loss') return slFromLoss;
        if (slSource === 'price') return priceVal;
        // fallback: prefer loss if present
        return slFromLoss ?? priceVal;
    }, [slSource, formData.slPrice, slFromLoss]);

    const pnlAt = (target: number) => {
        const diff = isLong ? target - baseForPnL : baseForPnL - target;
        return diff * qty;
    };

    const expectedProfit = useMemo(() => {
        return Number.isFinite(tpTarget as number)
            ? pnlAt(tpTarget as number)
            : null;
    }, [tpTarget, baseForPnL, qty, isLong]);

    const expectedLoss = useMemo(() => {
        if (!Number.isFinite(slTarget as number)) return null;
        const raw = pnlAt(slTarget as number);
        return Math.abs(raw);
    }, [slTarget, baseForPnL, qty, isLong]);

    const tpInvalid =
        Number.isFinite(tpTarget as number) &&
        ((isLong && (tpTarget as number) <= baseForPnL) ||
            (!isLong && (tpTarget as number) >= baseForPnL));

    const slInvalid =
        Number.isFinite(slTarget as number) &&
        ((isLong && (slTarget as number) >= baseForPnL) ||
            (!isLong && (slTarget as number) <= baseForPnL));
    const pctAway = (target?: number) =>
        target ? Math.abs((target - baseForPnL) / baseForPnL) : 0;

    const OUTLIER_PCT = 0.5; // 30% away from entry price triggers warning
    const tpOutlier =
        Number.isFinite(tpTarget as number) &&
        pctAway(tpTarget as number) >= OUTLIER_PCT;
    const slOutlier =
        Number.isFinite(slTarget as number) &&
        pctAway(slTarget as number) >= OUTLIER_PCT;

    const updateTPPriceFromGain = (gainValue: string, currency?: '$' | '%') => {
        if (!gainValue || !qty) return;
        const gain = parseFloat(gainValue);
        const currencyToUse = currency || formData.gainCurrency;

        let newPrice: number;
        if (currencyToUse === '$') {
            // gain is TOTAL $ PnL for the whole position
            const priceChange = gain / qty;
            newPrice = isLong
                ? baseForPnL + priceChange
                : baseForPnL - priceChange;
        } else {
            // percentage gain
            const pct = gain / 100;
            newPrice = baseForPnL * (isLong ? 1 + pct : 1 - pct);
        }

        setFormData((prev) => ({ ...prev, tpPrice: newPrice.toFixed(6) }));
    };

    const updateSLPriceFromLoss = (lossValue: string, currency?: '$' | '%') => {
        if (!lossValue || !qty) return;
        const loss = parseFloat(lossValue);
        const currencyToUse = currency || formData.lossCurrency;

        let newPrice: number;
        if (currencyToUse === '$') {
            // loss is TOTAL $ PnL for the whole position
            const priceChange = loss / qty;
            newPrice = isLong
                ? baseForPnL - priceChange
                : baseForPnL + priceChange;
        } else {
            // percentage loss
            const pct = loss / 100;
            newPrice = baseForPnL * (isLong ? 1 - pct : 1 + pct);
        }

        setFormData((prev) => ({ ...prev, slPrice: newPrice.toFixed(6) }));
    };

    const placeTakeProfitOrder = async (): Promise<void> => {
        console.log('Place Take Profit order:', {
            coin: position.coin,
            price: formData.tpPrice,
            quantity: Math.abs(position.szi),
            side: position.szi > 0 ? 'sell' : 'buy',
            configureAmount: formData.configureAmount,
            limitPrice: formData.limitPrice,
        });
    };

    const placeStopLossOrder = async (): Promise<void> => {
        console.log('Place Stop Loss order:', {
            coin: position.coin,
            price: formData.slPrice,
            quantity: Math.abs(position.szi),
            side: position.szi > 0 ? 'sell' : 'buy',
            configureAmount: formData.configureAmount,
            limitPrice: formData.limitPrice,
        });
    };

    const infoData = [
        { label: 'Market', value: position.coin },
        {
            label: 'Position',
            value: `${Math.abs(position.szi)} ${position.coin}`,
        },
        { label: 'Entry Price', value: baseForPnL.toLocaleString() },
        { label: 'Mark Price', value: displayPrice.toLocaleString() },
    ];

    const handleInputChange = (
        field: keyof TPSLFormData,
        value: string | boolean,
    ) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));

        if (field === 'tpPrice' && typeof value === 'string') {
            setTpSource('price');
        } else if (field === 'gain' && typeof value === 'string') {
            setTpSource('gain');
            updateTPPriceFromGain(value);
        } else if (field === 'slPrice' && typeof value === 'string') {
            setSlSource('price');
        } else if (field === 'loss' && typeof value === 'string') {
            setSlSource('loss');
            updateSLPriceFromLoss(value);
        }
    };

    const handleCurrencyChange = (
        field: 'gainCurrency' | 'lossCurrency',
        newCurrency: '$' | '%',
    ) => {
        setFormData((prev) => ({
            ...prev,
            [field]: newCurrency,
        }));

        if (field === 'gainCurrency' && formData.gain) {
            setTpSource('gain');
            updateTPPriceFromGain(formData.gain, newCurrency);
        } else if (field === 'lossCurrency' && formData.loss) {
            setSlSource('loss');
            updateSLPriceFromLoss(formData.loss, newCurrency);
        }
    };

    const handleConfirm = async () => {
        if (!isFormValid()) {
            return;
        }

        console.log('Form submitted:', formData);

        try {
            if (formData.tpPrice) {
                await placeTakeProfitOrder();
            }

            if (formData.slPrice) {
                await placeStopLossOrder();
            }

            closeTPModal();
        } catch (error) {
            console.error('Error placing TP/SL orders:', error);
        }
    };

    const isFormValid = () => {
        const hasTp =
            formData.tpPrice.trim() !== '' || formData.gain.trim() !== '';
        const hasSl =
            formData.slPrice.trim() !== '' || formData.loss.trim() !== '';
        const somethingSet = hasTp || hasSl;

        const tpOk = !tpInvalid;
        const slOk = !slInvalid;

        // If TP is set, it must be valid; same for SL. If not set, ignore validity.
        const tpIsSet =
            formData.tpPrice.trim() !== '' || formData.gain.trim() !== '';
        const slIsSet =
            formData.slPrice.trim() !== '' || formData.loss.trim() !== '';

        const validWhenSet = (!tpIsSet || tpOk) && (!slIsSet || slOk);

        return somethingSet && validWhenSet;
    };

    return (
        <div className={styles.container}>
            <section className={styles.infoContainer}>
                {infoData.map((item, index) => (
                    <div key={index} className={styles.infoItem}>
                        <p>{item.label}</p>
                        <p>{item.value}</p>
                    </div>
                ))}
            </section>

            <section className={styles.formContainer}>
                <div className={styles.formRow}>
                    <div
                        className={`${styles.inputWithoutDropdown} ${showTpValidation && tpInvalid ? styles.fieldError : ''} ${showTpValidation && tpOutlier && !tpInvalid ? styles.fieldWarning : ''}`}
                    >
                        <p>TP Price</p>
                        <input
                            type='number'
                            value={formData.tpPrice}
                            onChange={(e) =>
                                handleInputChange('tpPrice', e.target.value)
                            }
                            onFocus={() => setTpPriceFocused(true)}
                            onBlur={() => {
                                setTpPriceFocused(false);
                                setTpPriceTouched(true);
                            }}
                            aria-invalid={tpInvalid || undefined}
                        />
                    </div>

                    <div className={styles.inputWithDropdown}>
                        <p>Gain</p>
                        <input
                            type='number'
                            value={formData.gain}
                            onChange={(e) =>
                                handleInputChange('gain', e.target.value)
                            }
                            onFocus={() => setGainFocused(true)}
                            onBlur={() => {
                                setGainFocused(false);
                                setGainTouched(true);
                            }}
                        />

                        <ComboBox
                            value={formData.gainCurrency}
                            options={currencyOptions}
                            onChange={(val) =>
                                handleCurrencyChange(
                                    'gainCurrency',
                                    val as '$' | '%',
                                )
                            }
                            cssPositioning='fixed'
                        />
                    </div>
                </div>
                <div className={styles.expectedProfitContainer}>
                    {(formData.tpPrice || formData.gain) && (
                        <span className={styles.expectedProfitText}>
                            Expected Profit:{' '}
                            {expectedProfit == null
                                ? '—'
                                : `$${expectedProfit.toFixed(2)}`}
                            {tpInvalid && showTpValidation && (
                                <span className={styles.validationError}>
                                    {' '}
                                    • TP must be {isLong
                                        ? 'above'
                                        : 'below'}{' '}
                                    entry
                                </span>
                            )}
                        </span>
                    )}
                </div>

                <div className={styles.formRow}>
                    <div
                        className={`${styles.inputWithoutDropdown} ${showSlValidation && slInvalid ? styles.fieldError : ''} ${showSlValidation && slOutlier && !slInvalid ? styles.fieldWarning : ''}`}
                    >
                        <p>SL Price</p>
                        <input
                            type='number'
                            value={formData.slPrice}
                            onChange={(e) =>
                                handleInputChange('slPrice', e.target.value)
                            }
                            onFocus={() => setSlPriceFocused(true)}
                            onBlur={() => {
                                setSlPriceFocused(false);
                                setSlPriceTouched(true);
                            }}
                            aria-invalid={slInvalid || undefined}
                        />
                    </div>

                    <div className={styles.inputWithDropdown}>
                        <p>Loss</p>
                        <input
                            type='number'
                            value={formData.loss}
                            onChange={(e) =>
                                handleInputChange('loss', e.target.value)
                            }
                            onFocus={() => setLossFocused(true)}
                            onBlur={() => {
                                setLossFocused(false);
                                setLossTouched(true);
                            }}
                        />

                        <ComboBox
                            value={formData.lossCurrency}
                            options={currencyOptions}
                            onChange={(val) =>
                                handleCurrencyChange(
                                    'lossCurrency',
                                    val as '$' | '%',
                                )
                            }
                            cssPositioning='fixed'
                        />
                    </div>
                </div>
                <div className={styles.expectedProfitContainer}>
                    {(formData.slPrice || formData.loss) && (
                        <span className={styles.expectedProfitText}>
                            Expected Loss:{' '}
                            {expectedLoss == null
                                ? '—'
                                : `-$${expectedLoss.toFixed(2)}`}
                            {slInvalid && showSlValidation && (
                                <span className={styles.validationError}>
                                    {' '}
                                    • SL must be {isLong
                                        ? 'below'
                                        : 'above'}{' '}
                                    entry
                                </span>
                            )}
                        </span>
                    )}
                </div>
            </section>

            <section className={styles.toggleContainer}>
                <ToggleSwitch
                    isOn={formData.configureAmount}
                    onToggle={(newState) =>
                        handleInputChange(
                            'configureAmount',
                            newState ?? !formData.configureAmount,
                        )
                    }
                    label='Configure Amount'
                    reverse
                />
                <ToggleSwitch
                    isOn={formData.limitPrice}
                    onToggle={(newState) =>
                        handleInputChange(
                            'limitPrice',
                            newState ?? !formData.limitPrice,
                        )
                    }
                    label='Limit Price'
                    reverse
                />
            </section>
            <div className={styles.warningContainer}>
                {!tpInvalid && tpOutlier && showTpValidation && (
                    <span className={styles.warningText}>
                        {' '}
                        TP is {(pctAway(tpTarget as number) * 100).toFixed(1)}%
                        from entry — double-check your input
                    </span>
                )}
                {!slInvalid && slOutlier && showSlValidation && (
                    <span className={styles.warningText}>
                        {' '}
                        SL is {(pctAway(slTarget as number) * 100).toFixed(1)}%
                        from entry — double-check your input
                    </span>
                )}
            </div>

            <button
                className={`${styles.confirmButton} ${!isFormValid() ? styles.disabled : ''}`}
                onClick={handleConfirm}
                disabled={!isFormValid()}
            >
                Confirm
            </button>

            <section className={styles.textInfo}>
                <p>
                    By default take-profit and stop-loss orders apply to the
                    entire position. Take-profit and stop-loss automatically
                    cancel after closing the position. A market order is
                    triggered when the stop loss or take profit price is
                    reached.
                </p>
                <p>
                    If the order size is configured above, the TP/SL order will
                    be for that size no matter how the position changes in the
                    future.
                </p>
            </section>
        </div>
    );
}
