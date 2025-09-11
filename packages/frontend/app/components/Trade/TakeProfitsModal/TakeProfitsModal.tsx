import { useMemo, useState, useEffect, useRef } from 'react';
import styles from './TakeProfitsModal.module.css';
import ToggleSwitch from '../ToggleSwitch/ToggleSwitch';
import type { PositionIF } from '~/utils/UserDataIFs';
import ComboBox from '~/components/Inputs/ComboBox/ComboBox';
import PositionSize from '../OrderInput/PositionSIze/PositionSize';

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
    baseSymbol?: string;
    qtyStep?: number;
}

export default function TakeProfitsModal(props: PropIF) {
    const { closeTPModal, position, markPrice, baseSymbol, qtyStep } = props;

    const totalBase = Math.abs(position.szi ?? 0);
    const baseStep = qtyStep ?? 1e-8;
    const labelSym = baseSymbol ?? position.coin;

    const [configureAmount, setConfigureAmount] = useState<boolean>(false);
    const [applyPct, setApplyPct] = useState<number>(100);

    // Refs for each input
    const gainRef = useRef<HTMLInputElement>(null);
    const lossRef = useRef<HTMLInputElement>(null);

    const roundToStep = (x: number, step: number) =>
        Math.round((x + Number.EPSILON) / step) * step;

    const pxStep = useMemo(() => {
        const ref = markPrice || position.entryPx;
        if (ref >= 100000) return 10;
        if (ref >= 10000) return 1;
        if (ref >= 1000) return 0.5;
        if (ref >= 100) return 0.1;
        if (ref >= 10) return 0.01;
        if (ref >= 1) return 0.001;
        return 0.0001;
    }, [markPrice, position.entryPx]);

    const parsePx = (s: string) => {
        if (!s) return NaN;
        const n = Number(String(s).replace(/,/g, ''));
        return Number.isFinite(n) ? n : NaN;
    };

    useEffect(() => {
        if (!configureAmount) setApplyPct(100);
    }, [configureAmount]);

    const applyBase = useMemo(() => {
        const raw = (applyPct / 100) * totalBase;
        return roundToStep(raw, baseStep);
    }, [applyPct, totalBase, baseStep]);
    // LIMIT PRICE DATA------------------
    const [tpLimitStr, setTpLimitStr] = useState<string>('');
    const [slLimitStr, setSlLimitStr] = useState<string>('');

    const tpLimitPx = useMemo(() => {
        const n = parsePx(tpLimitStr);
        return Number.isFinite(n) ? roundToStep(n, pxStep) : NaN;
    }, [tpLimitStr, pxStep]);

    const slLimitPx = useMemo(() => {
        const n = parsePx(slLimitStr);
        return Number.isFinite(n) ? roundToStep(n, pxStep) : NaN;
    }, [slLimitStr, pxStep]);

    const onTpLimitBlur = () => {
        const n = parsePx(tpLimitStr);
        if (Number.isFinite(n)) setTpLimitStr(String(roundToStep(n, pxStep)));
    };

    const onSlLimitBlur = () => {
        const n = parsePx(slLimitStr);
        if (Number.isFinite(n)) setSlLimitStr(String(roundToStep(n, pxStep)));
    };

    // ----------------------------------

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
    const snap = (v: number) => String(roundToStep(v, pxStep));

    const updateTPPriceFromGain = (gainValue: string, currency?: '$' | '%') => {
        if (!gainValue || !qty) return;
        const gain = parseFloat(gainValue);
        const cur = currency ?? formData.gainCurrency;
        let newPrice: number;
        if (cur === '$') {
            const priceChange = gain / qty;
            newPrice = isLong
                ? baseForPnL + priceChange
                : baseForPnL - priceChange;
        } else {
            const pct = gain / 100;
            newPrice = baseForPnL * (isLong ? 1 + pct : 1 - pct);
        }
        setFormData((p) => ({ ...p, tpPrice: snap(newPrice) }));
    };

    const updateSLPriceFromLoss = (lossValue: string, currency?: '$' | '%') => {
        if (!lossValue || !qty) return;
        const loss = parseFloat(lossValue);
        const cur = currency ?? formData.lossCurrency;
        let newPrice: number;
        if (cur === '$') {
            const priceChange = loss / qty;
            newPrice = isLong
                ? baseForPnL - priceChange
                : baseForPnL + priceChange;
        } else {
            const pct = loss / 100;
            newPrice = baseForPnL * (isLong ? 1 - pct : 1 + pct);
        }
        setFormData((p) => ({ ...p, slPrice: snap(newPrice) }));
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
            {/* --- INFO HEADER --- */}
            <section className={styles.infoContainer}>
                {infoData.map((item) => (
                    <div key={item.label} className={styles.infoItem}>
                        <p>{item.label}</p>
                        <p>{item.value}</p>
                    </div>
                ))}
            </section>

            {/* --- FORM CONTAINER --- */}
            <section className={styles.formContainer}>
                {/* TP Row */}
                <div className={styles.formRow}>
                    <label
                        className={`${styles.inputWithoutDropdown} ${showTpValidation && tpInvalid ? styles.fieldError : ''} ${showTpValidation && tpOutlier && !tpInvalid ? styles.fieldWarning : ''}`}
                        htmlFor='tpPrice'
                    >
                        <span>TP Price</span>
                        <input
                            id='tpPrice'
                            type='number'
                            value={formData.tpPrice}
                            onChange={(e) =>
                                handleInputChange('tpPrice', e.target.value)
                            }
                            onFocus={() => setTpPriceFocused(true)}
                            onBlur={(e) => {
                                setTpPriceFocused(false);
                                setTpPriceTouched(true);
                                const n = parsePx(e.currentTarget.value);
                                if (Number.isFinite(n)) {
                                    const snapped = String(
                                        roundToStep(n, pxStep),
                                    );
                                    if (snapped !== e.currentTarget.value) {
                                        e.currentTarget.value = snapped;
                                        handleInputChange('tpPrice', snapped);
                                    }
                                }
                            }}
                            aria-invalid={tpInvalid || undefined}
                        />
                    </label>

                    <div
                        className={styles.inputWithDropdown}
                        role='group'
                        onMouseDown={(e) => {
                            const t = e.target as HTMLElement;
                            if (
                                t.closest(
                                    'input,button,[role="button"],[role="listbox"]',
                                )
                            )
                                return;
                            e.preventDefault();
                            gainRef.current?.focus();
                        }}
                    >
                        <label htmlFor='gain'>Gain</label>
                        <input
                            id='gain'
                            ref={gainRef}
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

                {/* SL Row */}
                <div className={styles.formRow}>
                    <label
                        className={`${styles.inputWithoutDropdown} ${showSlValidation && slInvalid ? styles.fieldError : ''} ${showSlValidation && slOutlier && !slInvalid ? styles.fieldWarning : ''}`}
                        htmlFor='slPrice'
                    >
                        <span>SL Price</span>
                        <input
                            id='slPrice'
                            type='number'
                            value={formData.slPrice}
                            onChange={(e) =>
                                handleInputChange('slPrice', e.target.value)
                            }
                            onFocus={() => setSlPriceFocused(true)}
                            onBlur={(e) => {
                                setSlPriceFocused(false);
                                setSlPriceTouched(true);
                                const n = parsePx(e.currentTarget.value);
                                if (Number.isFinite(n)) {
                                    const snapped = String(
                                        roundToStep(n, pxStep),
                                    );
                                    if (snapped !== e.currentTarget.value) {
                                        e.currentTarget.value = snapped;
                                        handleInputChange('slPrice', snapped);
                                    }
                                }
                            }}
                            aria-invalid={slInvalid || undefined}
                        />
                    </label>

                    <div
                        className={styles.inputWithDropdown}
                        role='group'
                        onMouseDown={(e) => {
                            const t = e.target as HTMLElement;
                            if (
                                t.closest(
                                    'input,button,[role="button"],[role="listbox"]',
                                )
                            )
                                return;
                            e.preventDefault();
                            lossRef.current?.focus();
                        }}
                    >
                        <label htmlFor='loss'>Loss</label>
                        <input
                            id='loss'
                            ref={lossRef}
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

            {/* --- TOGGLE SECTION --- */}
            <section className={styles.toggleContainer}>
                <ToggleSwitch
                    isOn={configureAmount}
                    onToggle={(v) => setConfigureAmount(v ?? !configureAmount)}
                    label='Configure Amount'
                    reverse
                />

                {configureAmount && (
                    <>
                        <PositionSize
                            value={applyPct}
                            onChange={setApplyPct}
                            isModal
                            className={styles.positionSizeRow}
                        />
                        <div className={styles.amountReadout}>
                            {applyBase} {labelSym}{' '}
                            <span className={styles.subtext}>
                                ({applyPct}% of {totalBase} {labelSym})
                            </span>
                        </div>
                    </>
                )}

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

                {formData.limitPrice && (
                    <div className={styles.formRow}>
                        <label
                            className={styles.inputWithoutDropdown}
                            htmlFor='tpLimitPrice'
                        >
                            <span>TP Limit Price</span>
                            <input
                                id='tpLimitPrice'
                                type='text'
                                inputMode='decimal'
                                value={tpLimitStr}
                                onChange={(e) => setTpLimitStr(e.target.value)}
                                onBlur={onTpLimitBlur}
                            />
                        </label>

                        <label
                            className={styles.inputWithoutDropdown}
                            htmlFor='slLimitPrice'
                        >
                            <span>SL Limit Price</span>
                            <input
                                id='slLimitPrice'
                                type='text'
                                inputMode='decimal'
                                value={slLimitStr}
                                onChange={(e) => setSlLimitStr(e.target.value)}
                                onBlur={onSlLimitBlur}
                            />
                        </label>
                    </div>
                )}
            </section>

            {/* --- WARNINGS --- */}
            <div className={styles.warningContainer}>
                {!tpInvalid && tpOutlier && showTpValidation && (
                    <span className={styles.warningText}>
                        TP is {(pctAway(tpTarget as number) * 100).toFixed(1)}%
                        from entry — double-check your input
                    </span>
                )}
                {!slInvalid && slOutlier && showSlValidation && (
                    <span className={styles.warningText}>
                        SL is {(pctAway(slTarget as number) * 100).toFixed(1)}%
                        from entry — double-check your input
                    </span>
                )}
            </div>

            {/* --- CONFIRM BUTTON --- */}
            <button
                className={`${styles.confirmButton} ${!isFormValid() ? styles.disabled : ''}`}
                onClick={handleConfirm}
                disabled={!isFormValid()}
            >
                Confirm
            </button>

            {/* --- FOOTER INFO --- */}
            <section className={styles.textInfo}>
                <p>
                    By default take-profit and stop-loss orders apply to the
                    entire position. These orders automatically cancel after
                    closing the position. A market order is triggered when the
                    stop loss or take profit price is reached.
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
