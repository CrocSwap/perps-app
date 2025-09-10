import { useMemo, useState } from 'react';
import { LuCircleHelp } from 'react-icons/lu';
import Tooltip from '~/components/Tooltip/Tooltip';
import ToggleSwitch from '../../ToggleSwitch/ToggleSwitch';
import ChaseDistance from '../ChaseDistance/ChaseDistance';
import styles from './ReduceAndProfitToggle.module.css';
import ComboBox from '~/components/Inputs/ComboBox/ComboBox';

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
    const [chaseDistance, setChaseDistance] = useState('');
    const [chaseMode, setChaseMode] = useState<'usd' | 'symbol'>('usd');
    const currencyOptions: Array<'$' | '%'> = ['$', '%'];

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

        setTakeProfitPrice?.(newPrice.toFixed(6));
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

        setStopLossPrice?.(newPrice.toFixed(6));
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
                    <p>SL Price</p>
                    <input
                        type='number'
                        value={takeProfitPrice}
                        onChange={(e) => {
                            console.log('TP price changed:', e.target.value);
                            setTakeProfitPrice?.(e.target.value);
                        }}
                    />
                </div>
                <div className={styles.inputWithDropdown}>
                    <p>Gain</p>
                    <input
                        type='number'
                        value={takeProfitGain}
                        onChange={(e) => {
                            console.log('TP gain changed:', e.target.value);
                            setTakeProfitGain?.(e.target.value);
                            updatePriceFromGain(e.target.value);
                        }}
                    />
                    <ComboBox
                        value={tpGainCurrency}
                        options={currencyOptions}
                        onChange={(val) => {
                            const currency = val as '$' | '%';
                            setTpGainCurrency?.(currency);
                            if (takeProfitGain) {
                                updatePriceFromGain(takeProfitGain);
                            }
                        }}
                        cssPositioning='fixed'
                    />
                </div>
            </div>
            {takeProfitGain && (
                <span className={styles.expectedProfitText}>
                    Expected Profit:{' '}
                    {expectedProfit
                        ? `$${expectedProfit.toFixed(2)}`
                        : 'Calculating...'}
                </span>
            )}

            {/* Stop Loss Row */}
            <div className={styles.formRow}>
                <div className={styles.inputWithoutDropdown}>
                    <p>SL Price</p>
                    <input
                        type='number'
                        value={stopLossPrice}
                        onChange={(e) => {
                            console.log('SL price changed:', e.target.value);
                            setStopLossPrice?.(e.target.value);
                        }}
                    />
                </div>
                <div className={styles.inputWithDropdown}>
                    <p>Loss</p>
                    <input
                        type='number'
                        value={stopLossLoss}
                        onChange={(e) => {
                            console.log('SL loss changed:', e.target.value);
                            setStopLossLoss?.(e.target.value);
                            updatePriceFromLoss(e.target.value);
                        }}
                    />
                    <ComboBox
                        value={slLossCurrency}
                        options={currencyOptions}
                        onChange={(val) => {
                            const currency = val as '$' | '%';
                            setSlLossCurrency?.(currency);
                            if (stopLossLoss) {
                                updatePriceFromLoss(stopLossLoss);
                            }
                        }}
                        cssPositioning='fixed'
                    />
                </div>
            </div>
            {stopLossLoss && (
                <span className={styles.expectedProfitText}>
                    Expected Loss:{' '}
                    {expectedLoss
                        ? `$${expectedLoss.toFixed(2)}`
                        : 'Calculating...'}
                </span>
            )}
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
                        label='Reduce Only'
                        reverse
                    />
                </div>
            )}
            {showTakeProfitToggle && (
                <div className={styles.reduceToggleContent}>
                    <ToggleSwitch
                        isOn={isTakeProfitEnabled}
                        onToggle={handleToggleProfitOnly}
                        label='Take Profit / Stop Loss'
                        reverse
                    />
                </div>
            )}
            {chasingIntervalToggle}
            {isTakeProfitEnabled && formDisplay}
        </div>
    );
}
