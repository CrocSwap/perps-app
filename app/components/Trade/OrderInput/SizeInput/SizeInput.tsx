import { FaChevronDown } from 'react-icons/fa';
import styles from './SizeInput.module.css';
import { useTradeDataStore } from '~/stores/TradeDataStore';
import { useTradeModuleStore } from '~/stores/TradeModuleStore';
import { useEffect, useState } from 'react';

interface PropsIF {
    value: string;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
    onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
    className?: string;
    ariaLabel?: string;
    useTotalSize: boolean;
}
export default function SizeInput(props: PropsIF) {
    const { value, onChange, onBlur, onKeyDown, className, ariaLabel, useTotalSize } = props;
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = event.target.value;
        if (/^\d*\.?\d*$/.test(newValue) && newValue.length <= 12) {
            onChange(event);
        }
    };
    const {symbol} = useTradeDataStore();
    const {tradeSlot} = useTradeModuleStore();
    const [animationClass, setAnimationClass] = useState('');


    useEffect(() => {
        if(tradeSlot){
            setAnimationClass('boxShadowFlash');
            setTimeout(() => {
                setAnimationClass('');
            }, 1000);
        }
    }, [tradeSlot]);

    return (
        <div className={`${styles.sizeInputContainer} ${animationClass}`}>
            <span>{useTotalSize ? 'Total Size' : 'Size'}</span>
            <input
                type='text'
                value={value}
                onChange={handleChange}
                onBlur={onBlur}
                onKeyDown={onKeyDown}
                className={className}
                aria-label={ariaLabel}
                inputMode='numeric'
                pattern='[0-9]*'
                placeholder='Enter Size'
            />
            <button className={styles.tokenButton}>{symbol} <FaChevronDown />
            </button>
        </div>
    );
}
