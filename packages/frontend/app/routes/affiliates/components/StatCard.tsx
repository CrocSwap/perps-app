import { IoInformationCircleOutline } from 'react-icons/io5';
import styles from '../affiliates.module.css';
import Tooltip from '~/components/Tooltip/Tooltip';
import SimpleButton from '~/components/SimpleButton/SimpleButton';

interface PropsIF {
    label: string;
    value: string;
    tooltip?: string;
    breakdown?: {
        claimed: string;
        unclaimed: string;
    };
    actionButton?: {
        text: string;
        onClick: () => void;
    };
}

export function StatCard(props: PropsIF) {
    const { label, value, tooltip, breakdown, actionButton } = props;

    return (
        <div
            className={`${styles['stat-card']} ${breakdown ? styles['stat-card-with-breakdown'] : ''}`}
        >
            <div className={styles['stat-label']}>
                {label}
                {tooltip && (
                    <Tooltip
                        className={styles['tooltip-trigger']}
                        content={tooltip}
                        position='right'
                    >
                        <IoInformationCircleOutline size={14} />
                    </Tooltip>
                )}
            </div>
            <div className={styles['stat-value']}>{value}</div>

            {breakdown && (
                <div className={styles['stat-breakdown']}>
                    <div className={styles['breakdown-row']}>
                        <span className={styles['breakdown-label']}>
                            Claimed:
                        </span>
                        <span className={styles['breakdown-value']}>
                            {breakdown.claimed}
                        </span>
                    </div>
                    <div className={styles['breakdown-row']}>
                        <span className={styles['breakdown-label']}>
                            Unclaimed:
                        </span>
                        <span className={styles['breakdown-value']}>
                            {breakdown.unclaimed}
                        </span>
                    </div>
                </div>
            )}

            {actionButton && (
                <div className={styles['stat-action']}>
                    <SimpleButton
                        bg='accent1'
                        hoverBg='accent2'
                        className={styles['stat-button']}
                        onClick={actionButton.onClick}
                    >
                        {actionButton.text}
                    </SimpleButton>
                </div>
            )}
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
