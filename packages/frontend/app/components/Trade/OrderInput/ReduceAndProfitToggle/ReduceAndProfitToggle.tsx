import { useMemo, useState, useEffect } from 'react';
import { LuCircleHelp } from 'react-icons/lu';
import Tooltip from '~/components/Tooltip/Tooltip';
import ToggleSwitch from '../../ToggleSwitch/ToggleSwitch';
import ChaseDistance from '../ChaseDistance/ChaseDistance';
import styles from './ReduceAndProfitToggle.module.css';
import ComboBox from '~/components/Inputs/ComboBox/ComboBox';
import { pctFromDollars } from '~/utils/functions/profitLossConversions';
import { t } from 'i18next';
import getAbbreviatedPrice from '~/utils/functions/getAbbreviatedPrice';

interface PropsIF {
    isReduceOnlyEnabled: boolean;
    isTakeProfitEnabled: boolean;
    isRandomizeEnabled: boolean;
    isChasingIntervalEnabled: boolean;
    handleToggleReduceOnly: (newState?: boolean) => void;
    handleToggleProfitOnly: (newState?: boolean) => void;
    handleToggleRandomize: (newState?: boolean) => void;
    handleToggleIsChasingInterval: (newState?: boolean) => void;
    marketOrderType: string;

    // TP/SL functionality
    takeProfitPrice?: string;
    setTakeProfitPrice?: (price: string) => void;
    stopLossPrice?: string;
    setStopLossPrice?: (price: string) => void;
    takeProfitGain?: string;
    setTakeProfitGain?: (gain: string) => void;
    stopLossLoss?: string;
    setStopLossLoss?: (loss: string) => void;
    tpGainCurrency?: '$' | '%';
    setTpGainCurrency?: (currency: '$' | '%') => void;
    slLossCurrency?: '$' | '%';
    setSlLossCurrency?: (currency: '$' | '%') => void;

    markPx: number;
    symbol: string;
    notionalSymbolQtyNum: number;
    tradeDirection: 'buy' | 'sell';
}

