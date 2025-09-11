import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import styles from './TakeProfitsModal.module.css';
import ToggleSwitch from '../ToggleSwitch/ToggleSwitch';
import type { PositionIF } from '~/utils/UserDataIFs';
import ComboBox from '~/components/Inputs/ComboBox/ComboBox';
import PositionSize from '../OrderInput/PositionSIze/PositionSize';

type Currency = '$' | '%';

interface TakeProfitStopLossFormData {
    takeProfitPrice: string;
    stopLossPrice: string;
    takeProfitGain: string;
    stopLossAmount: string;
    takeProfitGainType: Currency;
    stopLossAmountType: Currency;
    isCustomAllocationEnabled: boolean;
    isLimitOrderEnabled: boolean;
}

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

    // --- minimum lot size increment for quantity calculations ---
    const quantityStep = qtyStep ?? 1e-8;

    // --- snap any number to a given increment (used across prices/size) ---
    const roundToNearestIncrement = (value: number, increment: number) =>
        Math.round((value + Number.EPSILON) / increment) * increment;

    // --- price tick size heuristic based on current/entry price ---
    const priceTickSize = useMemo(() => {
        const ref = markPrice || position.entryPx;
        if (ref >= 100000) return 10;
        if (ref >= 10000) return 1;
        if (ref >= 1000) return 0.5;
        if (ref >= 100) return 0.1;
        if (ref >= 10) return 0.01;
        if (ref >= 1) return 0.001;
        return 0.0001;
    }, [markPrice, position.entryPx]);

    // --- parse entered price string (removes commas, returns NaN if bad) ---
    const parsePrice = (s: string) => {
        if (!s) return NaN;
        const n = Number(String(s).replace(/,/g, ''));
        return Number.isFinite(n) ? n : NaN;
    };

    // --- price snapper that returns a string ready for inputs ---
    const snapPriceForInput = (v: number) =>
        String(roundToNearestIncrement(v, priceTickSize));

    // how many decimals does a step like 1e-8 or 0.001 imply?
    const decimalsFromStep = (step: number) => {
        if (!Number.isFinite(step) || step <= 0) return 8;
        const s = String(step);
        if (s.includes('e-')) return parseInt(s.split('e-')[1], 10);
        const dot = s.indexOf('.');
        return dot === -1 ? 0 : s.length - dot - 1;
    };

    const formatCrypto = (value: number) =>
        value.toFixed(8).replace(/\.?0+$/, '');

    // --- threshold for “this looks really far from entry” warnings ---
    const OUTLIER_RATIO = 0.5; // 50%

    // --- refs to focus the right input when wrapper is clicked ---
    const takeProfitGainInputRef = useRef<HTMLInputElement>(null);
    const stopLossAmountInputRef = useRef<HTMLInputElement>(null);

    // --- all editable fields for TP/SL form ---
    const [form, setForm] = useState<TakeProfitStopLossFormData>({
        takeProfitPrice: position.tp ? position.tp.toString() : '',
        stopLossPrice: position.sl ? position.sl.toString() : '',
        takeProfitGain: '',
        stopLossAmount: '',
        takeProfitGainType: '$',
        stopLossAmountType: '$',
        isCustomAllocationEnabled: false,
        isLimitOrderEnabled: false,
    });

    // --- mostly for ui interactions ---
    const [ui, setUi] = useState({
        takeProfitInputMode: null as 'price' | 'gain' | null,
        stopLossInputMode: null as 'price' | 'loss' | null,

        isTakeProfitPriceFocused: false,
        hasTakeProfitPriceBeenTouched: false,
        isTakeProfitGainFocused: false,
        hasTakeProfitGainBeenTouched: false,

        isStopLossPriceFocused: false,
        hasStopLossPriceBeenTouched: false,
        isStopLossAmountFocused: false,
        hasStopLossAmountBeenTouched: false,

        allocationPercentage: 100,
        takeProfitLimitInput: '',
        stopLossLimitInput: '',
    });

    // --- entry price used for P&L math  ---
    const entryPrice = position.entryPx;

    // --- price shown as “current / mark” in the header  ---
    const markOrEntryPrice = markPrice || position.entryPx;

    // --- absolute position size and direction flags ---
    const positionQuantity = Math.abs(position.szi);
    const isLong = position.szi > 0;

    // --- computed base amount when “Configure Amount” is enabled (allocationPercentage of position) ---
    const allocatedQuantity = useMemo(() => {
        const raw = (ui.allocationPercentage / 100) * totalBaseQuantity;
        return roundToNearestIncrement(raw, quantityStep);
    }, [ui.allocationPercentage, totalBaseQuantity, quantityStep]);

    // --- derive TP price from desired gain (absolute $ or %) ---
    const takeProfitFromGain = useMemo(() => {
        if (!form.takeProfitGain) return undefined;
        const gain = parseFloat(form.takeProfitGain);
        if (!Number.isFinite(gain) || !positionQuantity) return undefined;
        if (form.takeProfitGainType === '$') {
            const priceChange = gain / positionQuantity;
            return isLong ? entryPrice + priceChange : entryPrice - priceChange;
        } else {
            const pct = gain / 100;
            return entryPrice * (isLong ? 1 + pct : 1 - pct);
        }
    }, [
        form.takeProfitGain,
        form.takeProfitGainType,
        positionQuantity,
        isLong,
        entryPrice,
    ]);

    // --- derive SL price from tolerated loss (absolute $ or %) ---
    const stopLossFromLoss = useMemo(() => {
        if (!form.stopLossAmount) return undefined;
        const loss = parseFloat(form.stopLossAmount);
        if (!Number.isFinite(loss) || !positionQuantity) return undefined;
        if (form.stopLossAmountType === '$') {
            const priceChange = loss / positionQuantity;
            return isLong ? entryPrice - priceChange : entryPrice + priceChange;
        } else {
            const pct = loss / 100;
            return entryPrice * (isLong ? 1 - pct : 1 + pct);
        }
    }, [
        form.stopLossAmount,
        form.stopLossAmountType,
        positionQuantity,
        isLong,
        entryPrice,
    ]);

    // --- keeps track of which field the user last typed in — TP Price or Gain — so we know which value to use and ignore the other.
    const takeProfitTarget = useMemo(() => {
        const priceVal = form.takeProfitPrice
            ? parseFloat(form.takeProfitPrice)
            : undefined;
        if (ui.takeProfitInputMode === 'gain') return takeProfitFromGain;
        if (ui.takeProfitInputMode === 'price') return priceVal;
        return takeProfitFromGain ?? priceVal;
    }, [ui.takeProfitInputMode, form.takeProfitPrice, takeProfitFromGain]);

    const stopLossTarget = useMemo(() => {
        const priceVal = form.stopLossPrice
            ? parseFloat(form.stopLossPrice)
            : undefined;
        if (ui.stopLossInputMode === 'loss') return stopLossFromLoss;
        if (ui.stopLossInputMode === 'price') return priceVal;
        return stopLossFromLoss ?? priceVal;
    }, [ui.stopLossInputMode, form.stopLossPrice, stopLossFromLoss]);

    // -calculates P&L (in $) at a given price target ---
    const computePnlAtPrice = useCallback(
        (target: number) => {
            const diff = isLong ? target - entryPrice : entryPrice - target;
            return diff * positionQuantity;
        },
        [isLong, entryPrice, positionQuantity],
    );

    // --- preview of expected profit if TP hits ---
    const expectedProfit = useMemo(
        () =>
            Number.isFinite(takeProfitTarget as number)
                ? computePnlAtPrice(takeProfitTarget as number)
                : null,
        [takeProfitTarget, computePnlAtPrice],
    );

    // --- preview of expected loss if SL hits ---
    const expectedLoss = useMemo(() => {
        if (!Number.isFinite(stopLossTarget as number)) return null;
        const raw = computePnlAtPrice(stopLossTarget as number);
        return Math.abs(raw);
    }, [stopLossTarget, computePnlAtPrice]);

    //-----------VALIDATIONS----------------------------

    // --- validity: TP must be in the profit direction relative to entry ---
    const isTakeProfitInvalid =
        Number.isFinite(takeProfitTarget as number) &&
        ((isLong && (takeProfitTarget as number) <= entryPrice) ||
            (!isLong && (takeProfitTarget as number) >= entryPrice));

    // --- validity: SL must be in the loss direction relative to entry ---
    const isStopLossInvalid =
        Number.isFinite(stopLossTarget as number) &&
        ((isLong && (stopLossTarget as number) >= entryPrice) ||
            (!isLong && (stopLossTarget as number) <= entryPrice));

    // --- normalized distance from entry (for outlier warnings) ---
    const distanceFromEntryRatio = (target?: number) =>
        target ? Math.abs((target - entryPrice) / entryPrice) : 0;

    // --- flag extreme TP/SL distances (to nudge users to double-check) ---
    const isTakeProfitOutlier =
        Number.isFinite(takeProfitTarget as number) &&
        distanceFromEntryRatio(takeProfitTarget as number) >= OUTLIER_RATIO;

    const isStopLossOutlier =
        Number.isFinite(stopLossTarget as number) &&
        distanceFromEntryRatio(stopLossTarget as number) >= OUTLIER_RATIO;

    // --- show TP validation after user has interacted with TP fields ---
    const showTakeProfitValidation = useMemo(() => {
        if (ui.takeProfitInputMode === 'price')
            return (
                !!form.takeProfitPrice &&
                ui.hasTakeProfitPriceBeenTouched &&
                !ui.isTakeProfitPriceFocused
            );
        if (ui.takeProfitInputMode === 'gain')
            return (
                !!form.takeProfitGain &&
                ui.hasTakeProfitGainBeenTouched &&
                !ui.isTakeProfitGainFocused
            );
        return (
            (!!form.takeProfitPrice &&
                ui.hasTakeProfitPriceBeenTouched &&
                !ui.isTakeProfitPriceFocused) ||
            (!!form.takeProfitGain &&
                ui.hasTakeProfitGainBeenTouched &&
                !ui.isTakeProfitGainFocused)
        );
    }, [
        ui.takeProfitInputMode,
        form.takeProfitPrice,
        form.takeProfitGain,
        ui.hasTakeProfitPriceBeenTouched,
        ui.isTakeProfitPriceFocused,
        ui.hasTakeProfitGainBeenTouched,
        ui.isTakeProfitGainFocused,
    ]);

    // --- show SL validation after user has interacted with SL fields ---
    const showStopLossValidation = useMemo(() => {
        if (ui.stopLossInputMode === 'price')
            return (
                !!form.stopLossPrice &&
                ui.hasStopLossPriceBeenTouched &&
                !ui.isStopLossPriceFocused
            );
        if (ui.stopLossInputMode === 'loss')
            return (
                !!form.stopLossAmount &&
                ui.hasStopLossAmountBeenTouched &&
                !ui.isStopLossAmountFocused
            );
        return (
            (!!form.stopLossPrice &&
                ui.hasStopLossPriceBeenTouched &&
                !ui.isStopLossPriceFocused) ||
            (!!form.stopLossAmount &&
                ui.hasStopLossAmountBeenTouched &&
                !ui.isStopLossAmountFocused)
        );
    }, [
        ui.stopLossInputMode,
        form.stopLossPrice,
        form.stopLossAmount,
        ui.hasStopLossPriceBeenTouched,
        ui.isStopLossPriceFocused,
        ui.hasStopLossAmountBeenTouched,
        ui.isStopLossAmountFocused,
    ]);
    //-----------END VALIDATIONS----------------------------

    // --- reset configured size to 100% when “Configure Amount” turns off ---
    useEffect(() => {
        if (!form.isCustomAllocationEnabled)
            setUi((u) => ({ ...u, allocationPercentage: 100 }));
    }, [form.isCustomAllocationEnabled]);

    // --- TP price changed directly by user (tells us to use the typed price) ---
    const onTakeProfitPriceChange = (v: string) => {
        setForm((p) => ({ ...p, takeProfitPrice: v }));
        setUi((u) => ({ ...u, takeProfitInputMode: 'price' }));
    };

    // --- SL price changed directly by user (marks source as “price”) ---
    const onStopLossPriceChange = (v: string) => {
        setForm((p) => ({ ...p, stopLossPrice: v }));
        setUi((u) => ({ ...u, stopLossInputMode: 'price' }));
    };

    // --- user edits desired profit; derive/snap the corresponding TP price ---
    const onTakeProfitGainChange = (v: string) => {
        setForm((p) => ({ ...p, takeProfitGain: v }));
        setUi((u) => ({ ...u, takeProfitInputMode: 'gain' }));
        const gain = parseFloat(v);
        if (Number.isFinite(gain) && positionQuantity) {
            const cur = form.takeProfitGainType;
            let next: number;
            if (cur === '$')
                next = isLong
                    ? entryPrice + gain / positionQuantity
                    : entryPrice - gain / positionQuantity;
            else {
                const pct = gain / 100;
                next = entryPrice * (isLong ? 1 + pct : 1 - pct);
            }
            setForm((p) => ({
                ...p,
                takeProfitPrice: snapPriceForInput(next),
            }));
        }
    };

    // --- user edits tolerated loss; derive/snap the corresponding SL price ---
    const onStopLossAmountChange = (v: string) => {
        setForm((p) => ({ ...p, stopLossAmount: v }));
        setUi((u) => ({ ...u, stopLossInputMode: 'loss' }));
        const loss = parseFloat(v);
        if (Number.isFinite(loss) && positionQuantity) {
            const cur = form.stopLossAmountType;
            let next: number;
            if (cur === '$')
                next = isLong
                    ? entryPrice - loss / positionQuantity
                    : entryPrice + loss / positionQuantity;
            else {
                const pct = loss / 100;
                next = entryPrice * (isLong ? 1 - pct : 1 + pct);
            }
            setForm((p) => ({ ...p, stopLossPrice: snapPriceForInput(next) }));
        }
    };

    // --- when switching gain currency, recompute TP if a gain value exists ---
    const onTakeProfitGainTypeChange = (val: Currency | string) => {
        const c = val as Currency;
        setForm((p) => ({ ...p, takeProfitGainType: c }));
        if (form.takeProfitGain) onTakeProfitGainChange(form.takeProfitGain);
    };

    // --- when switching loss currency, recompute SL if a loss value exists ---
    const onStopLossAmountTypeChange = (val: Currency | string) => {
        const c = val as Currency;
        setForm((p) => ({ ...p, stopLossAmountType: c }));
        if (form.stopLossAmount) onStopLossAmountChange(form.stopLossAmount);
    };

    // --- blur handler: snap TP input to the nearest tick and mark it “touched” ---
    const onTakeProfitBlur = (raw: string) => {
        setUi((u) => ({
            ...u,
            isTakeProfitPriceFocused: false,
            hasTakeProfitPriceBeenTouched: true,
        }));
        const n = parsePrice(raw);
        if (Number.isFinite(n))
            setForm((p) => ({ ...p, takeProfitPrice: snapPriceForInput(n) }));
    };

    // --- blur handler: snap SL input to the nearest tick and mark it “touched” ---
    const onStopLossBlur = (raw: string) => {
        setUi((u) => ({
            ...u,
            isStopLossPriceFocused: false,
            hasStopLossPriceBeenTouched: true,
        }));
        const n = parsePrice(raw);
        if (Number.isFinite(n))
            setForm((p) => ({ ...p, stopLossPrice: snapPriceForInput(n) }));
    };

    // --- blur handlers for optional limit prices (text inputs) ---
    const onTakeProfitLimitBlur = () => {
        const n = parsePrice(ui.takeProfitLimitInput);
        if (Number.isFinite(n))
            setUi((u) => ({
                ...u,
                takeProfitLimitInput: String(
                    roundToNearestIncrement(n, priceTickSize),
                ),
            }));
    };
    const onStopLossLimitBlur = () => {
        const n = parsePrice(ui.stopLossLimitInput);
        if (Number.isFinite(n))
            setUi((u) => ({
                ...u,
                stopLossLimitInput: String(
                    roundToNearestIncrement(n, priceTickSize),
                ),
            }));
    };

    // --- overall form validity: at least one of TP/SL set and each (if set) is directionally valid ---
    const isFormValid = useMemo(() => {
        const hasTp =
            form.takeProfitPrice.trim() !== '' ||
            form.takeProfitGain.trim() !== '';
        const hasSl =
            form.stopLossPrice.trim() !== '' ||
            form.stopLossAmount.trim() !== '';
        const somethingSet = hasTp || hasSl;
        const validWhenSet =
            (!hasTp || !isTakeProfitInvalid) && (!hasSl || !isStopLossInvalid);
        return somethingSet && validWhenSet && positionQuantity > 0;
    }, [
        form.takeProfitPrice,
        form.takeProfitGain,
        form.stopLossPrice,
        form.stopLossAmount,
        isTakeProfitInvalid,
        isStopLossInvalid,
        positionQuantity,
    ]);

    // --- Confirm: compute final size/prices (rounded), include optional limits, and "place" orders ---
    const handleConfirm = useCallback(async () => {
        if (!isFormValid) return;

        // Determine the order size (configured allocation or full position), rounded to lot step
        const rawOrderSize = form.isCustomAllocationEnabled
            ? allocatedQuantity
            : totalBaseQuantity;
        const finalOrderSize = roundToNearestIncrement(
            rawOrderSize,
            quantityStep,
        );

        if (finalOrderSize <= 0) {
            console.warn('Order size too small to place.');
            return;
        }

        // Prepare trigger prices (TP and SL), rounded to tick size
        const takeProfitTriggerPrice =
            form.takeProfitPrice !== ''
                ? roundToNearestIncrement(
                      Number(form.takeProfitPrice),
                      priceTickSize,
                  )
                : undefined;

        const stopLossTriggerPrice =
            form.stopLossPrice !== ''
                ? roundToNearestIncrement(
                      Number(form.stopLossPrice),
                      priceTickSize,
                  )
                : undefined;

        // Optional limit prices if limit orders are enabled
        const takeProfitLimitPrice =
            form.isLimitOrderEnabled && ui.takeProfitLimitInput
                ? roundToNearestIncrement(
                      Number(ui.takeProfitLimitInput),
                      priceTickSize,
                  )
                : undefined;

        const stopLossLimitPrice =
            form.isLimitOrderEnabled && ui.stopLossLimitInput
                ? roundToNearestIncrement(
                      Number(ui.stopLossLimitInput),
                      priceTickSize,
                  )
                : undefined;

        // Validate numbers
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
        const orderType = form.isLimitOrderEnabled
            ? 'STOP_LIMIT'
            : 'STOP_MARKET';

        if (takeProfitTriggerPrice !== undefined) {
            console.log('Placing Take Profit Order:', {
                symbol: position.coin,
                triggerPrice: takeProfitTriggerPrice,
                limitPrice: takeProfitLimitPrice,
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
                limitPrice: stopLossLimitPrice,
                size: finalOrderSize,
                side: orderSide,
                reduceOnly: true,
                type: orderType,
                ocoGroupId: 'tp-sl-group',
            });
        }

        closeTPModal();
    }, [
        isFormValid,
        form.isCustomAllocationEnabled,
        form.isLimitOrderEnabled,
        form.takeProfitPrice,
        form.stopLossPrice,
        ui.takeProfitLimitInput,
        ui.stopLossLimitInput,
        allocatedQuantity,
        totalBaseQuantity,
        quantityStep,
        priceTickSize,
        position.coin,
        position.szi,
        closeTPModal,
    ]);

    const headerInfo = [
        { label: 'Market', value: position.coin },
        {
            label: 'Position',
            value: `${formatCrypto(Math.abs(position.szi))} ${position.coin}`,
        },
        { label: 'Entry Price', value: formatCrypto(entryPrice) },
        { label: 'Mark Price', value: formatCrypto(markOrEntryPrice) },
    ];

    const currencyOptions: Currency[] = ['$', '%'];

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
                    <label
                        className={`${styles.inputWithoutDropdown} ${showTakeProfitValidation && isTakeProfitInvalid ? styles.fieldError : ''} ${showTakeProfitValidation && isTakeProfitOutlier && !isTakeProfitInvalid ? styles.fieldWarning : ''}`}
                        htmlFor='takeProfitPrice'
                    >
                        <span>TP Price</span>
                        <input
                            id='takeProfitPrice'
                            type='number'
                            step={priceTickSize}
                            value={form.takeProfitPrice}
                            onChange={(e) =>
                                onTakeProfitPriceChange(e.target.value)
                            }
                            onFocus={() =>
                                setUi((u) => ({
                                    ...u,
                                    isTakeProfitPriceFocused: true,
                                }))
                            }
                            onBlur={(e) =>
                                onTakeProfitBlur(e.currentTarget.value)
                            }
                            aria-invalid={isTakeProfitInvalid || undefined}
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
                            takeProfitGainInputRef.current?.focus();
                        }}
                    >
                        <label htmlFor='takeProfitGain'>Gain</label>
                        <input
                            id='takeProfitGain'
                            ref={takeProfitGainInputRef}
                            type='number'
                            min={0}
                            value={form.takeProfitGain}
                            onChange={(e) =>
                                onTakeProfitGainChange(e.target.value)
                            }
                            onFocus={() =>
                                setUi((u) => ({
                                    ...u,
                                    isTakeProfitGainFocused: true,
                                }))
                            }
                            onBlur={() =>
                                setUi((u) => ({
                                    ...u,
                                    isTakeProfitGainFocused: false,
                                    hasTakeProfitGainBeenTouched: true,
                                }))
                            }
                        />
                        <ComboBox
                            value={form.takeProfitGainType}
                            options={currencyOptions}
                            onChange={(val) => onTakeProfitGainTypeChange(val)}
                            cssPositioning='fixed'
                        />
                    </div>
                </div>

                <div className={styles.expectedProfitContainer}>
                    {(form.takeProfitPrice || form.takeProfitGain) && (
                        <span className={styles.expectedProfitText}>
                            Expected Profit:{' '}
                            {expectedProfit == null
                                ? '—'
                                : `$${expectedProfit.toFixed(2)}`}
                            {isTakeProfitInvalid &&
                                showTakeProfitValidation && (
                                    <span className={styles.validationError}>
                                        {' '}
                                        • TP must be{' '}
                                        {isLong ? 'above' : 'below'} entry
                                    </span>
                                )}
                        </span>
                    )}
                </div>

                {/* Stop Loss Row */}
                <div className={styles.formRow}>
                    <label
                        className={`${styles.inputWithoutDropdown} ${showStopLossValidation && isStopLossInvalid ? styles.fieldError : ''} ${showStopLossValidation && isStopLossOutlier && !isStopLossInvalid ? styles.fieldWarning : ''}`}
                        htmlFor='stopLossPrice'
                    >
                        <span>SL Price</span>
                        <input
                            id='stopLossPrice'
                            type='number'
                            step={priceTickSize}
                            value={form.stopLossPrice}
                            onChange={(e) =>
                                onStopLossPriceChange(e.target.value)
                            }
                            onFocus={() =>
                                setUi((u) => ({
                                    ...u,
                                    isStopLossPriceFocused: true,
                                }))
                            }
                            onBlur={(e) =>
                                onStopLossBlur(e.currentTarget.value)
                            }
                            aria-invalid={isStopLossInvalid || undefined}
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
                            stopLossAmountInputRef.current?.focus();
                        }}
                    >
                        <label htmlFor='stopLossAmount'>Loss</label>
                        <input
                            id='stopLossAmount'
                            ref={stopLossAmountInputRef}
                            type='number'
                            min={0}
                            value={form.stopLossAmount}
                            onChange={(e) =>
                                onStopLossAmountChange(e.target.value)
                            }
                            onFocus={() =>
                                setUi((u) => ({
                                    ...u,
                                    isStopLossAmountFocused: true,
                                }))
                            }
                            onBlur={() =>
                                setUi((u) => ({
                                    ...u,
                                    isStopLossAmountFocused: false,
                                    hasStopLossAmountBeenTouched: true,
                                }))
                            }
                        />
                        <ComboBox
                            value={form.stopLossAmountType}
                            options={currencyOptions}
                            onChange={(val) => onStopLossAmountTypeChange(val)}
                            cssPositioning='fixed'
                        />
                    </div>
                </div>

                <div className={styles.expectedProfitContainer}>
                    {(form.stopLossPrice || form.stopLossAmount) && (
                        <span className={styles.expectedProfitText}>
                            Expected Loss:{' '}
                            {expectedLoss == null
                                ? '—'
                                : `-$${expectedLoss.toFixed(2)}`}
                            {isStopLossInvalid && showStopLossValidation && (
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

            {/* Warnings */}
            <div className={styles.warningContainer}>
                {!isTakeProfitInvalid &&
                    isTakeProfitOutlier &&
                    showTakeProfitValidation && (
                        <span className={styles.warningText}>
                            TP is{' '}
                            {(
                                distanceFromEntryRatio(
                                    takeProfitTarget as number,
                                ) * 100
                            ).toFixed(1)}
                            % from entry — double-check your input
                        </span>
                    )}
                {!isStopLossInvalid &&
                    isStopLossOutlier &&
                    showStopLossValidation && (
                        <span className={styles.warningText}>
                            SL is{' '}
                            {(
                                distanceFromEntryRatio(
                                    stopLossTarget as number,
                                ) * 100
                            ).toFixed(1)}
                            % from entry — double-check your input
                        </span>
                    )}
            </div>

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
                <p>
                    If the order size is configured above, the TP/SL order will
                    be for that size no matter how the position changes in the
                    future.
                </p>
            </section>
        </div>
    );
}
