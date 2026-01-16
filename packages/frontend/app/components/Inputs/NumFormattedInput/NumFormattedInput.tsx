import { useCallback, useEffect, useRef } from 'react';
import useNumFormatter from '~/hooks/useNumFormatter';
import styles from './NumFormattedInput.module.css';

interface NumFormattedInputProps {
    id?: string;
    value: string;
    onChange: (event: React.ChangeEvent<HTMLInputElement> | string) => void;
    onFocus?: () => void;
    onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
    onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
    className?: string;
    ariaLabel?: string;
    placeholder?: string;
    inputRegexOverride?: RegExp;
    autoFocus?: boolean;
    dataModalInitialFocus?: boolean;
}

const NumFormattedInput: React.FC<NumFormattedInputProps> = ({
    id,
    value,
    onChange,
    onFocus,
    onBlur,
    onKeyDown,
    className,
    ariaLabel,
    placeholder,
    inputRegexOverride,
    autoFocus,
    dataModalInitialFocus,
}) => {
    const {
        inputRegex,
        parseFormattedWithOnlyDecimals,
        formatNumWithOnlyDecimals,
    } = useNumFormatter();

    const valueNum = useRef<number | null>(null);

    useEffect(() => {
        if (valueNum.current === null) {
            return;
        }
        const str = formatNumWithOnlyDecimals(valueNum.current);
        onChange(str);
    }, [inputRegex]);

    // Memoized input change handler
    const handleChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const newValue = event.target.value;
            if (
                (inputRegexOverride || inputRegex).test(newValue) &&
                newValue.length <= 12
            ) {
                onChange(event);
                valueNum.current = parseFormattedWithOnlyDecimals(newValue);
            }
        },
        [
            inputRegex,
            onChange,
            parseFormattedWithOnlyDecimals,
            inputRegexOverride,
        ],
    );

    useEffect(() => {
        if (!value) {
            valueNum.current = null;
            return;
        }
        valueNum.current = parseFormattedWithOnlyDecimals(value);
    }, [parseFormattedWithOnlyDecimals, value]);

    return (
        <>
            <input
                {...(id && { id })}
                type='text'
                value={value}
                onChange={handleChange}
                onFocus={onFocus}
                onBlur={onBlur}
                onKeyDown={onKeyDown}
                className={styles.numFormattedInput + ' ' + className}
                aria-label={ariaLabel}
                {...(dataModalInitialFocus
                    ? { 'data-modal-initial-focus': true }
                    : {})}
                inputMode='numeric'
                placeholder={placeholder}
                autoComplete='off'
                spellCheck={false}
                autoFocus={autoFocus}
            />
        </>
    );
};

export default NumFormattedInput;
