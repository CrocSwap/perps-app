import React, { useCallback, useMemo } from 'react';
import ComboBox from '~/components/Inputs/ComboBox/ComboBox';
import NumFormattedInput from '~/components/Inputs/NumFormattedInput/NumFormattedInput';
import type { OrderBookMode } from '~/utils/orderbook/OrderBookIFs';
import styles from './SizeInput.module.css';

interface PropsIF {
    value: string;
    onChange: (event: React.ChangeEvent<HTMLInputElement> | string) => void;
    onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
    onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
    className?: string;
    ariaLabel?: string;
    useTotalSize: boolean;
    symbol: string;
    selectedMode: OrderBookMode;
    setSelectedMode: React.Dispatch<React.SetStateAction<OrderBookMode>>;
    onFocus: () => void;
    isModal?: boolean;
}

const SizeInput: React.FC<PropsIF> = React.memo((props) => {
    const {
        value,
        onChange,
        onBlur,
        onKeyDown,
        className,
        ariaLabel,
        useTotalSize,
        symbol,
        selectedMode,
        setSelectedMode,
        onFocus,
        isModal = false,
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
            setSelectedMode(val === symbol.toUpperCase() ? 'symbol' : 'usd');
        },
        [setSelectedMode, symbol],
    );

    // Handle container click to focus input
    const handleContainerClick = useCallback(() => {
        console.log('Container clicked'); // Add this for debugging
        const inputId = isModal
            ? 'modal-trade-module-size-input'
            : 'trade-module-size-input';
        const input = document.getElementById(inputId);
        console.log('Input found:', input); // Add this too
        if (input) {
            input.focus();
        }
    }, [isModal]);

    return (
        <div
            className={`${styles.sizeInputContainer} ${isModal && styles.modalContainer}`}
            onClick={handleContainerClick}
        >
            <span>{useTotalSize ? 'Total Size' : 'Size'}</span>
            <NumFormattedInput
                id={
                    isModal
                        ? 'modal-trade-module-size-input'
                        : 'trade-module-size-input'
                }
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                onKeyDown={onKeyDown}
                className={className}
                aria-label={ariaLabel}
                placeholder='Enter Size'
                onFocus={onFocus}
            />
            <button
                className={styles.tokenButton}
                onClick={(e) => e.stopPropagation()}
            >
                <ComboBox
                    key={selectedMode}
                    value={
                        selectedMode === 'usd' ? 'USD' : symbol.toUpperCase()
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
