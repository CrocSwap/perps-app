import type { IconType } from 'react-icons';
import styles from '../affiliates.module.css';

interface EmptyStateProps {
    icon: IconType;
    title: string;
    description: string;
}

export function EmptyState({
    icon: Icon,
    title,
    description,
}: EmptyStateProps) {
    return (
        <div className={styles['empty-state']}>
            <Icon className={styles['empty-state-icon']} />
            <h3 className={styles['empty-state-title']}>{title}</h3>
            <p className={styles['empty-state-description']}>{description}</p>
        </div>
    );
}
