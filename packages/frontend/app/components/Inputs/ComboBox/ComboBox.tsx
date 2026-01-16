import { useEffect, useRef, useState, type ReactNode } from 'react';
import styles from './ComboBox.module.css';
import useOutsideClick from '~/hooks/useOutsideClick';
import { GoChevronDown } from 'react-icons/go';

type Option = string | number | object;
type CssPositioning = 'fixed' | 'absolute' | 'relative' | 'static' | 'sticky';

interface ComboBoxProps {
    value: string | number | undefined;
    options: Option[];
    fieldName?: string;
    onChange: (value: string | number) => void;
    modifyOptions?: (value: string | number) => ReactNode;
    modifyValue?: (value: string | number | undefined) => ReactNode;
    cssPositioning?: CssPositioning;
    type?: 'big-val';
    noMinWidth?: boolean;
    width?: string;
    centered?: boolean;
}

const ComboBox: React.FC<ComboBoxProps> = ({
    value,
    options,
    fieldName,
    onChange,
    modifyOptions,
    modifyValue,
    type,
    cssPositioning,
    noMinWidth,
    width,
    centered,
}) => {
    const [isOpen, setIsOpen] = useState(false);

    const comboBoxRef = useOutsideClick<HTMLDivElement>(() => {
        setIsOpen(false);
    }, isOpen);

    const comboBoxValueRef = useRef<HTMLButtonElement>(null);
    const comboBoxOptionsRef = useRef<HTMLDivElement>(null);

    const isRecord = (o: unknown): o is object =>
        typeof o === 'object' && o !== null;

    const getOptionValue = (
        option: Option,
        fieldName?: string,
    ): string | number => {
        if (fieldName && isRecord(option)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const v = (option as any)[fieldName];
            return typeof v === 'string' || typeof v === 'number' ? v : '';
        }
        return option as string | number;
    };

    const optionKey = (option: Option, fieldName?: string) => {
        const k = getOptionValue(option, fieldName);
        return typeof k === 'string' || typeof k === 'number'
            ? k
            : JSON.stringify(option);
    };

    const isSelected = (
        option: Option,
        value: string | number | undefined,
        fieldName?: string,
    ) => value !== undefined && getOptionValue(option, fieldName) === value;

    const optionOnClick = (option: Option) => {
        onChange(getOptionValue(option, fieldName));
        setIsOpen(false);
    };

    const getClassName = () => {
        switch (type) {
            case 'big-val':
                return styles.bigVal;
            default:
                return '';
        }
    };

    useEffect(() => {
        if (width && comboBoxRef.current) {
            comboBoxRef.current.style.width = width;
        }
        if (centered && comboBoxValueRef.current) {
            comboBoxValueRef.current.style.justifyContent = 'center';
        }
    }, [width, centered]);

    useEffect(() => {
        if (
            cssPositioning === 'fixed' &&
            comboBoxOptionsRef.current &&
            comboBoxValueRef.current
        ) {
            const valueRect = comboBoxValueRef.current.getBoundingClientRect();
            const optionsEl = comboBoxOptionsRef.current;

            optionsEl.style.top = `${valueRect.top + valueRect.height + 4}px`;
            optionsEl.style.width = `${valueRect.width}px`;
            optionsEl.style.left = `${valueRect.left}px`;
            optionsEl.style.position = 'fixed';
        }
    }, [cssPositioning, isOpen]);

    return (
        <div
            className={`${styles.comboBoxContainer} ${getClassName()}`}
            ref={comboBoxRef}
            data-combobox-root
        >
            <button
                type='button'
                ref={comboBoxValueRef}
                className={styles.comboBoxValueContainer}
                onClick={(e) => {
                    e.stopPropagation();
                    e.nativeEvent?.stopImmediatePropagation?.();
                    setIsOpen((o) => !o);
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                        setIsOpen(false);
                    } else if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setIsOpen(!isOpen);
                    } else if (e.key === 'ArrowDown' && !isOpen) {
                        e.preventDefault();
                        setIsOpen(true);
                    }
                }}
                aria-haspopup='listbox'
                aria-expanded={isOpen}
            >
                <div
                    className={styles.comboBoxValue}
                    style={{ minWidth: noMinWidth ? '0' : '2rem' }}
                >
                    {modifyValue ? modifyValue(value) : value}
                </div>

                <div
                    className={`${styles.comboBoxIcon} ${
                        isOpen ? styles.comboBoxIconOpen : ''
                    }`}
                >
                    <GoChevronDown size={30} />
                </div>
            </button>

            {isOpen && (
                <div
                    ref={comboBoxOptionsRef}
                    className={styles.comboBoxOptionsWrapper}
                    role='listbox'
                >
                    {(options ?? [])
                        .filter((o): o is Option => o != null)
                        .map((option) => {
                            const optVal = getOptionValue(option, fieldName);
                            return (
                                <div
                                    key={optionKey(option, fieldName)}
                                    className={
                                        isSelected(option, value, fieldName)
                                            ? styles.comboBoxOptionSelected
                                            : ''
                                    }
                                    onClick={() => optionOnClick(option)}
                                    role='option'
                                    aria-selected={isSelected(
                                        option,
                                        value,
                                        fieldName,
                                    )}
                                    tabIndex={0}
                                >
                                    {modifyOptions
                                        ? modifyOptions(optVal)
                                        : optVal}
                                </div>
                            );
                        })}
                </div>
            )}
        </div>
    );
};

export default ComboBox;
