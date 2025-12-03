import { motion } from 'framer-motion';
import { MdSearchOff } from 'react-icons/md';
import styles from './NoDataRow.module.css';

interface NoDataRowProps {
    text?: string;
    actionLabel?: string;
    onAction?: () => void;
}

const NoDataRow: React.FC<NoDataRowProps> = ({
    text = 'Data unavailable',
    actionLabel,
    onAction,
}) => {
    return (
        <>
            <div className={styles.noDataWrapper}>
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    <MdSearchOff className={styles.noDataIcon} />
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2, delay: 0.2 }}
                    className={styles.noDataText}
                >
                    {text}
                </motion.div>
                {actionLabel && onAction && (
                    <motion.button
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2, delay: 0.3 }}
                        className={styles.actionButton}
                        onClick={onAction}
                    >
                        {actionLabel}
                    </motion.button>
                )}
            </div>
        </>
    );
};

export default NoDataRow;