export default function ReduceAndProfitToggle(props: PropsIF) {
    const {
        isReduceOnlyEnabled,
        isTakeProfitEnabled,
        handleToggleReduceOnly,
        handleToggleProfitOnly,
        marketOrderType,
        isRandomizeEnabled,
        handleToggleRandomize,
        isChasingIntervalEnabled,
        handleToggleIsChasingInterval,

        // TP/SL props
        takeProfitPrice = '',
        setTakeProfitPrice,
        stopLossPrice = '',
        setStopLossPrice,
        takeProfitGain = '',
        setTakeProfitGain,
        stopLossLoss = '',
        setStopLossLoss,
        tpGainCurrency = '$',
        setTpGainCurrency,
        slLossCurrency = '$',
        setSlLossCurrency,

        markPx,

        notionalSymbolQtyNum,
        tradeDirection,
    } = props;
    const [hasTakeProfitGainBeenTouched, setHasTakeProfitGainBeenTouched] =
        useState(false);
    const [hasStopLossLossBeenTouched, setHasStopLossLossBeenTouched] =
        useState(false);
    const [chaseDistance, setChaseDistance] = useState('');
    const [chaseMode, setChaseMode] = useState<'usd' | 'symbol'>('usd');
    const currencyOptions: Array<'$' | '%'> = ['$', '%'];

    // Re-run calculations when position size changes
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
        notionalSymbolQtyNum,
        markPx,
        takeProfitPrice,
        takeProfitGain,
        stopLossPrice,
        stopLossLoss,
        hasTakeProfitGainBeenTouched,
        hasStopLossLossBeenTouched,
    ]);

    const updatePriceFromGain = (gainValue: string) => {
        if (!markPx || !gainValue || !notionalSymbolQtyNum) return;

        const gain = parseFloat(gainValue);
        let newPrice: number;

        if (tpGainCurrency === '$') {
            newPrice =
                tradeDirection === 'buy'
                    ? markPx + gain / notionalSymbolQtyNum
                    : markPx - gain / notionalSymbolQtyNum;
        } else {
            const multiplier =
                tradeDirection === 'buy' ? 1 + gain / 100 : 1 - gain / 100;
            newPrice = markPx * multiplier;
        }

        setTakeProfitPrice?.(getAbbreviatedPrice(newPrice));
    };

    const updatePriceFromLoss = (lossValue: string) => {
        if (!markPx || !lossValue || !notionalSymbolQtyNum) return;

        const loss = parseFloat(lossValue);
        let newPrice: number;

        if (slLossCurrency === '$') {
            // Dollar amount loss per unit
            newPrice =
                tradeDirection === 'buy'
                    ? markPx - loss / notionalSymbolQtyNum
                    : markPx + loss / notionalSymbolQtyNum;
        } else {
            // Percentage loss
            const multiplier =
                tradeDirection === 'buy' ? 1 - loss / 100 : 1 + loss / 100;
            newPrice = markPx * multiplier;
        }

        setStopLossPrice?.(getAbbreviatedPrice(newPrice));
    };

    const calculateExpectedProfit = (): number | null => {
        if (!takeProfitPrice && !takeProfitGain) return null;

        let targetPrice: number;

        if (takeProfitPrice) {
            targetPrice = parseFloat(takeProfitPrice);
        } else if (takeProfitGain && markPx) {
            const gain = parseFloat(takeProfitGain);
            if (tpGainCurrency === '$') {
                targetPrice =
                    tradeDirection === 'buy'
                        ? markPx + gain / notionalSymbolQtyNum
                        : markPx - gain / notionalSymbolQtyNum;
            } else {
                const multiplier =
                    tradeDirection === 'buy' ? 1 + gain / 100 : 1 - gain / 100;
                targetPrice = markPx * multiplier;
            }
        } else {
            return null;
        }

        if (!markPx || !notionalSymbolQtyNum) return null;

        const priceDiff =
            tradeDirection === 'buy'
                ? targetPrice - markPx
                : markPx - targetPrice;

        return priceDiff * notionalSymbolQtyNum;
    };
    const calculateExpectedLoss = (): number | null => {
        if (!stopLossPrice && !stopLossLoss) return null;

        let targetPrice: number;

        if (stopLossPrice) {
            targetPrice = parseFloat(stopLossPrice);
        } else if (stopLossLoss && markPx) {
            const loss = parseFloat(stopLossLoss);
            if (slLossCurrency === '$') {
                // Dollar amount loss per unit
                targetPrice =
                    tradeDirection === 'buy'
                        ? markPx - loss / notionalSymbolQtyNum
                        : markPx + loss / notionalSymbolQtyNum;
            } else {
                // Percentage loss
                const multiplier =
                    tradeDirection === 'buy' ? 1 - loss / 100 : 1 + loss / 100;
                targetPrice = markPx * multiplier;
            }
        } else {
            return null;
        }

        if (!markPx || !notionalSymbolQtyNum) return null;

        const priceDiff =
            tradeDirection === 'buy'
                ? markPx - targetPrice
                : targetPrice - markPx;

        return priceDiff * notionalSymbolQtyNum;
    };

    const updateGainFromPrice = (priceValue: string) => {
        if (!priceValue || !markPx || !notionalSymbolQtyNum) {
            console.log('updateGainFromPrice: missing required values', {
                priceValue,
                markPx,
                notionalSymbolQtyNum,
            });
            return;
        }

        const price = parseFloat(priceValue);
        if (!Number.isFinite(price)) {
            console.log('updateGainFromPrice: invalid price', priceValue);
            return;
        }

        const priceDiff =
            tradeDirection === 'buy' ? price - markPx : markPx - price;

        const gainUSD = priceDiff * notionalSymbolQtyNum;
        const gainValue =
            tpGainCurrency === '$'
                ? gainUSD.toFixed(2)
                : ((gainUSD / (markPx * notionalSymbolQtyNum)) * 100).toFixed(
                      3,
                  );

        // Only update if user hasn't manually entered a gain value
        if (!hasTakeProfitGainBeenTouched) {
            setTakeProfitGain?.(gainValue.toString());
        }
    };

    const updateLossFromPrice = (priceValue: string) => {
        if (!priceValue || !markPx || !notionalSymbolQtyNum) return;

        const price = parseFloat(priceValue);
        if (!Number.isFinite(price)) return;

        const priceDiff =
            tradeDirection === 'buy' ? markPx - price : price - markPx;

        const lossUSD = priceDiff * notionalSymbolQtyNum;
        const lossValue =
            slLossCurrency === '$'
                ? lossUSD.toFixed(2)
                : ((lossUSD / (markPx * notionalSymbolQtyNum)) * 100).toFixed(
                      3,
                  );

        // Only update if user hasn't manually entered a loss value
        if (!hasStopLossLossBeenTouched) {
            setStopLossLoss?.(lossValue.toString());
        }
    };

    const expectedProfit = useMemo(() => {
        return calculateExpectedProfit();
    }, [
        takeProfitPrice,
        takeProfitGain,
        tpGainCurrency,
        markPx,
        notionalSymbolQtyNum,
        tradeDirection,
    ]);

    const expectedLoss = useMemo(() => {
        return calculateExpectedLoss();
    }, [
        stopLossPrice,
        stopLossLoss,
        slLossCurrency,
        markPx,
        notionalSymbolQtyNum,
        tradeDirection,
    ]);
    const formDisplay = (
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
                            setTakeProfitPrice?.(value);
                            setHasTakeProfitGainBeenTouched(false); // Reset touch state so gain can update from price
                            updateGainFromPrice(value);

                            // Clear gain if price is cleared
                            if (value === '') {
                                setTakeProfitGain?.('');
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
                            setTakeProfitGain?.(value);
                            setHasTakeProfitGainBeenTouched(true);
                            updatePriceFromGain(value);

                            // Clear price if gain is cleared
                            if (value === '') {
                                setTakeProfitPrice?.('');
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
                                markPx &&
                                notionalSymbolQtyNum
                            ) {
                                const currentGain = parseFloat(takeProfitGain);
                                if (Number.isFinite(currentGain)) {
                                    // Convert current gain to USD
                                    const currentGainUSD =
                                        tpGainCurrency === '$'
                                            ? currentGain
                                            : (currentGain *
                                                  (markPx *
                                                      notionalSymbolQtyNum)) /
                                              100;

                                    // Convert USD to new currency
                                    const newGainValue =
                                        currency === '$'
                                            ? currentGainUSD.toFixed(2)
                                            : (
                                                  (currentGainUSD /
                                                      (markPx *
                                                          notionalSymbolQtyNum)) *
                                                  100
                                              ).toFixed(3);

                                    setTakeProfitGain?.(
                                        newGainValue.toString(),
                                    );
                                }
                            }

                            setTpGainCurrency?.(currency);
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
                        !markPx ||
                        !notionalSymbolQtyNum
                            ? '...'
                            : tpGainCurrency === '%'
                              ? `$${Math.abs(expectedProfit).toFixed(2)}`
                              : `${pctFromDollars(Math.abs(expectedProfit), markPx, notionalSymbolQtyNum).toFixed(3)}%`}
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
                            setStopLossPrice?.(value);
                            setHasStopLossLossBeenTouched(false); // Reset touch state so loss can update from price
                            updateLossFromPrice(value);

                            // Clear loss if price is cleared
                            if (value === '') {
                                setStopLossLoss?.('');
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
                            setStopLossLoss?.(value);
                            setHasStopLossLossBeenTouched(true);
                            updatePriceFromLoss(value);

                            // Clear price if loss is cleared
                            if (value === '') {
                                setStopLossPrice?.('');
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
                                markPx &&
                                notionalSymbolQtyNum
                            ) {
                                const currentLoss = parseFloat(stopLossLoss);
                                if (Number.isFinite(currentLoss)) {
                                    // Convert current loss to USD
                                    const currentLossUSD =
                                        slLossCurrency === '$'
                                            ? currentLoss
                                            : (currentLoss *
                                                  (markPx *
                                                      notionalSymbolQtyNum)) /
                                              100;

                                    // Convert USD to new currency
                                    const newLossValue =
                                        currency === '$'
                                            ? currentLossUSD.toFixed(2)
                                            : (
                                                  (currentLossUSD /
                                                      (markPx *
                                                          notionalSymbolQtyNum)) *
                                                  100
                                              ).toFixed(3);

                                    setStopLossLoss?.(newLossValue.toString());
                                }
                            }

                            setSlLossCurrency?.(currency);
                        }}
                        cssPositioning='fixed'
                    />
                </div>
            </div>
            <span className={styles.expectedProfitText}>
                {stopLossLoss ? (
                    <>
                        {`${expectedLoss && expectedLoss < 0 ? 'Expected Profit' : 'Expected Loss'}: `}
                        {expectedLoss == null
                            ? '...'
                            : slLossCurrency === '%'
                              ? `$${Math.abs(expectedLoss).toFixed(2)}`
                              : `${((Math.abs(expectedLoss) / (markPx * notionalSymbolQtyNum)) * 100).toFixed(3)}%`}
                    </>
                ) : (
                    ''
                )}
            </span>
        </section>
    );

    const showTakeProfitToggle = ['market', 'limit'].includes(marketOrderType);
    const showReduceToggle = marketOrderType !== 'chase_limit';
    const showChasingInterval = marketOrderType === 'chase_limit';
    const showChaseDistance = false;
    const showRandomizeToggle = marketOrderType === 'twap';

    const chasingIntervalToggle = showChasingInterval && (
        <div className={styles.chasingIntervalContainer}>
            <div className={styles.inputDetailsDataContent}>
                <div className={styles.inputDetailsLabel}>
                    <span>Chasing Interval</span>
                    <Tooltip content={'chasing interval'} position='right'>
                        <LuCircleHelp size={12} />
                    </Tooltip>
                </div>
                <span className={styles.inputDetailValue}>Atomic</span>
            </div>

            {showChaseDistance && (
                <div className={styles.reduceToggleContent}>
                    <ToggleSwitch
                        isOn={isChasingIntervalEnabled}
                        onToggle={handleToggleIsChasingInterval}
                        label=''
                        aria-label={t('aria.toggleChasingInterval')}
                    />
                    <h3 className={styles.toggleLabel}>Max Chase Distance</h3>
                </div>
            )}
            {showChaseDistance && isChasingIntervalEnabled && (
                <ChaseDistance
                    value={chaseDistance}
                    onChange={(val) => {
                        if (typeof val === 'string') setChaseDistance(val);
                        else if ('target' in val)
                            setChaseDistance(val.target.value);
                    }}
                    selectedMode={chaseMode}
                    setSelectedMode={setChaseMode}
                    symbol='ETH'
                    ariaLabel='Chase distance input'
                />
            )}
        </div>
    );

    return (
        <div className={styles.reduceToggleContainer}>
            {showRandomizeToggle && (
                <div className={styles.reduceToggleContent}>
                    <ToggleSwitch
                        isOn={isRandomizeEnabled}
                        onToggle={handleToggleRandomize}
                        label=''
                        aria-label={t('aria.toggleRandomize')}
                    />
                    <h3 className={styles.toggleLabel}>Randomize</h3>
                </div>
            )}
            {showReduceToggle && (
                <div
                    className={styles.reduceToggleContent}
                    onClick={() => handleToggleReduceOnly()}
                >
                    <ToggleSwitch
                        isOn={isReduceOnlyEnabled}
                        onToggle={handleToggleReduceOnly}
                        label={t('tradeTable.reduceOnly')}
                        aria-label={t('aria.toggleReduceOnly')}
                        reverse
                    />
                </div>
            )}
            {showTakeProfitToggle && (
                <div className={styles.reduceToggleContent}>
                    <ToggleSwitch
                        isOn={isTakeProfitEnabled}
                        onToggle={handleToggleProfitOnly}
                        label={t('transactions.tpslToggleLabel')}
                        aria-label={t('aria.toggleTPSL')}
                        reverse
                    />
                </div>
            )}
            {chasingIntervalToggle}
            {isTakeProfitEnabled && formDisplay}
        </div>
    );
}
