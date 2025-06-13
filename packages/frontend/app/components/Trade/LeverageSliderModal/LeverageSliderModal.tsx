import React, { useEffect, useRef, useState } from 'react';
import styles from './LeverageSliderModal.module.css';
import Modal from '~/components/Modal/Modal';
import Tooltip from '~/components/Tooltip/Tooltip';
import { BsQuestionCircle } from 'react-icons/bs';
import SimpleButton from '~/components/SimpleButton/SimpleButton';

interface LeverageSliderModalProps {
    currentLeverage: number;
    maxLeverage: number;
    onClose: () => void;
    onConfirm?: (newLeverage: number) => void;
}

export default function LeverageSliderModal({
    currentLeverage,
    maxLeverage,
    onClose,
    onConfirm,
}: LeverageSliderModalProps) {
    const [value, setValue] = useState<number>(currentLeverage);
    const [inputValue, setInputValue] = useState<string>(
        currentLeverage.toString(),
    );
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [tickMarks, setTickMarks] = useState<number[]>([]);

    const sliderRef = useRef<HTMLDivElement>(null);
    const min = 1;
    const max = maxLeverage;

    // Update input value when value changes
    useEffect(() => {
        setInputValue(value.toString());
    }, [value]);

    // Generate logarithmic tick marks
    useEffect(() => {
        const generateTicks = (minimum: number, maximum: number): number[] => {
            const safeMin = Math.max(0.1, minimum);
            const minLog = Math.log(safeMin);
            const maxLog = Math.log(maximum);
            const ticks = [minimum];

            // Generate 3 intermediate points logarithmically
            const step = (maxLog - minLog) / 4;
            for (let i = 1; i < 4; i++) {
                const logValue = minLog + step * i;
                const tickValue = Math.round(Math.exp(logValue));
                if (
                    tickValue > ticks[ticks.length - 1] &&
                    tickValue < maximum
                ) {
                    ticks.push(tickValue);
                }
            }

            if (ticks[ticks.length - 1] !== maximum) {
                ticks.push(maximum);
            }

            return ticks;
        };

        setTickMarks(generateTicks(min, max));
    }, [min, max]);

    // Convert value to percentage position (logarithmic)
    const valueToPercentage = (val: number): number => {
        const safeVal = Math.max(min, Math.min(max, val));
        const safeMin = Math.max(0.1, min);

        const minLog = Math.log(safeMin);
        const maxLog = Math.log(max);
        const valueLog = Math.log(safeVal);

        return ((valueLog - minLog) / (maxLog - minLog)) * 100;
    };

    // Convert percentage to value (logarithmic)
    const percentageToValue = (percentage: number): number => {
        const boundedPercentage = Math.max(0, Math.min(100, percentage));
        const safeMin = Math.max(0.1, min);

        const minLog = Math.log(safeMin);
        const maxLog = Math.log(max);
        const valueLog = minLog + (boundedPercentage / 100) * (maxLog - minLog);

        return Math.exp(valueLog);
    };

    // Handle track click
    const handleTrackClick = (e: React.MouseEvent) => {
        if (!sliderRef.current || isDragging) return;

        const rect = sliderRef.current.getBoundingClientRect();
        const offsetX = Math.max(
            0,
            Math.min(e.clientX - rect.left, rect.width),
        );
        const percentage = (offsetX / rect.width) * 100;
        const newValue = Math.round(percentageToValue(percentage));
        const boundedValue = Math.max(min, Math.min(max, newValue));

        setValue(boundedValue);
    };

    // Handle dragging
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging || !sliderRef.current) return;

            e.preventDefault();

            const rect = sliderRef.current.getBoundingClientRect();
            const offsetX = Math.max(
                0,
                Math.min(e.clientX - rect.left, rect.width),
            );
            const percentage = (offsetX / rect.width) * 100;
            const newValue = Math.round(percentageToValue(percentage));
            const boundedValue = Math.max(min, Math.min(max, newValue));

            setValue(boundedValue);
        };

        /*************  ✨ Windsurf Command ⭐  *************/
        /*******  06236f54-2b32-4775-8149-244f4488cc3b  *******/
        const handleMouseUp = () => {
            setIsDragging(false);
        };

        // Always add listeners when component mounts, check isDragging inside handlers
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, min, max]);

    const handleKnobMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    };

    const handleInputBlur = () => {
        const newValue = parseFloat(inputValue);
        if (!isNaN(newValue)) {
            const boundedValue = Math.max(
                min,
                Math.min(max, Math.round(newValue)),
            );
            setValue(boundedValue);
        } else {
            setInputValue(value.toString());
        }
    };

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.currentTarget.blur();
        }
    };

    const handleConfirm = () => {
        if (onConfirm) {
            onConfirm(value);
        }
        onClose();
    };

    const knobPosition = valueToPercentage(value);

    return (
        <Modal title='Adjust Leverage' close={onClose}>
            <div className={styles.leverageSliderContainer}>
                <div className={styles.inputContainer}>
                    {/* Input field */}
                    <input
                        type='text'
                        value={inputValue}
                        onChange={handleInputChange}
                        onBlur={handleInputBlur}
                        onKeyDown={handleInputKeyDown}
                        className={styles.valueInput}
                    />
                </div>

                {/* Slider container */}
                <div className={styles.sliderContainer}>
                    <div
                        ref={sliderRef}
                        onClick={handleTrackClick}
                        className={styles.sliderTrack}
                    >
                        {/* Active track */}
                        <div
                            className={`${styles.sliderActive} ${isDragging ? styles.dragging : ''}`}
                            style={{ width: `${knobPosition}%` }}
                        />

                        {/* Tick marks */}
                        {tickMarks.map((tickValue, index) => {
                            const position = valueToPercentage(tickValue);
                            const isActive = tickValue <= value;

                            return (
                                <div
                                    key={index}
                                    className={`${styles.sliderMarker} ${isActive ? styles.active : styles.inactive}`}
                                    style={{ left: `${position}%` }}
                                />
                            );
                        })}

                        {/* Slider knob */}
                        <div
                            onMouseDown={handleKnobMouseDown}
                            className={`${styles.sliderKnob} ${isDragging ? styles.dragging : ''}`}
                            style={{ left: `${knobPosition}%` }}
                        />
                    </div>

                    {/* Labels */}
                    <div className={styles.labelContainer}>
                        {tickMarks.map((tickValue, index) => {
                            const position = valueToPercentage(tickValue);
                            const isActive = tickValue <= value;

                            return (
                                <div
                                    key={index}
                                    onClick={() => setValue(tickValue)}
                                    className={`${styles.valueLabel} ${isActive ? styles.active : styles.inactive}`}
                                    style={{
                                        left: `calc(${position}% * 0.96 + 1%)`,
                                    }}
                                >
                                    {tickValue}×
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className={styles.maxPositionContainer}>
                    <p>
                        Max position at Current Leverage
                        <Tooltip
                            content='max position at current level'
                            position='right'
                        >
                            <BsQuestionCircle size={12} />
                        </Tooltip>
                    </p>
                    <span>100,000 USD</span>
                </div>

                {/* Action buttons */}
                <div className={styles.buttonContainer}>
                    <SimpleButton onClick={onClose} bg='dark4'>
                        Cancel
                    </SimpleButton>
                    <SimpleButton onClick={handleConfirm} bg='accent1'>
                        Confirm
                    </SimpleButton>
                </div>
            </div>
        </Modal>
    );
}
