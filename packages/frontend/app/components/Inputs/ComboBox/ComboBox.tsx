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

    const isRecord = (o: unknown): o is object =>
        typeof o === 'object' && o !== null;

    const getOptionValue = (
        option: Option,
        fieldName?: string,
    ): string | number => {
        if (fieldName && isRecord(option)) {
            // es-lint disable-next-line
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
                data-combobox-root
            >
                <div
                    ref={comboBoxValueRef}
                    className={styles.comboBoxValueContainer}
                    onClick={(e) => {
                        e.stopPropagation();

                        e.nativeEvent?.stopImmediatePropagation?.();
                        setIsOpen((o) => !o);
                    }}
                >
                    <div className={styles.comboBoxValue}>
                        {modifyValue ? modifyValue(value) : value}{' '}
                    </div>
                    <div
                        className={`${styles.comboBoxIcon} ${isOpen ? styles.comboBoxIconOpen : ''}`}
                    >
                        <GoChevronDown size={30} />
                    </div>
                </div>

                {isOpen && (
                    <div
                        ref={comboBoxOptionsRef}
                        className={styles.comboBoxOptionsWrapper}
                    >
                        {(options ?? [])
                            .filter((o): o is Option => o != null)
                            .map((option) => {
                                const optVal = getOptionValue(
                                    option,
                                    fieldName,
                                );
                                return (
                                    <div
                                        key={optionKey(option, fieldName)}
                                        className={
                                            isSelected(option, value, fieldName)
                                                ? styles.comboBoxOptionSelected
                                                : ''
                                        }
                                        onClick={() => optionOnClick(option)}
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
        </>
    );
};

export default ComboBox;
