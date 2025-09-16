import React from 'react';
import styles from './LeverageSlider.module.css';
import { t } from 'i18next';

interface InputFieldProps {
    value: string;
    currentValue: number;
    isDragging: boolean;
    modalMode: boolean;
    knobColor: string;
    onChange: (value: string) => void;
    onBlur: () => void;
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    formatValue: (val: number) => string;
}

export default function InputField({
    value,
    currentValue,
    isDragging,
    modalMode,
    knobColor,
    onChange,
    onBlur,
    onKeyDown,
    formatValue,
}: InputFieldProps) {
    return (
        <div
            className={
                modalMode ? styles.modalInputContainer : styles.valueDisplay
            }
        >
            <input
                type='text'
                value={isDragging ? formatValue(currentValue) : value}
                onChange={(e) => onChange(e.target.value)}
                onBlur={onBlur}
                onKeyDown={onKeyDown}
                className={
                    modalMode ? styles.modalValueInput : styles.valueInput
                }
                aria-label={t('aria.leverageValue')}
                style={{
                    color: isDragging ? knobColor : 'inherit',
                }}
                placeholder=''
            />
            {!modalMode && <span className={styles.valueSuffix}>x</span>}
        </div>
    );
}
