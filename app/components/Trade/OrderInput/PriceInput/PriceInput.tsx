import { useState } from 'react';
import { useEffect } from 'react';
import styles from './PriceInput.module.css';
import { useTradeModuleStore } from '~/stores/TradeModuleStore';

interface PropsIF {
    value: string;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
    onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
    className?: string;
    ariaLabel?: string;
    showMidButton: boolean;
}
export default function PriceInput(props: PropsIF) {
    const { value, onChange, onBlur, onKeyDown, className, ariaLabel, showMidButton } = props;
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = event.target.value;
        if (/^\d*\.?\d*$/.test(newValue) && newValue.length <= 12) {
            onChange(event);
        }
        
    };

    const [animationClass, setAnimationClass] = useState('');
    const {tradeSlot} = useTradeModuleStore();

    useEffect(() => {
        if(tradeSlot){
            setAnimationClass('boxShadowFlash');
            setTimeout(() => {
                setAnimationClass('');
            }, 1000);
        }
    }, [tradeSlot]);

    return (
        <div className={`${styles.priceInputContainer} ${showMidButton ? styles.chaseLimit : ''} ${animationClass}`}>
            <span>Price</span>
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
                placeholder='Enter Price'
            />
           {showMidButton && <button className={styles.midButton}>Mid </button>}
        </div>
    );
}
