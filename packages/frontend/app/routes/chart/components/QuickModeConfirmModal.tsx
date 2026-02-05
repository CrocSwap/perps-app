import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { t } from 'i18next';
import {
    isEstablished,
    SessionButton,
    useSession,
} from '@fogo/sessions-sdk-react';
import NumFormattedInput from '~/components/Inputs/NumFormattedInput/NumFormattedInput';
import useNumFormatter from '~/hooks/useNumFormatter';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import {
    useOrderPlacementStore,
    type TradeType,
} from '../hooks/useOrderPlacement';
import type { OrderBookMode } from '~/utils/orderbook/OrderBookIFs';
import styles from './QuickModeConfirmModal.module.css';

interface QuickModeConfirmModalProps {
    onClose: () => void;
    onSave: (data: {
        size: number;
        tradeType: TradeType;
        currency: string;
        bypassConfirmation: boolean;
    }) => void;
    onSaveAndEnable: (data: {
        size: number;
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

    const { symbol, symbolInfo } = useTradeDataStore();
    const upperSymbol = symbol?.toUpperCase() ?? 'BTC';
    const markPx = symbolInfo?.markPx;

    const { formatNumWithOnlyDecimals } = useNumFormatter();

    const activeOrder = useOrderPlacementStore((state) => state.activeOrder);
    const quickMode = useOrderPlacementStore((state) => state.quickMode);

    const [size, setSize] = useState<string>('');
    const [tradeType, setTradeType] = useState<TradeType>('Limit');
    const [denom, setDenom] = useState<OrderBookMode>('usd');

    const [dropdownTradeOpen, setDropdownTradeOpen] = useState(false);
    const [dropdownDenomOpen, setDropdownDenomOpen] = useState(false);
    const [saveAsDefault, setSaveAsDefault] = useState(false);

    const tradeTypeRef = useRef<HTMLDivElement>(null);
    const denomRef = useRef<HTMLDivElement>(null);
    const prevDenomRef = useRef<OrderBookMode | null>(null);

    const isDisabled = !size || parseFloat(size) <= 0;

    const tradeTypes: TradeType[] = ['Limit'];

    // Memoized denomination options (same as SizeInput.tsx)
    const denomOptions = useMemo(() => [upperSymbol, 'USD'], [upperSymbol]);

    // Memoized denomination change handler (same logic as SizeInput.tsx)
    const handleDenomChange = useCallback(
        (val: string) => {
            setDenom(val === upperSymbol ? 'symbol' : 'usd');
        },
        [upperSymbol],
    );

    useEffect(() => {
        if (activeOrder) {
            setSize(activeOrder.size.toString());
            setTradeType(activeOrder.tradeType);
            // Convert currency string to internal format (same logic as SizeInput.tsx)
            const newDenom =
                activeOrder.currency === upperSymbol ? 'symbol' : 'usd';
            setDenom(newDenom);
            // Reset prevDenom when loading from activeOrder
            prevDenomRef.current = newDenom;
            setSaveAsDefault(activeOrder.bypassConfirmation);
        }
    }, [activeOrder, upperSymbol]);

    // Convert size value when denomination changes (same as OrderInput.tsx)
    useEffect(() => {
        // Only convert if we have a previous denom and it's different from current
        if (prevDenomRef.current === null || prevDenomRef.current === denom) {
            prevDenomRef.current = denom;
            return;
        }

        if (!size || !markPx) return;
        const parsedQty = parseFloat(size);
        if (isNaN(parsedQty)) return;

        // Determine conversion direction based on previous and current denom (same as OrderInput.tsx)
        if (prevDenomRef.current === 'symbol' && denom === 'usd') {
            // Symbol to USD: multiply by markPx
            setSize(formatNumWithOnlyDecimals(parsedQty * markPx, 2));
        } else if (prevDenomRef.current === 'usd' && denom === 'symbol') {
            // USD to Symbol: divide by markPx
            setSize(formatNumWithOnlyDecimals(parsedQty / markPx, 6, true));
        }

        // Update previous denom
        prevDenomRef.current = denom;
    }, [denom, size, markPx, formatNumWithOnlyDecimals]);

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
        const parsed = parseFloat(size);
        if (parsed > 0) {
            onSave({
                size: parsed,
                tradeType,
                // Convert internal format to display format (same logic as SizeInput.tsx)
                currency: denom === 'usd' ? 'USD' : upperSymbol,
                bypassConfirmation: saveAsDefault,
            });
            onClose();
        }
    };

    const handleSaveAndEnable = () => {
        const parsed = parseFloat(size);
        if (parsed > 0) {
            onSaveAndEnable({
                size: parsed,
                tradeType,
                // Convert internal format to display format (same logic as SizeInput.tsx)
                currency: denom === 'usd' ? 'USD' : upperSymbol,
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
                        <h3 className={styles.title}>
                            {t('quickTrade.title')}
                        </h3>
                        <p className={`${styles.infoText} ${styles.active}`}>
                            {t('quickTrade.infoText')}
                        </p>
                    </div>
                </div>
                <div className={styles.horizontal_divider} />
                <div>
                    <p className={styles.description}>
                        {t('quickTrade.description')}
                    </p>
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
                    <span className={styles.sizeLabel}>
                        {t('transactions.size')}
                    </span>

                    <div className={styles.inputWrapper}>
                        <NumFormattedInput
                            value={size}
                            onChange={(e) =>
                                setSize(
                                    typeof e === 'string' ? e : e.target.value,
                                )
                            }
                            placeholder={t('transactions.enterSize')}
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
                            {denom === 'usd' ? 'USD' : upperSymbol}
                            <span className={styles.denomArrow}>▼</span>
                        </button>

                        {dropdownDenomOpen && (
                            <div className={styles.denomDropdown}>
                                {denomOptions.map((opt) => (
                                    <div
                                        key={opt}
                                        onClick={() => {
                                            handleDenomChange(opt);
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
                        {t('quickTrade.enableConfirmationBypass')}
                    </span>
                </div>

                <div className={styles.buttonGroup}>
                    <button className={styles.cancelButton} onClick={onClose}>
                        {t('common.cancel')}
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
                                {t('common.save')}
                            </button>

                            {!quickMode && (
                                <button
                                    className={styles.confirmButton}
                                    disabled={isDisabled}
                                    onClick={() => {
                                        if (!isDisabled) handleSaveAndEnable();
                                    }}
                                >
                                    {t('quickTrade.saveAndEnable')}
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>

            <div className={styles.overlay} onClick={onClose} />
        </>
    );
};
