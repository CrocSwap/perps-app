import {
    IoOpenOutline,
    IoChatbubbleEllipses,
    IoHelpCircleOutline,
} from 'react-icons/io5';
import { ViewLayout } from '../components/ViewLayout';
import styles from '../affiliates.module.css';

export function ResourcesView() {
    return (
        <ViewLayout title='Resources'>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem',
                }}
            >
                {/* Welcome Package */}
                <div className={styles['glass-card']}>
                    <h2
                        style={{
                            marginBottom: '0.25rem',
                            fontSize: '1rem',
                            fontWeight: 600,
                            color: 'var(--aff-text-primary)',
                        }}
                    >
                        Welcome Package
                    </h2>
                    <p
                        style={{
                            marginBottom: '1rem',
                            fontSize: '0.875rem',
                            color: 'var(--aff-text-tertiary)',
                        }}
                    >
                        Get started with our comprehensive guide covering
                        everything you need to know about the affiliate program
                    </p>
                    <button
                        className={`${styles.btn} ${styles['btn-primary']}`}
                    >
                        Go to Welcome Package
                        <IoOpenOutline size={14} />
                    </button>
                </div>

                {/* Program Rules */}
                <div className={styles['glass-card']}>
                    <h2
                        style={{
                            marginBottom: '1rem',
                            fontSize: '1rem',
                            fontWeight: 600,
                            color: 'var(--aff-text-primary)',
                        }}
                    >
                        Program Rules
                    </h2>
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.75rem',
                        }}
                    >
                        {[
                            {
                                title: 'Eligible Activities',
                                description:
                                    'Earn commissions on all trading activities from users who sign up through your referral link',
                            },
                            {
                                title: 'Commission Structure',
                                description:
                                    'Commission rates are tiered based on your affiliate level and total referral volume',
                            },
                            {
                                title: 'Payment Terms',
                                description:
                                    'Commissions are paid out weekly in your preferred cryptocurrency with no minimum threshold',
                            },
                            {
                                title: 'Code of Conduct',
                                description:
                                    'Maintain honest marketing practices and comply with all applicable regulations and platform guidelines',
                            },
                            {
                                title: 'Prohibited Activities',
                                description:
                                    'Self-referrals, spam, misleading claims, and fraudulent activities are strictly prohibited and may result in termination',
                            },
                        ].map((rule, index) => (
                            <div
                                key={index}
                                style={{ display: 'flex', gap: '0.75rem' }}
                            >
                                <div
                                    style={{
                                        width: '1.5rem',
                                        height: '1.5rem',
                                        flexShrink: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderRadius: '50%',
                                        background: 'var(--aff-surface-hover)',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        color: 'var(--aff-text-primary)',
                                    }}
                                >
                                    {index + 1}
                                </div>
                                <div>
                                    <h3
                                        style={{
                                            marginBottom: '0.125rem',
                                            fontSize: '0.875rem',
                                            fontWeight: 500,
                                            color: 'var(--aff-text-primary)',
                                        }}
                                    >
                                        {rule.title}
                                    </h3>
                                    <p
                                        style={{
                                            fontSize: '0.75rem',
                                            color: 'var(--aff-text-tertiary)',
                                        }}
                                    >
                                        {rule.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Still Have Questions */}
                <div
                    className={styles['glass-card']}
                    style={{ textAlign: 'center' }}
                >
                    <IoHelpCircleOutline
                        size={28}
                        style={{
                            margin: '0 auto 0.5rem',
                            color: 'var(--aff-text-subtle)',
                        }}
                    />
                    <h2
                        style={{
                            marginBottom: '0.25rem',
                            fontSize: '1rem',
                            fontWeight: 600,
                            color: 'var(--aff-text-primary)',
                        }}
                    >
                        Still have questions?
                    </h2>
                    <p
                        style={{
                            marginBottom: '1rem',
                            fontSize: '0.875rem',
                            color: 'var(--aff-text-tertiary)',
                        }}
                    >
                        Can't find the answer you're looking for? Reach out to
                        our community
                    </p>
                    <button
                        className={`${styles.btn} ${styles['btn-secondary']}`}
                    >
                        <IoChatbubbleEllipses size={16} />
                        Contact Support
                    </button>
                </div>
            </div>
        </ViewLayout>
    );
}
