import React, { useCallback, useMemo } from 'react';
import ComboBox from '~/components/Inputs/ComboBox/ComboBox';
import NumFormattedInput from '~/components/Inputs/NumFormattedInput/NumFormattedInput';
import styles from './ChaseDistance.module.css';
import type { OrderBookMode } from '~/utils/orderbook/OrderBookIFs';
import Tooltip from '~/components/Tooltip/Tooltip';
import { LuCircleHelp } from 'react-icons/lu';

interface PropsIF {
    value: string;
    onChange: (event: React.ChangeEvent<HTMLInputElement> | string) => void;
    onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
    onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
    className?: string;
    ariaLabel?: string;
    selectedMode: OrderBookMode;
    setSelectedMode: React.Dispatch<React.SetStateAction<OrderBookMode>>;
    symbol?: string; // Optional symbol for absolute mode
}

const ChaseDistance: React.FC<PropsIF> = React.memo((props) => {
    const {
        value,
        onChange,
        onBlur,
        onKeyDown,
        className,
        ariaLabel,
        selectedMode,
        setSelectedMode,
        symbol = 'ETH',
    } = props;

    const comboBoxOptions = useMemo(
        () => ['%', symbol.toUpperCase()],
        [symbol],
    );

    const handleComboBoxChange = useCallback(
        (val: string | number) => {
            const s = String(val);
            setSelectedMode(s === symbol.toUpperCase() ? 'symbol' : 'usd');
        },
        [setSelectedMode, symbol],
    );

    return (
        <div className={styles.chaseDistanceContainer}>
            <div className={styles.chaseDistanceContent}>
                <NumFormattedInput
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    onKeyDown={onKeyDown}
                    className={className}
                    aria-label={ariaLabel}
                    placeholder='Chase Distance'
                />
                <button className={styles.unitButton}>
                    <ComboBox
                        value={
                            selectedMode === 'symbol'
                                ? symbol.toUpperCase()
                                : 'USD'
                        }
                        options={comboBoxOptions}
                        onChange={handleComboBoxChange}
                    />
                </button>
            </div>
            <div className={styles.tooltipContainer}>
                <div className={styles.detailLabel}>
                    <span>Max Bid</span>
                    <Tooltip content={'max bid explanation'} position='right'>
                        <LuCircleHelp size={12} />
                    </Tooltip>
                </div>
                <span className={styles.detailValue}>5.932</span>
            </div>
        </div>
    );
});

export default ChaseDistance;
