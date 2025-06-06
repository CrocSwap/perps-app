import styles from './Button.module.css';

interface ButtonProps {
    size?: 'large' | 'medium' | 'small' | number;
    selected?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
    onClick?: () => void;
    fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
    size = 'medium',
    selected = false,
    disabled = false,
    children,
    onClick,
    fullWidth,
}) => {
    const baseClasses = styles.base;
    const fullWidthClasses = fullWidth ? styles.fullWidth : '';
    const sizeClasses = styles[size];
    const selectedClasses = selected ? styles.selected : styles.unselected;
    const disabledClasses = disabled ? styles.disabled : '';

    return (
        <button
            className={`
                ${baseClasses} 
                ${typeof size === 'string' && sizeClasses} 
                ${selectedClasses} 
                ${disabledClasses}
                ${fullWidthClasses}
            `}
            style={{
                width: typeof size === 'number' ? size.toString() + 'px' : '',
            }}
            disabled={disabled}
            onClick={onClick ?? undefined}
        >
            {children}
        </button>
    );
};

export default Button;
