import { useState } from 'react';
import styles from './TakeProfitsModal.module.css';
import { BsChevronDown } from 'react-icons/bs';
import ToggleSwitch from '../ToggleSwitch/ToggleSwitch';
import type { PositionIF } from '~/utils/UserDataIFs';
import { t } from 'i18next';

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
    const infoData = [
        { label: 'Market', value: position.coin },
        {
            label: 'Position',
            value: `${Math.abs(position.szi)} ${position.coin}`,
        },
        { label: 'Entry Price', value: position.entryPx.toLocaleString() },
        { label: 'Mark Price', value: 'Loading...' },
    ];

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

    const handleConfirm = () => {
        if (!isFormValid()) {
            return;
        }
        console.log('Form submitted:', formData);
        closeTPModal();
    };

    const isFormValid = () => {
        // Check if at least one TP or SL pair is filled
        const hasTpData =
            formData.tpPrice.trim() !== '' && formData.gain.trim() !== '';
        const hasSlData =
            formData.slPrice.trim() !== '' && formData.loss.trim() !== '';

        return hasTpData || hasSlData;
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
                    <div className={styles.inputWithoutDropdown}>
                        <input
                            type='number'
                            value={formData.tpPrice}
                            onChange={(e) =>
                                handleInputChange('tpPrice', e.target.value)
                            }
                            placeholder='0.00'
                            aria-label={t(
                                'aria.takeProfitPrice',
                                'Take profit price',
                            )}
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
                            aria-label={t('aria.expectedGain', 'Expected gain')}
                        />
                        <button
                            onClick={() => handleCurrencyToggle('gainCurrency')}
                            aria-label={t(
                                'aria.toggleGainCurrency',
                                'Toggle gain currency between dollars and percent',
                            )}
                        >
                            <span>{formData.gainCurrency}</span>
                            <BsChevronDown size={16} aria-hidden='true' />
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
                            aria-label={t(
                                'aria.stopLossPrice',
                                'Stop loss price',
                            )}
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
                            aria-label={t('aria.expectedLoss', 'Expected loss')}
                        />
                        <button
                            onClick={() => handleCurrencyToggle('lossCurrency')}
                            aria-label={t(
                                'aria.toggleLossCurrency',
                                'Toggle loss currency between dollars and percent',
                            )}
                        >
                            <span>{formData.lossCurrency}</span>
                            <BsChevronDown size={16} aria-hidden='true' />
                        </button>
                    </div>
                </div>
                {formData.loss && (
                    <span className={styles.expectedProfitText}>
                        Expected Profit
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
                    aria-label={t('toggleConfigureAmount')}
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
                    aria-label={t('toggleLimitPrice')}
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
