import { useMemo, useState } from 'react';
import styles from './TakeProfitsModal.module.css';
import { BsChevronDown } from 'react-icons/bs';
import ToggleSwitch from '../ToggleSwitch/ToggleSwitch';
import type { PositionIF } from '~/utils/UserDataIFs';

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
}

export default function TakeProfitsModal(props: PropIF) {
    const { closeTPModal, position } = props;

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

    const calculateExpectedProfit = (): number | null => {
        console.log('Calculate expected profit:', {
            gain: formData.gain,
            currency: formData.gainCurrency,
            position: position,
        });
        return null;
    };

    const calculateExpectedLoss = (): number | null => {
        console.log('Calculate expected loss:', {
            loss: formData.loss,
            currency: formData.lossCurrency,
            position: position,
        });
        return null;
    };

    const updateTPPriceFromGain = (gainValue: string) => {
        console.log('Update TP price from gain:', {
            gain: gainValue,
            currency: formData.gainCurrency,
            position: position,
        });
    };

    const updateSLPriceFromLoss = (lossValue: string) => {
        console.log('Update SL price from loss:', {
            loss: lossValue,
            currency: formData.lossCurrency,
            position: position,
        });
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
        { label: 'Entry Price', value: position.entryPx.toLocaleString() },
        { label: 'Mark Price', value: '...' },
    ];

    const handleInputChange = (
        field: keyof TPSLFormData,
        value: string | boolean,
    ) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));

        if (field === 'gain' && typeof value === 'string') {
            updateTPPriceFromGain(value);
        } else if (field === 'loss' && typeof value === 'string') {
            updateSLPriceFromLoss(value);
        }
    };

    const handleCurrencyToggle = (field: 'gainCurrency' | 'lossCurrency') => {
        setFormData((prev) => ({
            ...prev,
            [field]: prev[field] === '$' ? '%' : '$',
        }));

        console.log(
            `${field} changed to:`,
            formData[field] === '$' ? '%' : '$',
        );

        // Recalculate price when currency changes
        if (field === 'gainCurrency' && formData.gain) {
            updateTPPriceFromGain(formData.gain);
        } else if (field === 'lossCurrency' && formData.loss) {
            updateSLPriceFromLoss(formData.loss);
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
        const hasTpData = formData.tpPrice.trim() !== '';
        const hasSlData = formData.slPrice.trim() !== '';
        return hasTpData || hasSlData;
    };

    const expectedProfit = useMemo(() => {
        console.log('Calculate expected profit:', {
            gain: formData.gain,
            currency: formData.gainCurrency,
            position: position,
        });
        return null;
    }, [formData.gain, formData.gainCurrency, position]);

    const expectedLoss = useMemo(() => {
        console.log('Calculate expected loss:', {
            loss: formData.loss,
            currency: formData.lossCurrency,
            position: position,
        });
        return null;
    }, [formData.loss, formData.lossCurrency, position]);

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
                    <div className={styles.inputWithoutDropdown}>
                        <input
                            type='number'
                            value={formData.tpPrice}
                            onChange={(e) =>
                                handleInputChange('tpPrice', e.target.value)
                            }
                            placeholder='Take Profit Price'
                        />
                    </div>
                    <div className={styles.inputWithDropdown}>
                        <input
                            type='number'
                            value={formData.gain}
                            onChange={(e) =>
                                handleInputChange('gain', e.target.value)
                            }
                            placeholder='Gain'
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
                        {expectedProfit
                            ? `$${expectedProfit.toFixed(2)}`
                            : 'Calculating...'}
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
                            placeholder='Stop Loss Price'
                        />
                    </div>
                    <div className={styles.inputWithDropdown}>
                        <input
                            type='number'
                            value={formData.loss}
                            onChange={(e) =>
                                handleInputChange('loss', e.target.value)
                            }
                            placeholder='Loss'
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
                        Expected Loss:{' '}
                        {expectedLoss
                            ? `$${expectedLoss.toFixed(2)}`
                            : 'Calculating...'}
                    </span>
                )}
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
