import { IoAlertCircleOutline } from 'react-icons/io5';
import styles from '../affiliates.module.css';

interface TableErrorStateProps {
    error: string;
    onRetry: () => void;
}

export function TableErrorState({ error, onRetry }: TableErrorStateProps) {
    return (
        <div className={styles['table-container']}>
            <div className={styles['empty-state']}>
                <IoAlertCircleOutline
                    className={styles['empty-state-icon']}
                    style={{ color: 'var(--aff-negative)' }}
                />
                <h3 className={styles['empty-state-title']}>
                    Error loading data
                </h3>
                <p className={styles['empty-state-description']}>{error}</p>
                <button
                    className={`${styles.btn} ${styles['btn-secondary']}`}
                    onClick={onRetry}
                    style={{ marginTop: '1rem' }}
                >
                    Try Again
                </button>
            </div>
        </div>
    );
}
