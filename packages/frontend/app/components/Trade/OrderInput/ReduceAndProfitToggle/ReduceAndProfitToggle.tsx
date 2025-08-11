import { useMemo, useState } from 'react';
import { BsChevronDown } from 'react-icons/bs';
import { LuCircleHelp } from 'react-icons/lu';
import Tooltip from '~/components/Tooltip/Tooltip';
import ToggleSwitch from '../../ToggleSwitch/ToggleSwitch';
import ChaseDistance from '../ChaseDistance/ChaseDistance';
import styles from './ReduceAndProfitToggle.module.css';

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

    markPx?: number;
    symbol?: string;
    notionalSymbolQtyNum?: number;
    tradeDirection?: 'buy' | 'sell';
}
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
export default function ReduceAndProfitToggle(props: PropsIF) {
    const [chaseDistance, setChaseDistance] = useState('');
    const [chaseMode, setChaseMode] = useState<'usd' | 'symbol'>('usd');

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
        symbol,
        notionalSymbolQtyNum,
        tradeDirection,
    } = props;

    const calculateExpectedProfit = (): number | null => {
        console.log('Calculate expected profit:', {
            takeProfitPrice,
            takeProfitGain,
            tpGainCurrency,
        });
        return null;
    };

    const calculateExpectedLoss = (): number | null => {
        console.log('Calculate expected loss:', {
            stopLossPrice,
            stopLossLoss,
            slLossCurrency,
        });
        return null;
    };

    const updatePriceFromGain = (gainValue: string) => {
        console.log('Update TP price from gain:', gainValue, tpGainCurrency);
        if (setTakeProfitPrice) {
            // setTakeProfitPrice(calculatedPrice);
        }
    };

    const updatePriceFromLoss = (lossValue: string) => {
        console.log('Update SL price from loss:', lossValue, slLossCurrency);
        if (setStopLossPrice) {
            // setStopLossPrice(calculatedPrice);
        }
    };

    const handleCurrencyToggle = (field: 'gainCurrency' | 'lossCurrency') => {
        if (field === 'gainCurrency' && setTpGainCurrency) {
            const newCurrency = tpGainCurrency === '$' ? '%' : '$';
            setTpGainCurrency(newCurrency);
            console.log('TP currency changed to:', newCurrency);
        } else if (field === 'lossCurrency' && setSlLossCurrency) {
            const newCurrency = slLossCurrency === '$' ? '%' : '$';
            setSlLossCurrency(newCurrency);
            console.log('SL currency changed to:', newCurrency);
        }
    };

    const expectedProfit = useMemo(() => {
        console.log('Calculate expected profit:', {
            takeProfitPrice,
            takeProfitGain,
            tpGainCurrency,
        });
        return null;
    }, [takeProfitPrice, takeProfitGain, tpGainCurrency]);

    const expectedLoss = useMemo(() => {
        console.log('Calculate expected loss:', {
            stopLossPrice,
            stopLossLoss,
            slLossCurrency,
        });
        return null;
    }, [stopLossPrice, stopLossLoss, slLossCurrency]);
    const formDisplay = (
        <section className={styles.formContainer}>
            {/* Take Profit Row */}
            <div className={styles.formRow}>
                <div className={styles.inputWithoutDropdown}>
                    <input
                        type='number'
                        value={takeProfitPrice}
                        onChange={(e) => {
                            console.log('TP price changed:', e.target.value);
                            setTakeProfitPrice?.(e.target.value);
                        }}
                        placeholder='Take Profit Price'
                    />
                </div>
                <div className={styles.inputWithDropdown}>
                    <input
                        type='number'
                        value={takeProfitGain}
                        onChange={(e) => {
                            console.log('TP gain changed:', e.target.value);
                            setTakeProfitGain?.(e.target.value);
                            updatePriceFromGain(e.target.value);
                        }}
                        placeholder='Gain'
                    />
                    <button
                        onClick={() => handleCurrencyToggle('gainCurrency')}
                    >
                        <span>{tpGainCurrency}</span>
                        <BsChevronDown size={16} />
                    </button>
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
                    <input
                        type='number'
                        value={stopLossPrice}
                        onChange={(e) => {
                            console.log('SL price changed:', e.target.value);
                            setStopLossPrice?.(e.target.value);
                        }}
                        placeholder='Stop Loss Price'
                    />
                </div>
                <div className={styles.inputWithDropdown}>
                    <input
                        type='number'
                        value={stopLossLoss}
                        onChange={(e) => {
                            console.log('SL loss changed:', e.target.value);
                            setStopLossLoss?.(e.target.value);
                            updatePriceFromLoss(e.target.value);
                        }}
                        placeholder='Loss'
                    />
                    <button
                        onClick={() => handleCurrencyToggle('lossCurrency')}
                    >
                        <span>{slLossCurrency}</span>
                        <BsChevronDown size={16} />
                    </button>
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
                <div className={styles.reduceToggleContent}>
                    <ToggleSwitch
                        isOn={isReduceOnlyEnabled}
                        onToggle={handleToggleReduceOnly}
                        label=''
                    />
                    <h3 className={styles.toggleLabel}>Reduce Only</h3>
                </div>
            )}
            {showTakeProfitToggle && (
                <div
                    className={styles.reduceToggleContent}
                    onClick={() => {
                        console.log(
                            'TP/SL toggle clicked, current state:',
                            isTakeProfitEnabled,
                        );
                        handleToggleProfitOnly();
                    }}
                >
                    <ToggleSwitch
                        isOn={isTakeProfitEnabled}
                        onToggle={handleToggleProfitOnly}
                        label=''
                    />
                    <h3 className={styles.toggleLabel}>
                        Take Profit / Stop Loss
                    </h3>
                </div>
            )}
            {chasingIntervalToggle}
            {isTakeProfitEnabled && formDisplay}
        </div>
    );
}
