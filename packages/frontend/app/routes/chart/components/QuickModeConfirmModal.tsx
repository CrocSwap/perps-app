import { useState, useEffect, useRef } from 'react';
import {
    isEstablished,
    SessionButton,
    useSession,
} from '@fogo/sessions-sdk-react';
import NumFormattedInput from '~/components/Inputs/NumFormattedInput/NumFormattedInput';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import styles from './QuickModeConfirmModal.module.css';

export type TradeType = 'Market' | 'Limit';

interface QuickModeConfirmModalProps {
    onClose: () => void;
    onSave: (data: {
        amount: number;
        tradeType: TradeType;
        currency: string;
        bypassConfirmation: boolean;
    }) => void;
    onSaveAndEnable: (data: {
        amount: number;
        tradeType: TradeType;
        currency: string;
        bypassConfirmation: boolean;
    }) => void;
}

export const QuickModeConfirmModal: React.FC<QuickModeConfirmModalProps> = ({
    onClose,
    onSave,
    onSaveAndEnable,
}) => {
    const session = useSession();
    const isSessionEstablished = isEstablished(session);

    const { symbol } = useTradeDataStore();
    const upperSymbol = symbol?.toUpperCase() ?? 'BTC';

    const [amount, setAmount] = useState<string>('');
    const [tradeType, setTradeType] = useState<TradeType>('Limit');
    const [denom, setDenom] = useState<'USD' | string>('USD');

    const [dropdownTradeOpen, setDropdownTradeOpen] = useState(false);
    const [dropdownDenomOpen, setDropdownDenomOpen] = useState(false);
    const [saveAsDefault, setSaveAsDefault] = useState(false);

    const tradeTypeRef = useRef<HTMLDivElement>(null);
    const denomRef = useRef<HTMLDivElement>(null);

    const isDisabled = !amount || parseFloat(amount) <= 0;

    const tradeTypes: TradeType[] = ['Limit'];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                tradeTypeRef.current &&
                !tradeTypeRef.current.contains(event.target as Node)
            ) {
                setDropdownTradeOpen(false);
            }
            if (
                denomRef.current &&
                !denomRef.current.contains(event.target as Node)
            ) {
                setDropdownDenomOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSave = () => {
        const parsed = parseFloat(amount);
        if (parsed > 0) {
            onSave({
                amount: parsed,
                tradeType,
                currency: denom,
                bypassConfirmation: saveAsDefault,
            });
            onClose();
        }
    };

    const handleSaveAndEnable = () => {
        const parsed = parseFloat(amount);
        if (parsed > 0) {
            onSaveAndEnable({
                amount: parsed,
                tradeType,
                currency: denom,
                bypassConfirmation: saveAsDefault,
            });
            onClose();
        }
    };

    return (
        <>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <div className={styles.iconWrapper}>
                        <span className={styles.icon}>!</span>
                    </div>

                    <div>
                        <h3 className={styles.title}>Quick Trade Mode</h3>
                        <p className={styles.description}>
                            Configure quick trade settings for faster order
                            placement
                        </p>
                    </div>
                </div>

                <div className={styles.tradeTypeWrapper} ref={tradeTypeRef}>
                    <button
                        onClick={() => setDropdownTradeOpen(!dropdownTradeOpen)}
                        className={styles.tradeTypeButton}
                    >
                        {tradeType}
                        <span className={styles.arrow}>▼</span>
                    </button>

                    {dropdownTradeOpen && (
                        <div className={styles.dropdown}>
                            {tradeTypes.map((type) => (
                                <div
                                    key={type}
                                    onClick={() => {
                                        setTradeType(type);
                                        setDropdownTradeOpen(false);
                                    }}
                                    className={styles.dropdownItem}
                                >
                                    {type}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* SIZE + DENOM */}
                <div className={styles.sizeWrapper}>
                    <span className={styles.sizeLabel}>Size</span>

                    <div className={styles.inputWrapper}>
                        <NumFormattedInput
                            value={amount}
                            onChange={(e) =>
                                setAmount(
                                    typeof e === 'string' ? e : e.target.value,
                                )
                            }
                            placeholder='Enter Size'
                            className='quick-mode-input size-input-padding'
                        />
                    </div>

                    {/* DENOM DROPDOWN */}
                    <div className={styles.denomWrapper} ref={denomRef}>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setDropdownDenomOpen(!dropdownDenomOpen);
                            }}
                            className={styles.denomButton}
                        >
                            {denom}
                            <span className={styles.denomArrow}>▼</span>
                        </button>

                        {dropdownDenomOpen && (
                            <div className={styles.denomDropdown}>
                                {[upperSymbol, 'USD'].map((opt) => (
                                    <div
                                        key={opt}
                                        onClick={() => {
                                            setDenom(opt);
                                            setDropdownDenomOpen(false);
                                        }}
                                        className={styles.denomDropdownItem}
                                    >
                                        {opt}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div
                    onClick={() => setSaveAsDefault(!saveAsDefault)}
                    className={styles.checkboxWrapper}
                >
                    <div
                        className={`${styles.checkbox} ${saveAsDefault ? styles.checked : ''}`}
                    >
                        {saveAsDefault && (
                            <svg
                                width='10'
                                height='8'
                                viewBox='0 0 10 8'
                                fill='none'
                                xmlns='http://www.w3.org/2000/svg'
                            >
                                <path
                                    d='M1 4L3.5 6.5L9 1'
                                    stroke='#000'
                                    strokeWidth='1.5'
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                />
                            </svg>
                        )}
                    </div>
                    <span className={styles.checkboxLabel}>
                        Enable Confirmation bypass
                    </span>
                </div>

                <div className={styles.buttonGroup}>
                    <button className={styles.cancelButton} onClick={onClose}>
                        Cancel
                    </button>

                    {!isSessionEstablished ? (
                        <div className={styles.sessionButtonWrapper}>
                            <SessionButton />
                        </div>
                    ) : (
                        <>
                            <button
                                className={styles.saveButton}
                                disabled={isDisabled}
                                onClick={() => {
                                    if (!isDisabled) handleSave();
                                }}
                            >
                                Save
                            </button>

                            <button
                                className={styles.confirmButton}
                                disabled={isDisabled}
                                onClick={() => {
                                    if (!isDisabled) handleSaveAndEnable();
                                }}
                            >
                                Save & Enable
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className={styles.overlay} onClick={onClose} />
        </>
    );
};
