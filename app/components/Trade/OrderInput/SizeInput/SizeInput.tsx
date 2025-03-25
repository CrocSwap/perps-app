import { FaChevronDown } from 'react-icons/fa';
import styles from './SizeInput.module.css';

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
        if (/^\d*$/.test(newValue) && newValue.length <= 12) {
            onChange(event);
        }
    };
    return (
        <div className={styles.sizeInputContainer}>
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
            <button className={styles.tokenButton}>ETH <FaChevronDown />
            </button>
        </div>
    );
}
