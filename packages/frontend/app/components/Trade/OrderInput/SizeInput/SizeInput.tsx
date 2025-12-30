import React, { useCallback, useMemo } from 'react';
import ComboBox from '~/components/Inputs/ComboBox/ComboBox';
import NumFormattedInput from '~/components/Inputs/NumFormattedInput/NumFormattedInput';
import type { OrderBookMode } from '~/utils/orderbook/OrderBookIFs';
import styles from './SizeInput.module.css';
import { t } from 'i18next';

interface PropsIF {
    inputId?: string;
    value: string;
    onChange: (event: React.ChangeEvent<HTMLInputElement> | string) => void;
    onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
    onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
    className?: string;
    ariaLabel?: string;
    useTotalSize: boolean;
    symbol: string;
    selectedDenom: OrderBookMode;
    setSelectedDenom: React.Dispatch<React.SetStateAction<OrderBookMode>>;
    onFocus: () => void;
    onUnfocus?: () => void;
    isModal?: boolean;
    autoFocus?: boolean;
    isEditing?: boolean;
}

const SizeInput: React.FC<PropsIF> = React.memo((props) => {
    const {
        value,
        inputId,
        onChange,
        onBlur,
        onKeyDown,
        className,
        ariaLabel,
        useTotalSize,
        symbol,
        selectedDenom,
        setSelectedDenom,
        onFocus,
        onUnfocus,
        isModal = false,
        isEditing = false,
    } = props;

    // temporarily only show BTC in the limit close modal
    // Memoized ComboBox options
    const comboBoxOptions = useMemo(
        () => [symbol.toUpperCase(), 'USD'],
        [symbol],
    );

    // Memoized ComboBox onChange handler
    const handleComboBoxChange = useCallback(
        (val: string) => {
            setSelectedDenom(val === symbol.toUpperCase() ? 'symbol' : 'usd');
        },
        [setSelectedDenom, symbol],
    );

    // Handle blur when isEditing becomes false
    React.useEffect(() => {
        if (!isEditing) {
            const input = document.getElementById(
                'trade-module-size-input',
            ) as HTMLInputElement;
            if (document.activeElement === input) {
                input.blur();
                onUnfocus?.();
            }
        }
    }, [isEditing, onUnfocus]);

    // autofocus trade-module-size-input when user clicks anywhere in sizeInputContainer except for the tokenButton
    const handleContainerClick = useCallback((e: React.MouseEvent) => {
        // Don't focus if user is selecting text
        const selection = window.getSelection();
        if (selection && selection.toString().length > 0) {
            return;
        }

        const sizeInput = document.getElementById(
            'trade-module-size-input',
        ) as HTMLInputElement;

        // Only focus if the click target is the container itself (not a child element)
        if (e.target === e.currentTarget) {
            sizeInput.focus();
            sizeInput.select();
        }
    }, []);

    return (
        <div
            className={`${styles.sizeInputContainer} ${isModal && styles.modalContainer}`}
            onClick={handleContainerClick}
        >
            <span>
                {useTotalSize
                    ? t('transactions.totalSize')
                    : t('transactions.size')}
            </span>
            <NumFormattedInput
                id={inputId || 'trade-module-size-input'}
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                onKeyDown={onKeyDown}
                className={className}
                aria-label={ariaLabel}
                placeholder={t('transactions.enterSize')}
                onFocus={onFocus}
                autoFocus={props.autoFocus}
            />
            <button
                className={styles.tokenButton}
                id='trade-module-token-button'
                onClick={(e) => {
                    e.stopPropagation();
                    e.nativeEvent.stopImmediatePropagation();
                }}
                aria-label={t(
                    'aria.selectSizeDenomination',
                    'Select size denomination',
                )}
            >
                <ComboBox
                    key={selectedDenom}
                    value={
                        selectedDenom === 'usd' ? 'USD' : symbol.toUpperCase()
                    }
                    options={comboBoxOptions}
                    onChange={handleComboBoxChange}
                    cssPositioning='fixed'
                />
            </button>
        </div>
    );
});

export default SizeInput;
