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
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const comboBoxRef = useOutsideClick<HTMLDivElement>(() => {
        setIsOpen(false);
    }, isOpen);
    const comboBoxValueRef = useRef<HTMLDivElement>(null);
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
                <div
                    ref={comboBoxValueRef}
                    className={styles.comboBoxValueContainer}
                    onClick={(e) => {
                        e.stopPropagation();
                        e.nativeEvent.stopImmediatePropagation();
                        setIsOpen(!isOpen);
                    }}
                >
                    <div className={styles.comboBoxValue}>
                        {modifyValue ? modifyValue(value) : value}{' '}
                    </div>
                    <FaChevronDown
                        className={`${styles.comboBoxIcon} ${isOpen ? styles.comboBoxIconOpen : ''}`}
                    />
                </div>

                {isOpen && (
                    <div
                        ref={comboBoxOptionsRef}
                        className={styles.comboBoxOptionsWrapper}
                    >
                        {options.map((option) => (
                            <div
                                key={fieldName ? option[fieldName] : option}
                                className={
                                    fieldName
                                        ? option[fieldName] === value
                                            ? styles.comboBoxOptionSelected
                                            : ''
                                        : option === value
                                          ? styles.comboBoxOptionSelected
                                          : ''
                                }
                                onClick={() => optionOnClick(option)}
                            >
                                {fieldName
                                    ? modifyOptions
                                        ? modifyOptions(option[fieldName])
                                        : option[fieldName]
                                    : modifyOptions
                                      ? modifyOptions(option)
                                      : option}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};

export default ComboBox;
