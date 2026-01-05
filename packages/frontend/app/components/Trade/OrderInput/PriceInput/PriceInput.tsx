import { useCallback } from 'react';
import NumFormattedInput from '~/components/Inputs/NumFormattedInput/NumFormattedInput';
import styles from './PriceInput.module.css';
import { t } from 'i18next';

interface PropsIF {
    value: string;
    onChange: (event: React.ChangeEvent<HTMLInputElement> | string) => void;
    onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
    onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
    className?: string;
    ariaLabel?: string;
    showMidButton: boolean;
    setMidPriceAsPriceInput: () => void;
    isMidModeActive: boolean;
    setIsMidModeActive: (value: boolean) => void;
    isModal?: boolean;
}
export default function PriceInput(props: PropsIF) {
    const {
        value,
        onChange,
        onBlur,
        onKeyDown,
        className,
        ariaLabel,
        showMidButton,
        setMidPriceAsPriceInput,
        isMidModeActive,
        setIsMidModeActive,
        isModal = false,
    } = props;

    // autofocus trade-module-price-input when user clicks anywhere in priceInputContainer except for the midButton
    const handleContainerClick = useCallback((e: React.MouseEvent) => {
        // Don't focus if user is selecting text
        const selection = window.getSelection();
        if (selection && selection.toString().length > 0) {
            return;
        }

        const priceInput = document.getElementById(
            'trade-module-price-input',
        ) as HTMLInputElement;

        // Only focus if the click target is the container itself (not a child element)
        if (e.target === e.currentTarget) {
            priceInput.focus();
            priceInput.select();
        }
    }, []);

    const handleInputFocus = useCallback(() => {
        if (!showMidButton || !isMidModeActive) return;
        setIsMidModeActive(false);
    }, [showMidButton, isMidModeActive, setIsMidModeActive]);

    return (
        <div
            id='trade-module-price-input-container'
            className={`${styles.priceInputContainer}
             ${showMidButton ? styles.chaseLimit : ''}
             ${isModal ? styles.modalContainer : ''}

              `}
            onClick={handleContainerClick}
        >
            <span>{t('transactions.price')}</span>
            <NumFormattedInput
                id='trade-module-price-input'
                value={value}
                onChange={onChange}
                onFocus={handleInputFocus}
                onBlur={onBlur}
                onKeyDown={onKeyDown}
                className={className}
                aria-label={ariaLabel}
                placeholder={t('transactions.enterPrice')}
            />
            {showMidButton && (
                <button
                    className={`${styles.midButton} ${isMidModeActive ? styles.midButtonActive : ''}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        e.nativeEvent.stopImmediatePropagation();
                        if (!isMidModeActive) {
                            setMidPriceAsPriceInput();
                            setIsMidModeActive(true);
                        } else {
                            setIsMidModeActive(false);
                        }
                    }}
                    aria-pressed={isMidModeActive}
                    aria-label={t('aria.setMidPrice', 'Set mid price')}
                >
                    {t('transactions.midButton')}
                </button>
            )}
        </div>
    );
}
