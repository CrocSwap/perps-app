import styles from './ToggleSwitch.module.css';
import { AnimatePresence, motion } from 'framer-motion';

export interface ToggleSwitchProps {
    isOn: boolean;
    onToggle: (newState?: boolean) => void;
    label?: string;
    hideLabel?: boolean;
    reverse?: boolean;
}

export default function ToggleSwitch(props: ToggleSwitchProps) {
    const {
        isOn,
        onToggle,
        label = 'Hide Small Balances',
        hideLabel = false,
        reverse,
    } = props;

    const handleToggle = () => {
        onToggle(!isOn);
    };

    return (
        <div
            className={`${styles.toggleContainer} ${reverse ? styles.reverse : ''}`}
            onClick={handleToggle}
        >
            {!hideLabel && label && (
                <span className={styles.toggleLabel}>{label}</span>
            )}
            <div
                className={`${styles.toggleSwitch} ${isOn ? styles.toggleSwitchOn : ''}`}
                role='switch'
                aria-checked={isOn}
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        handleToggle();
                        e.preventDefault();
                    }
                }}
            >
                <AnimatePresence>
                    {isOn && (
                        <motion.span
                            key='checkmark'
                            initial={{ scale: 0.3, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.3, opacity: 0 }}
                            transition={{
                                type: 'spring',
                                stiffness: 350,
                                damping: 20,
                            }}
                            className={styles.checkmark}
                        >
                            ✓
                        </motion.span>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
