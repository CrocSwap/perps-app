import React, { useCallback } from 'react';
import NumFormattedInput from '~/components/Inputs/NumFormattedInput/NumFormattedInput';
import styles from './PriceInput.module.css';

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

    const handleContainerClick = useCallback(() => {
        const inputId = isModal ? 'modal-price-input' : 'price-input';
        const input = document.getElementById(inputId);
        if (input) {
            input.focus();
        }
    }, [isModal]);

    return (
        <div
            className={`${styles.priceInputContainer}
             ${showMidButton ? styles.chaseLimit : ''}
             ${isModal ? styles.modalContainer : ''}
              `}
            onClick={handleContainerClick}
        >
            <span>Price</span>
            <NumFormattedInput
                id={isModal ? 'modal-price-input' : 'price-input'}
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                onKeyDown={onKeyDown}
                className={className}
                aria-label={ariaLabel}
                placeholder='Enter Price'
            />
            {showMidButton && (
                <button
                    className={`${styles.midButton} ${isMidModeActive ? styles.midButtonActive : ''}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (!isMidModeActive) {
                            setMidPriceAsPriceInput();
                            setIsMidModeActive(true);
                        } else {
                            setIsMidModeActive(false);
                        }
                    }}
                >
                    Mid
                </button>
            )}
        </div>
    );
}
