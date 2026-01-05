import styles from '../affiliates.module.css';

export function ApplicationPendingCard() {
    return (
        <div className={styles['glass-card']}>
            <div style={{ textAlign: 'center', padding: '2rem' }}>
                <h2
                    style={{
                        marginBottom: '0.75rem',
                        fontSize: '1.25rem',
                        fontWeight: 600,
                        color: 'var(--aff-text-primary)',
                    }}
                >
                    Application Submitted
                </h2>
                <p style={{ color: 'var(--aff-text-secondary)' }}>
                    Thanks for applying. Your application is pending review.
                </p>
            </div>
        </div>
    );
}
