import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import styles from './TakeProfitsModal.module.css';
import ToggleSwitch from '../ToggleSwitch/ToggleSwitch';
import type { PositionIF } from '~/utils/UserDataIFs';
import ComboBox from '~/components/Inputs/ComboBox/ComboBox';
import PositionSize from '../OrderInput/PositionSIze/PositionSize';
import {
    pctFromDollars,
    dollarsFromPct,
} from '~/utils/functions/profitLossConversions';

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

    const formatCrypto = (value: number) =>
        value.toFixed(8).replace(/\.?0+$/, '');

    // --- helpers: derive $ / % from a typed TP/SL price (NEW) ---
    const toInput = (n: number) =>
        Number.isFinite(n) ? String(+n.toFixed(8)).replace(/\.?0+$/, '') : '';

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
        tpGainUSD: null as number | null,
        slLossUSD: null as number | null,

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
    const positionQuantity = Math.abs(position.szi ?? 0);
    const isLong = position.szi > 0;

    // --- computed base amount when “Configure Amount” is enabled (allocationPercentage of position) ---
    const allocatedQuantity = useMemo(() => {
        const raw = (ui.allocationPercentage / 100) * totalBaseQuantity;
        return roundToNearestIncrement(raw, quantityStep);
    }, [ui.allocationPercentage, totalBaseQuantity, quantityStep]);

    // size used for all $ math (full size or slider size)
    const effectiveQty = form.isCustomAllocationEnabled
        ? allocatedQuantity
        : positionQuantity;

    // --- derive TP price from desired gain (absolute $ or %) ---
    const takeProfitFromGain = useMemo(() => {
        if (!form.takeProfitGain) return undefined;
        const gain = parseFloat(form.takeProfitGain);
        // if (!Number.isFinite(gain) || !positionQuantity) return undefined;
        if (!Number.isFinite(gain) || !effectiveQty) return undefined;

        if (form.takeProfitGainType === '$') {
            // const priceChange = gain / positionQuantity;
            const priceChange = gain / effectiveQty;
            return isLong ? entryPrice + priceChange : entryPrice - priceChange;
        } else {
            const pct = gain / 100;
            return entryPrice * (isLong ? 1 + pct : 1 - pct);
        }
    }, [
        form.takeProfitGain,
        form.takeProfitGainType,
        effectiveQty,
        isLong,
        entryPrice,
    ]);

    // --- derive SL price from tolerated loss (absolute $ or %) ---
    const stopLossFromLoss = useMemo(() => {
        if (!form.stopLossAmount) return undefined;
        const loss = parseFloat(form.stopLossAmount);
        // if (!Number.isFinite(loss) || !positionQuantity) return undefined;
        if (!Number.isFinite(loss) || !effectiveQty) return undefined;

        if (form.stopLossAmountType === '$') {
            // const priceChange = loss / positionQuantity;
            const priceChange = loss / effectiveQty;
            return isLong ? entryPrice - priceChange : entryPrice + priceChange;
        } else {
            const pct = loss / 100;
            return entryPrice * (isLong ? 1 - pct : 1 + pct);
        }
    }, [
        form.stopLossAmount,
        form.stopLossAmountType,
        effectiveQty,
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
            return diff * effectiveQty;
        },
        [isLong, entryPrice, effectiveQty],
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
        return raw; // Keep the sign - negative means profit, positive means loss
    }, [stopLossTarget, computePnlAtPrice]);

    //-----------VALIDATIONS----------------------------

    // --- validity: TP must be in the profit direction relative to entry ---
    const isTakeProfitInvalid = !Number.isFinite(takeProfitTarget as number);
    // &&
    // ((isLong && (takeProfitTarget as number) <= entryPrice) ||
    //     (!isLong && (takeProfitTarget as number) >= entryPrice));

    // --- validity: SL must be in the loss direction relative to entry ---
    const isStopLossInvalid = !Number.isFinite(stopLossTarget as number);
    // &&
    // ((isLong && (stopLossTarget as number) >= entryPrice) ||
    //     (!isLong && (stopLossTarget as number) <= entryPrice));

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
        setUi((u) => ({ ...u, takeProfitInputMode: 'price' }));
        setForm((p) => {
            const next = { ...p, takeProfitPrice: v };
            const n = parsePrice(v);
            if (Number.isFinite(n)) {
                const dollars = computePnlAtPrice(n);
                const gainValue =
                    p.takeProfitGainType === '$'
                        ? Number(dollars.toFixed(2))
                        : Number(
                              pctFromDollars(
                                  dollars,
                                  entryPrice,
                                  effectiveQty,
                              ).toFixed(3),
                          );

                // Update both UI state and form state for gain field
                setUi((u) => ({
                    ...u,
                    tpGainUSD: dollars,
                }));

                // Update form state to reflect the calculated gain value
                next.takeProfitGain = toInput(gainValue);
            } else {
                setUi((u) => ({ ...u, tpGainUSD: null }));
            }
            return next;
        });
    };

    // --- SL price changed directly by user (marks source as “price”) ---
    const onStopLossPriceChange = (v: string) => {
        setUi((u) => ({ ...u, stopLossInputMode: 'price' }));
        setForm((p) => {
            const next = { ...p, stopLossPrice: v };
            const n = parsePrice(v);
            if (Number.isFinite(n)) {
                const dollars = -1 * computePnlAtPrice(n);
                const lossValue =
                    p.stopLossAmountType === '$'
                        ? Number(dollars.toFixed(2))
                        : Number(
                              pctFromDollars(
                                  dollars,
                                  entryPrice,
                                  effectiveQty,
                              ).toFixed(3),
                          );

                // Update both UI state and form state for loss field
                setUi((u) => ({
                    ...u,
                    slLossUSD: dollars,
                }));

                // Update form state to reflect the calculated loss value
                next.stopLossAmount = toInput(lossValue);
            } else {
                setUi((u) => ({ ...u, slLossUSD: null }));
            }
            return next;
        });
    };
    // --- user edits desired profit; update gain value only ---
    const onTakeProfitGainChange = (v: string) => {
        setForm((p) => ({ ...p, takeProfitGain: v }));
        setUi((u) => ({ ...u, takeProfitInputMode: 'gain' }));

        const gain = parseFloat(v);
        if (Number.isFinite(gain) && effectiveQty > 0) {
            const dollars =
                form.takeProfitGainType === '$'
                    ? gain
                    : dollarsFromPct(gain, entryPrice, effectiveQty);

            if (Number.isFinite(dollars)) {
                setUi((u) => ({
                    ...u,
                    tpGainUSD: Math.max(0, dollars as number),
                }));

                // Calculate and update the price based on gain/loss
                const targetPrice =
                    form.takeProfitGainType === '$'
                        ? isLong
                            ? entryPrice + gain / effectiveQty
                            : entryPrice - gain / effectiveQty
                        : entryPrice *
                          (isLong ? 1 + gain / 100 : 1 - gain / 100);

                if (targetPrice > 0) {
                    const snappedPrice = roundToNearestIncrement(
                        targetPrice,
                        priceTickSize,
                    );
                    setForm((p) => ({
                        ...p,
                        takeProfitPrice: snapPriceForInput(snappedPrice),
                    }));
                }
            }
        }
    };

    // --- user edits tolerated loss; update loss value only ---
    const onStopLossAmountChange = (v: string) => {
        setForm((p) => ({ ...p, stopLossAmount: v }));
        setUi((u) => ({ ...u, stopLossInputMode: 'loss' }));

        const loss = parseFloat(v);
        if (Number.isFinite(loss) && effectiveQty > 0) {
            const dollars =
                form.stopLossAmountType === '$'
                    ? loss
                    : dollarsFromPct(loss, entryPrice, effectiveQty);

            if (Number.isFinite(dollars)) {
                setUi((u) => ({
                    ...u,
                    slLossUSD: Math.max(0, dollars as number),
                }));

                // Calculate and update the price based on gain/loss
                const targetPrice =
                    form.stopLossAmountType === '$'
                        ? isLong
                            ? entryPrice - loss / effectiveQty
                            : entryPrice + loss / effectiveQty
                        : entryPrice *
                          (isLong ? 1 - loss / 100 : 1 + loss / 100);

                if (targetPrice > 0) {
                    const snappedPrice = roundToNearestIncrement(
                        targetPrice,
                        priceTickSize,
                    );
                    setForm((p) => ({
                        ...p,
                        stopLossPrice: snapPriceForInput(snappedPrice),
                    }));
                }
            }
        }
    };

    // --- when switching gain currency, recompute TP if a gain value exists ---
    const onTakeProfitGainTypeChange = (val: Currency | string) => {
        const c = val as Currency;
        if (c !== '$' && c !== '%') return;
        if (c === form.takeProfitGainType) return;

        setForm((p) => {
            const next = { ...p, takeProfitGainType: c };
            if (ui.tpGainUSD != null) {
                const formattedValue =
                    c === '$'
                        ? Number(ui.tpGainUSD.toFixed(2))
                        : Number(
                              pctFromDollars(
                                  ui.tpGainUSD,
                                  entryPrice,
                                  effectiveQty,
                              ).toFixed(3),
                          );
                next.takeProfitGain = toInput(formattedValue);
            }
            return next;
        });
    };

    // --- when switching loss currency, recompute SL if a loss value exists ---
    const onStopLossAmountTypeChange = (val: Currency | string) => {
        const c = val as Currency;
        if (c !== '$' && c !== '%') return;
        if (c === form.stopLossAmountType) return;

        setForm((p) => {
            const next = { ...p, stopLossAmountType: c };
            if (ui.slLossUSD != null) {
                const formattedValue =
                    c === '$'
                        ? Number(ui.slLossUSD.toFixed(2))
                        : Number(
                              pctFromDollars(
                                  ui.slLossUSD,
                                  entryPrice,
                                  effectiveQty,
                              ).toFixed(3),
                          );
                next.stopLossAmount = toInput(formattedValue);
            }
            return next;
        });
    };

    // --- blur handler: snap TP input to the nearest tick and mark it “touched” ---
    const onTakeProfitBlur = (raw: string) => {
        setUi((u) => ({
            ...u,
            isTakeProfitPriceFocused: false,
            hasTakeProfitPriceBeenTouched: true,
        }));
        const n = parsePrice(raw);
        if (Number.isFinite(n)) {
            const snapped = roundToNearestIncrement(n, priceTickSize);
            const dollars = computePnlAtPrice(snapped);
            const gainValue =
                form.takeProfitGainType === '$'
                    ? Number(dollars.toFixed(2))
                    : Number(
                          pctFromDollars(
                              dollars,
                              entryPrice,
                              effectiveQty,
                          ).toFixed(3),
                      );

            setUi((u) => ({ ...u, tpGainUSD: Math.max(0, dollars) }));
            setForm((p) => ({
                ...p,
                takeProfitPrice: snapPriceForInput(snapped),
                takeProfitGain: toInput(gainValue),
            }));
        }
    };

    // --- blur handler: snap SL input to the nearest tick and mark it “touched” ---
    const onStopLossBlur = (raw: string) => {
        setUi((u) => ({
            ...u,
            isStopLossPriceFocused: false,
            hasStopLossPriceBeenTouched: true,
        }));
        const n = parsePrice(raw);
        if (Number.isFinite(n)) {
            const snapped = roundToNearestIncrement(n, priceTickSize);
            const dollars = Math.abs(computePnlAtPrice(snapped));
            const lossValue =
                form.stopLossAmountType === '$'
                    ? Number(dollars.toFixed(2))
                    : Number(
                          pctFromDollars(
                              dollars,
                              entryPrice,
                              effectiveQty,
                          ).toFixed(3),
                      );

            setUi((u) => ({ ...u, slLossUSD: dollars }));
            setForm((p) => ({
                ...p,
                stopLossPrice: snapPriceForInput(snapped),
                stopLossAmount: toInput(lossValue),
            }));
        }
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
        return somethingSet && validWhenSet && effectiveQty > 0;
    }, [
        form.takeProfitPrice,
        form.takeProfitGain,
        form.stopLossPrice,
        form.stopLossAmount,
        isTakeProfitInvalid,
        isStopLossInvalid,
        effectiveQty,
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

    useEffect(() => {
        // initialize canonical $ from prefilled prices
        if (form.takeProfitPrice) {
            const n = parsePrice(form.takeProfitPrice);
            if (Number.isFinite(n))
                setUi((u) => ({
                    ...u,
                    tpGainUSD: Math.max(0, computePnlAtPrice(n)),
                }));
        }
        if (form.stopLossPrice) {
            const n = parsePrice(form.stopLossPrice);
            if (Number.isFinite(n))
                setUi((u) => ({
                    ...u,
                    slLossUSD: Math.abs(computePnlAtPrice(n)),
                }));
        }
        // run once on mount or when initial form changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // POSITION SLIDER UPDATES

    useEffect(() => {
        // TP -> update $ gain only if user hasn't manually entered a gain value
        const tpN = parsePrice(form.takeProfitPrice);
        if (Number.isFinite(tpN)) {
            const diff = isLong ? tpN - entryPrice : entryPrice - tpN;
            const gainUSD = Math.max(0, diff * effectiveQty);
            setUi((u) => ({ ...u, tpGainUSD: gainUSD }));
            if (
                form.takeProfitGainType === '$' &&
                !ui.hasTakeProfitGainBeenTouched &&
                form.takeProfitGain === ''
            ) {
                const next = toInput(gainUSD);
                setForm((p) =>
                    p.takeProfitGain === next
                        ? p
                        : { ...p, takeProfitGain: next },
                );
            }
        }

        // SL -> update $ loss only if user hasn't manually entered a loss value
        const slN = parsePrice(form.stopLossPrice);
        if (Number.isFinite(slN)) {
            const diff = isLong ? entryPrice - slN : slN - entryPrice;
            const lossUSD = diff * effectiveQty; // Keep the sign - negative means profit
            setUi((u) => ({ ...u, slLossUSD: lossUSD }));
            if (
                form.stopLossAmountType === '$' &&
                !ui.hasStopLossAmountBeenTouched &&
                form.stopLossAmount === ''
            ) {
                const next = toInput(lossUSD);
                setForm((p) =>
                    p.stopLossAmount === next
                        ? p
                        : { ...p, stopLossAmount: next },
                );
            }
        }
    }, [
        effectiveQty,
        form.takeProfitPrice,
        form.stopLossPrice,
        form.takeProfitGainType,
        form.stopLossAmountType,
        entryPrice,
        isLong,
        ui.hasTakeProfitGainBeenTouched,
        ui.hasStopLossAmountBeenTouched,
    ]);

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
                                    'input,button,[role="button"],[role="listbox"],[data-combobox-root]',
                                )
                            ) {
                                return;
                            }
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
                            onChange={(val) =>
                                onTakeProfitGainTypeChange(val as Currency)
                            }
                            cssPositioning='fixed'
                        />
                    </div>
                </div>

                <div className={styles.expectedProfitContainer}>
                    {(form.takeProfitPrice || form.takeProfitGain) && (
                        <span className={styles.expectedProfitText}>
                            {expectedProfit && expectedProfit < 0
                                ? 'Expected Loss'
                                : 'Expected Profit'}
                            :{' '}
                            {expectedProfit == null
                                ? '—'
                                : form.takeProfitGainType === '$'
                                  ? `${pctFromDollars(Math.abs(expectedProfit), entryPrice, effectiveQty).toFixed(3)}%`
                                  : `$${Math.abs(expectedProfit).toFixed(2)}`}
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
                                    'input,button,[role="button"],[role="listbox"],[data-combobox-root]',
                                )
                            ) {
                                return;
                            }
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
                            onChange={(val) =>
                                onStopLossAmountTypeChange(val as Currency)
                            }
                            cssPositioning='fixed'
                        />
                    </div>
                </div>

                <div className={styles.expectedProfitContainer}>
                    {(form.stopLossPrice || form.stopLossAmount) && (
                        <span className={styles.expectedLossText}>
                            {`${expectedLoss && expectedLoss > 0 ? 'Expected Profit' : 'Expected Loss'}: `}
                            {expectedLoss == null
                                ? '—'
                                : form.stopLossAmountType === '%'
                                  ? `$${Math.abs(expectedLoss).toFixed(2)}`
                                  : `${pctFromDollars(Math.abs(expectedLoss), entryPrice, effectiveQty).toFixed(3)}%`}
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
                    aria-label='Configure Amount toggle'
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
                    aria-label='Limit Price toggle'
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
                <p>
                    If the order size is configured above, the TP/SL order will
                    be for that size no matter how the position changes in the
                    future.
                </p>
            </section>
        </div>
    );
}
