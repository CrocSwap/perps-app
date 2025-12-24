import { useEffect, useRef, useState } from 'react';
import styles from './ComboBox.module.css';
import { FaChevronDown } from 'react-icons/fa';
import useOutsideClick from '~/hooks/useOutsideClick';

interface ComboBoxProps {
    value: any;
    options: any[];
    fieldName?: string;
    onChange: (value: any) => void;
    modifyOptions?: (value: any) => string;
    modifyValue?: (value: any) => string;
    cssPositioning?: string;
    type?: 'big-val';
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
    width,
    centered,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const comboBoxRef = useOutsideClick<HTMLDivElement>(() => {
        setIsOpen(false);
    }, isOpen);
    const comboBoxValueRef = useRef<HTMLButtonElement>(null);
    const comboBoxOptionsRef = useRef<HTMLDivElement>(null);

    const optionOnClick = (option: any) => {
        onChange(fieldName ? option[fieldName] : option);
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
            const valueRect = comboBoxValueRef.current?.getBoundingClientRect();
            const options = comboBoxOptionsRef.current;

            options.style.top = `${valueRect.top + valueRect.height + 4}px`;
            options.style.width = `${valueRect.width}px`;
            options.style.left = `${valueRect.left}px`;

            options.style.position = 'fixed';
        }
    }, [cssPositioning, isOpen]);

    return (
        <>
            <div
                className={`${styles.comboBoxContainer} ${getClassName()}`}
                ref={comboBoxRef}
            >
                <button
                    type='button'
                    ref={comboBoxValueRef}
                    className={styles.comboBoxValueContainer}
                    onClick={(e) => {
                        e.stopPropagation();
                        e.nativeEvent.stopImmediatePropagation();
                        setIsOpen(!isOpen);
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
                    <span className={styles.comboBoxValue}>
                        {modifyValue ? modifyValue(value) : value}{' '}
                    </span>
                    <FaChevronDown
                        className={`${styles.comboBoxIcon} ${isOpen ? styles.comboBoxIconOpen : ''}`}
                        aria-hidden='true'
                    />
                </button>

                {isOpen && (
                    <div
                        ref={comboBoxOptionsRef}
                        className={styles.comboBoxOptionsWrapper}
                        role='listbox'
                    >
                        {options.map((option, index) => {
                            const optionValue = fieldName
                                ? option[fieldName]
                                : option;
                            const isSelected = optionValue === value;
                            return (
                                <div
                                    key={optionValue}
                                    className={
                                        isSelected
                                            ? styles.comboBoxOptionSelected
                                            : ''
                                    }
                                    onClick={() => optionOnClick(option)}
                                    onKeyDown={(e) => {
                                        if (
                                            e.key === 'Enter' ||
                                            e.key === ' '
                                        ) {
                                            e.preventDefault();
                                            optionOnClick(option);
                                        } else if (e.key === 'Escape') {
                                            setIsOpen(false);
                                        }
                                    }}
                                    role='option'
                                    aria-selected={isSelected}
                                    tabIndex={0}
                                >
                                    {fieldName
                                        ? modifyOptions
                                            ? modifyOptions(option[fieldName])
                                            : option[fieldName]
                                        : modifyOptions
                                          ? modifyOptions(option)
                                          : option}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
};

export default ComboBox;
