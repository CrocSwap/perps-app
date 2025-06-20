import { AiOutlineQuestionCircle } from 'react-icons/ai';
import ToggleSwitch from '../../ToggleSwitch/ToggleSwitch';
import styles from './ReduceAndProfitToggle.module.css';
import Tooltip from '~/components/Tooltip/Tooltip';
import { useState } from 'react';
import { BsChevronDown } from 'react-icons/bs';
import ChaseDistance from '../ChaseDistance/ChaseDistance';

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
    const [formData, setFormData] = useState<TPSLFormData>({
        tpPrice: '',
        slPrice: '',
        gain: '',
        loss: '',
        gainCurrency: '$',
        lossCurrency: '$',
        configureAmount: false,
        limitPrice: false,
    });
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
    } = props;

    const handleInputChange = (
        field: keyof TPSLFormData,
        value: string | boolean,
    ) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleCurrencyToggle = (field: 'gainCurrency' | 'lossCurrency') => {
        setFormData((prev) => ({
            ...prev,
            [field]: prev[field] === '$' ? '%' : '$',
        }));
    };

    const formDisplay = (
        <section className={styles.formContainer}>
            <div className={styles.formRow}>
                <div className={styles.inputWithoutDropdown}>
                    <input
                        type='number'
                        value={formData.tpPrice}
                        onChange={(e) =>
                            handleInputChange('tpPrice', e.target.value)
                        }
                        placeholder='0.00'
                    />
                </div>
                <div className={styles.inputWithDropdown}>
                    <input
                        type='number'
                        value={formData.gain}
                        onChange={(e) =>
                            handleInputChange('gain', e.target.value)
                        }
                        placeholder='0.00'
                    />
                    <button
                        onClick={() => handleCurrencyToggle('gainCurrency')}
                    >
                        <span>{formData.gainCurrency}</span>
                        <BsChevronDown size={16} />
                    </button>
                </div>
            </div>
            {formData.gain && (
                <span className={styles.expectedProfitText}>
                    Expected Profit:{' '}
                </span>
            )}

            <div className={styles.formRow}>
                <div className={styles.inputWithoutDropdown}>
                    <input
                        type='number'
                        value={formData.slPrice}
                        onChange={(e) =>
                            handleInputChange('slPrice', e.target.value)
                        }
                        placeholder='0.00'
                    />
                </div>
                <div className={styles.inputWithDropdown}>
                    <input
                        type='number'
                        value={formData.loss}
                        onChange={(e) =>
                            handleInputChange('loss', e.target.value)
                        }
                        placeholder='0.00'
                    />
                    <button
                        onClick={() => handleCurrencyToggle('lossCurrency')}
                    >
                        <span>{formData.lossCurrency}</span>
                        <BsChevronDown size={16} />
                    </button>
                </div>
            </div>
            {formData.loss && (
                <span className={styles.expectedProfitText}>
                    Expected Profit
                </span>
            )}
        </section>
    );

    const showTakeProfitToggle = ['market', 'limit'].includes(marketOrderType);
    const showReduceToggle = marketOrderType !== 'chase_limit';

    const showRandomizeToggle = marketOrderType === 'twap';

    const chasingIntervalToggle = marketOrderType === 'chase_limit' && (
        <div className={styles.chasingIntervalContainer}>
            <div className={styles.inputDetailsDataContent}>
                <div className={styles.inputDetailsLabel}>
                    <span>Chasing Interval</span>
                    <Tooltip content={'chasing interval'} position='right'>
                        <AiOutlineQuestionCircle size={13} />
                    </Tooltip>
                </div>
                <span className={styles.inputDetailValue}>Per 1s</span>
            </div>

            <div className={styles.reduceToggleContent}>
                <ToggleSwitch
                    isOn={isChasingIntervalEnabled}
                    onToggle={handleToggleIsChasingInterval}
                    label=''
                />

                <h3 className={styles.toggleLabel}>Max Chase Distance</h3>
            </div>
            {isChasingIntervalEnabled && (
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
                        label=''
                    />
                    <h3 className={styles.toggleLabel}>Reduce Only</h3>
                </div>
            )}
            {showTakeProfitToggle && (
                <div
                    className={styles.reduceToggleContent}
                    onClick={() => handleToggleProfitOnly()}
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
