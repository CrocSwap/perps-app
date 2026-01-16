import { IoInformationCircleOutline } from 'react-icons/io5';
import styles from '../affiliates.module.css';

interface StatCardProps {
    label: string;
    value: string;
    tooltip?: string;
}

export function StatCard({ label, value, tooltip }: StatCardProps) {
    return (
        <div className={styles['stat-card']}>
            <div className={styles['stat-label']}>
                {label}
                {tooltip && (
                    <span className={styles['tooltip-trigger']} title={tooltip}>
                        <IoInformationCircleOutline size={14} />
                    </span>
                )}
            </div>
            <div className={styles['stat-value']}>{value}</div>
        </div>
    );
}

export function StatCardSkeleton({ label }: { label: string }) {
    return (
        <div className={styles['stat-card']}>
            <div className={styles['stat-label']}>{label}</div>
            <div
                className={styles.skeleton}
                style={{ height: '2rem', width: '60%' }}
            />
        </div>
    );
}
